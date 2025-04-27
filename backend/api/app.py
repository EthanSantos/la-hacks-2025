# app.py
# FastAPI application for GrowTogether AI moderation

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import os
import uuid
from datetime import datetime
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

from models import (
    AnalyzeRequest, AnalyzeResult, SentimentScore, ContentCategory
)
from agents import (
    perform_analysis, moderation_workflow, logger
)

# Load environment variables
load_dotenv()

# Configuration constants
ROBLOX_API_KEY = os.getenv("ROBLOX_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize FastAPI app
app = FastAPI(title="GrowTogether AI Moderation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")

# Database repository
class DatabaseRepository:
    def __init__(self, client: Optional[Client]):
        self.client = client
    
    def store_player(self, player_data: Dict[str, Any]) -> None:
        if not self.client:
            return
        try:
            self.client.table('players').upsert(player_data).execute()
        except Exception as e:
            logger.error(f"Error storing player data: {str(e)}")
    
    def store_message(self, message_data: Dict[str, Any]) -> None:
        if not self.client:
            return
        try:
            self.client.table('messages').insert(message_data).execute()
        except Exception as e:
            logger.error(f"Error storing message data: {str(e)}")
    
    def store_moderation_result(self, moderation_data: Dict[str, Any]) -> None:
        if not self.client:
            return
        try:
            self.client.table('moderation_results').insert(moderation_data).execute()
        except Exception as e:
            logger.error(f"Error storing moderation result: {str(e)}")

# Initialize database repository
db_repository = DatabaseRepository(supabase)

# API key verification dependency
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if ROBLOX_API_KEY and (not x_api_key or x_api_key != ROBLOX_API_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

# Helper functions
def get_emotion(sentiment_score: int) -> str:
    """Determines emotion label based on sentiment score."""
    if sentiment_score > 70: return "Very Positive"
    elif sentiment_score > 30: return "Positive"
    elif sentiment_score >= -30: return "Neutral"
    elif sentiment_score >= -70: return "Negative"
    else: return "Very Negative"

# Endpoints
@app.get("/")
async def home():
    """Root endpoint to verify API is running."""
    return {"message": "GrowTogether AI Moderation API is running", "status": "success"}

@app.post("/api/analyze")
async def analyze_message(
    request: AnalyzeRequest, 
    authorized: bool = Depends(verify_api_key)
):
    """Basic sentiment analysis endpoint."""
    try:
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
        except Exception as e:
            logger.warning(f"Database storage error: {str(e)}")
        
        return {
            "player_id": player_id,
            "player_name": player_name,
            "message_id": message_id,
            "message": request.message,
            "sentiment_score": sentiment_score,
            "emotion": emotion
        }
    except Exception as e:
        logger.error(f"Error in analyze_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/result", response_model=AnalyzeResult)
async def analyze_result(
    request: AnalyzeRequest,
    authorized: bool = Depends(verify_api_key)
):
    """Full analysis endpoint using agent workflow."""
    try:
        # Generate IDs if not provided
        message_id = request.message_id or f"msg_{uuid.uuid4().hex[:8]}"
        player_id = request.player_id or f"player_{uuid.uuid4().hex[:8]}"
        player_name = request.player_name or f"Player{uuid.uuid4().hex[:4]}"
        
        logger.info(f"Processing request for player {player_name} with message ID {message_id}")
        
        # Create message context for agent workflow
        from models import Message, MessageContext
        message_context = MessageContext(id=player_id, username=player_name, message_id=message_id)
        message = Message(content=request.message, context=message_context)
        
        # Run agent workflow
        initial_state = {"message": message}
        workflow_result = await moderation_workflow.ainvoke(initial_state)
        
        # Extract results
        analysis_result = workflow_result.get("analysis_result")
        moderation_result = workflow_result.get("moderation_result")
        mediation_result = workflow_result.get("mediation_result")
        final_action = workflow_result.get("final_action")
        
        # Handle missing critical components
        if not analysis_result or not moderation_result or not final_action:
            logger.error(f"Critical workflow components missing: analysis={bool(analysis_result)}, moderation={bool(moderation_result)}, final_action={bool(final_action)}")
            raise HTTPException(status_code=500, detail="Workflow processing failed")
        
        # Get sentiment score and emotion
        sentiment_score = analysis_result.sentiment.score
        emotion = get_emotion(sentiment_score)
        
        # Store result in database
        try:
            timestamp = datetime.now().isoformat()
            
            # Store player data
            db_repository.store_player({
                "player_id": player_id,
                "player_name": player_name,
                "last_seen": timestamp
            })
            
            # Store message data
            db_repository.store_message({
                "message_id": message_id,
                "player_id": player_id,
                "message": request.message,
                "sentiment_score": sentiment_score,
                "created_at": timestamp
            })
            
            # Store moderation result
            db_repository.store_moderation_result({
                "message_id": message_id,
                "player_id": player_id,
                "moderation_decision": moderation_result.decision,
                "moderation_reason": moderation_result.reason,
                "actions": final_action.actions,
                "created_at": timestamp
            })
        except Exception as e:
            logger.warning(f"Database storage error: {str(e)}")
        
        # Format resolution strategies
        strategies = []
        if mediation_result and mediation_result.strategies:
            strategies = [
                {
                    "title": strategy.title,
                    "description": strategy.description,
                    "example": strategy.example
                }
                for strategy in mediation_result.strategies
            ]
        
        # Prepare and return result
        return AnalyzeResult(
            player_id=player_id,
            player_name=player_name,
            message_id=message_id,
            message=request.message,
            sentiment_score=sentiment_score,
            emotion=emotion,
            moderation_decision=moderation_result.decision,
            moderation_reason=moderation_result.reason,
            conflict_assessment=mediation_result.assessment if mediation_result else "No assessment required",
            resolution_strategies=strategies,
            actions=final_action.actions
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in analyze_result: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting GrowTogether AI Moderation API...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)