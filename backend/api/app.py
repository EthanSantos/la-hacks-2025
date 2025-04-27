# app.py
# FastAPI application for GrowTogether AI moderation

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import os
import random
import uuid
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import requests

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
ROBLOX_THUMBNAILS_API_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"

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

# Generate numeric IDs for Supabase compatibility
def generate_numeric_id() -> int:
    """Generate a numeric ID for database compatibility."""
    return random.randint(10000000, 99999999)

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
        # Generate numeric IDs for Supabase compatibility
        message_id = request.message_id or generate_numeric_id()
        player_id = request.player_id or generate_numeric_id()
        player_name = request.player_name or f"Player{uuid.uuid4().hex[:4]}"
        
        # Analyze sentiment using transformer models
        analysis_result = await perform_analysis(request.message)
        sentiment_score = analysis_result.sentiment.score
        emotion = get_emotion(sentiment_score)
        
        # Store data in Supabase
        if supabase:
            try:
                # Check if player exists in the players table using upsert
                player_data = {
                    "player_id": player_id,
                    "player_name": player_name,
                    "last_seen": datetime.now().isoformat()
                }
                
                player_response = supabase.table('players').upsert(player_data).execute()
                logger.info(f"Player data stored/updated in Supabase")
                
                # Store the message data
                message_data = {
                    "message_id": message_id,
                    "player_id": player_id,
                    "message": request.message,
                    "sentiment_score": sentiment_score,
                    "created_at": datetime.now().isoformat()
                }
                
                message_response = supabase.table('messages').insert(message_data).execute()
                logger.info(f"Message data stored in Supabase")
                
                # Update player sentiment score after message is stored
                try:
                    supabase.rpc('update_player_sentiment_score').execute()
                    logger.info("Player sentiment score updated via RPC")
                except Exception as score_error:
                    logger.error(f"Error updating player sentiment score: {str(score_error)}")
            
            except Exception as db_error:
                logger.error(f"Supabase storage error: {str(db_error)}")
        
        # Prepare result
        result = {
            "player_id": player_id,
            "player_name": player_name,
            "message_id": message_id,
            "message": request.message,
            "sentiment_score": sentiment_score,
            "emotion": emotion
        }
        
        logger.info(f"Returning analysis result: {result}")
        return result
        
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
        # Generate numeric IDs for Supabase compatibility
        message_id = request.message_id or generate_numeric_id()
        player_id = request.player_id or generate_numeric_id()
        player_name = request.player_name or f"Player{uuid.uuid4().hex[:4]}"
        
        logger.info(f"Processing request for player {player_name} with message ID {message_id}")
        
        # Create message context for agent workflow
        from models import Message, MessageContext
        message_context = MessageContext(id=str(player_id), username=player_name, message_id=str(message_id))
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
        if supabase:
            try:
                timestamp = datetime.now().isoformat()
                
                # Check if player exists in the players table using upsert
                player_data = {
                    "player_id": player_id,
                    "player_name": player_name,
                    "last_seen": timestamp
                }
                
                player_response = supabase.table('players').upsert(player_data).execute()
                logger.info(f"Player data stored/updated in Supabase")
                
                # Store the message data
                message_data = {
                    "message_id": message_id,
                    "player_id": player_id,
                    "message": request.message,
                    "sentiment_score": sentiment_score,
                    "created_at": timestamp
                }
                
                message_response = supabase.table('messages').insert(message_data).execute()
                logger.info(f"Message data stored in Supabase")
                
                # Update player sentiment score after message is stored
                try:
                    supabase.rpc('update_player_sentiment_score').execute()
                    logger.info("Player sentiment score updated via RPC")
                except Exception as score_error:
                    logger.error(f"Error updating player sentiment score: {str(score_error)}")
                
                # Store moderation result
                moderation_data = {
                    "message_id": message_id,
                    "player_id": player_id,
                    "moderation_decision": moderation_result.decision,
                    "moderation_reason": moderation_result.reason,
                    "actions": final_action.actions,
                    "created_at": timestamp
                }
                
                supabase.table('moderation_results').insert(moderation_data).execute()
                logger.info(f"Moderation data stored in Supabase")
                
            except Exception as db_error:
                logger.error(f"Supabase storage error: {str(db_error)}")
        
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
            player_id=str(player_id),
            player_name=player_name,
            message_id=str(message_id),
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

@app.get("/api/players")
async def get_players(authorized: bool = Depends(verify_api_key)):
    """Get all players from the database."""
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        response = supabase.table('players').select('*').execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching players: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch players: {str(e)}")

@app.get("/api/messages")
async def get_messages(
    player_id: Optional[str] = None,
    limit: int = 100,
    authorized: bool = Depends(verify_api_key)
):
    """Get messages with optional filtering by player_id."""
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        query = supabase.table('messages').select('*').order('created_at', desc=True).limit(limit)
        
        if player_id:
            # Convert string player_id to integer if it's a number
            try:
                if player_id.isdigit():
                    player_id_int = int(player_id)
                    query = query.eq('player_id', player_id_int)
                else:
                    query = query.eq('player_id', player_id)
            except (ValueError, AttributeError):
                query = query.eq('player_id', player_id)
        
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

@app.get("/api/live")
async def get_live_messages(
    limit: int = 20,
    authorized: bool = Depends(verify_api_key)
):
    """Get live messages using the get_live_messages RPC function."""
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        response = supabase.rpc('get_live_messages', {'p_limit': limit}).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching live messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch live messages: {str(e)}")

@app.get("/api/roblox-avatar")
async def get_roblox_avatar(
    userId: str,
    authorized: bool = Depends(verify_api_key)
):
    """Get Roblox avatar headshot for a user."""
    if not userId:
        raise HTTPException(status_code=400, detail="Missing userId parameter")
    
    try:
        user_id_int = int(userId)
        if user_id_int <= 0:
            raise ValueError("Invalid userId format")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid userId format")
    
    try:
        # Parameters for the Roblox API request
        roblox_params = {
            "userIds": userId,
            "size": "150x150",
            "format": "Png"
        }
        
        # Make request to Roblox API
        response = requests.get(ROBLOX_THUMBNAILS_API_URL, params=roblox_params)
        response.raise_for_status()
        
        data = response.json()
        
        if not data or 'data' not in data:
            raise HTTPException(status_code=404, detail="Avatar not found")
            
        user_data = next((item for item in data['data'] if str(item.get('targetId')) == userId), None)
        if not user_data or 'imageUrl' not in user_data:
            raise HTTPException(status_code=404, detail="Avatar not found")
            
        return {"imageUrl": user_data['imageUrl']}
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Roblox avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch avatar from Roblox")
    except Exception as e:
        logger.error(f"Unexpected error in get_roblox_avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/top-players")
async def get_top_players(
    limit: int = 10,
    authorized: bool = Depends(verify_api_key)
):
    """Get top players by sentiment score."""
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        response = supabase.rpc('get_top_players_by_sentiment', {'p_limit': limit}).execute()
        
        # Format the response to ensure we have the required fields
        formatted_data = []
        for player in response.data:
            formatted_data.append({
                "player_id": player["player_id"],
                "player_name": player["player_name"],
                "total_sentiment_score": player["total_sentiment_score"],
                "message_count": player["message_count"]
            })
        
        return formatted_data
    except Exception as e:
        logger.error(f"Error fetching top players: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch top players: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting GrowTogether AI Moderation API...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)