from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple
import os
import uuid
from supabase import create_client, Client
from datetime import datetime
import requests
import numpy as np
from scipy.special import softmax
from enum import Enum
from dotenv import load_dotenv
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    AutoConfig,
    PreTrainedTokenizer,
    PreTrainedModel
)

# Load environment variables from .env file
load_dotenv()

# Configuration constants with proper fallbacks
ROBLOX_API_KEY = os.getenv("ROBLOX_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ROBLOX_THUMBNAILS_API_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"
SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
MODERATION_MODEL_NAME = "Vrandan/Comment-Moderation"

# Data models
class ContentCategory(str, Enum):
    OK = "OK"
    S = "S"
    H = "H"
    V = "V"
    HR = "HR"
    SH = "SH"
    S3 = "S3"
    H2 = "H2"
    V2 = "V2"

class SentimentScore(BaseModel):
    score: int = Field(description="Overall sentiment score (-100 to 100)")

class AnalysisResult(BaseModel):
    sentiment: SentimentScore
    categories: List[Tuple[ContentCategory, float]]

class AnalyzeRequest(BaseModel):
    message: str
    message_id: Optional[str] = None
    player_id: Optional[str] = None
    player_name: Optional[str] = None

class AnalyzeResponse(BaseModel):
    player_id: str
    player_name: str
    message_id: str
    message: str
    sentiment_score: int
    emotion: Optional[str] = None

class RobloxAvatarResponse(BaseModel):
    imageUrl: str

# Initialize FastAPI app
app = FastAPI(title="GrowTogether Sentiment Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client with error handling
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Sentiment analysis with transformers
class SentimentAnalyzer:
    def __init__(self, model_name: str = SENTIMENT_MODEL_NAME):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.config = AutoConfig.from_pretrained(self.model_name)

    def _preprocess(self, text: str) -> str:
        new_text = []
        for t in text.split(" "):
            t = '@user' if t.startswith('@') and len(t) > 1 else t
            t = 'http' if t.startswith('http') else t
            new_text.append(t)
        return " ".join(new_text)

    def analyze(self, text: str) -> List[Tuple[str, float]]:
        processed_text = self._preprocess(text)
        encoded_input = self.tokenizer(processed_text, return_tensors='pt')
        try:
            output = self.model(**encoded_input)
            scores = output.logits[0].detach().numpy()
            probabilities = softmax(scores)
            results_unsorted = []
            for i in range(probabilities.shape[0]):
                label = self.config.id2label[i]
                score = probabilities[i]
                results_unsorted.append((label, float(score)))
            results = sorted(results_unsorted, key=lambda item: item[1], reverse=True)
            return results
        except Exception:
            return []

class ModerationAnalyzer:
    def __init__(self, model_name: str = MODERATION_MODEL_NAME):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.labels = [self.model.config.id2label[i] for i in range(self.model.config.num_labels)]

    def analyze(self, text: str) -> List[Tuple[str, float]]:
         inputs = self.tokenizer(text, return_tensors="pt")
         try:
            outputs = self.model(**inputs)
            probabilities = outputs.logits.softmax(dim=-1).squeeze().tolist()
            results = sorted(zip(self.labels, probabilities), key=lambda item: item[1], reverse=True)
            return results
         except Exception:
            return []

# Initialize analyzers
sentiment_analyzer = SentimentAnalyzer()
moderation_analyzer = ModerationAnalyzer()

async def perform_analysis(message_content: str) -> AnalysisResult:
    """Performs analysis using transformers, returns AnalysisResult."""
    if not message_content or not message_content.strip():
        return AnalysisResult(
            sentiment=SentimentScore(score=0),
            categories=[(ContentCategory.OK, 1.0)]
        )
    
    sentiment_results = sentiment_analyzer.analyze(message_content)
    if not sentiment_results:
        final_sentiment_score = 0
    elif sentiment_results[0][0] == 'neutral':
        final_sentiment_score = 0
    else:
        sentiment_scores = {label: score for label, score in sentiment_results}
        pos_score = sentiment_scores.get('positive', 0.0)
        neg_score = sentiment_scores.get('negative', 0.0)
        scaled_score = (pos_score - neg_score) * 100
        final_sentiment_score = int(round(scaled_score))

    sentiment_obj = SentimentScore(score=final_sentiment_score)
    moderation_results = moderation_analyzer.analyze(message_content)
    
    if not moderation_results:
        category_results = [(ContentCategory.OK, 1.0)]
    else:
        category_results = []
        for label, score in moderation_results:
            try:
                category_enum = ContentCategory(label)
                category_results.append((category_enum, score))
            except ValueError:
                pass
        
        if not category_results:
            category_results = [(ContentCategory.OK, 1.0)]

    return AnalysisResult(
        sentiment=sentiment_obj,
        categories=category_results
    )

class DatabaseRepository:
    def __init__(self, client: Optional[Client]):
        self.client = client
    
    def store_player(self, player_data: Dict[str, Any]) -> None:
        if not self.client:
            return
        try:
            self.client.table('players').upsert(player_data).execute()
        except Exception:
            pass
    
    def store_message(self, message_data: Dict[str, Any]) -> None:
        if not self.client:
            return
        try:
            self.client.table('messages').insert(message_data).execute()
        except Exception:
            pass
    
    def get_players(self) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            response = self.client.table('players').select('*').execute()
            return response.data
        except Exception:
            return []
    
    def get_messages(self, player_id: Optional[str], limit: int) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            query = self.client.table('messages').select('*').order('created_at', desc=True).limit(limit)
            
            if player_id:
                query = query.eq('player_id', player_id)
            
            response = query.execute()
            return response.data
        except Exception:
            return []
    
    def get_live_messages(self, limit: int) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            response = self.client.rpc('get_live_messages', {'p_limit': limit}).execute()
            return response.data
        except Exception:
            return []

class RobloxService:
    @staticmethod
    async def get_avatar(user_id: str) -> str:
        try:
            user_id_int = int(user_id)
            if user_id_int <= 0:
                raise ValueError("Invalid userId format")
        except ValueError:
            raise ValueError("Invalid userId format")

        roblox_params = {
            "userIds": user_id,
            "size": "150x150",
            "format": "Png"
        }

        response = requests.get(ROBLOX_THUMBNAILS_API_URL, params=roblox_params)
        response.raise_for_status()
        data = response.json()
        
        if not data or 'data' not in data:
            raise ValueError("Avatar not found")
            
        user_data = next((item for item in data['data'] if str(item.get('targetId')) == user_id), None)
        if not user_data or 'imageUrl' not in user_data:
            raise ValueError("Avatar not found")
            
        return user_data['imageUrl']

# Helper functions
def get_emotion(sentiment_score: int) -> str:
    if sentiment_score > 70: return "Very Positive"
    elif sentiment_score > 30: return "Positive"
    elif sentiment_score >= -30: return "Neutral"
    elif sentiment_score >= -70: return "Negative"
    else: return "Very Negative"

# Initialize services
db_repository = DatabaseRepository(supabase)

# API key dependency
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if ROBLOX_API_KEY and (not x_api_key or x_api_key != ROBLOX_API_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

# Endpoints
@app.get("/")
async def home():
    return {"message": "Sentiment Analysis API is running", "status": "success"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_message(
    request: AnalyzeRequest, 
    authorized: bool = Depends(verify_api_key)
):
    # Generate IDs if not provided
    message_id = request.message_id or f"msg_{uuid.uuid4().hex[:8]}"
    player_id = request.player_id or f"player_{uuid.uuid4().hex[:8]}"
    player_name = request.player_name or f"Player{uuid.uuid4().hex[:4]}"
    
    # Analyze sentiment using transformer models
    analysis_result = await perform_analysis(request.message)
    sentiment_score = analysis_result.sentiment.score
    emotion = get_emotion(sentiment_score)
    
    # Store data in Supabase
    try:
        db_repository.store_player({
            "player_id": player_id,
            "player_name": player_name,
            "last_seen": datetime.now().isoformat()
        })
        
        db_repository.store_message({
            "message_id": message_id,
            "player_id": player_id,
            "message": request.message,
            "sentiment_score": sentiment_score,
            "created_at": datetime.now().isoformat()
        })
    except Exception:
        # Continue even if storage fails
        pass
    
    return AnalyzeResponse(
        player_id=player_id,
        player_name=player_name,
        message_id=message_id,
        message=request.message,
        sentiment_score=sentiment_score,
        emotion=emotion
    )

@app.get("/api/players")
async def get_players(authorized: bool = Depends(verify_api_key)):
    return db_repository.get_players()

@app.get("/api/messages")
async def get_messages(
    player_id: Optional[str] = None, 
    limit: int = 100,
    authorized: bool = Depends(verify_api_key)
):
    return db_repository.get_messages(player_id, limit)

@app.get("/api/live")
async def get_live_messages(
    limit: int = 20,
    authorized: bool = Depends(verify_api_key)
):
    return db_repository.get_live_messages(limit)

@app.get("/api/roblox-avatar", response_model=RobloxAvatarResponse)
async def get_roblox_avatar(
    userId: str,
    authorized: bool = Depends(verify_api_key)
):
    try:
        image_url = await RobloxService.get_avatar(userId)
        return RobloxAvatarResponse(imageUrl=image_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=500, detail="Failed to fetch avatar from Roblox")


""" 
use:
1. cd backend
2. uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload

"""
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)