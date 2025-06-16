from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from pathlib import Path
import google.generativeai as genai
import random
import json
import re
from supabase import create_client, Client
from datetime import datetime, timezone
import requests
import logging
from dotenv import load_dotenv
import asyncio

# Import the new AI service
from services.chat_service import ChatService
from models.chat import ChatMessage
from services.ai_service import ai_service

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sentiment Analysis API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
ROBLOX_API_KEY = os.environ.get("ROBLOX_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize APIs
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')

# Initialize Supabase client
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    logger.warning("Supabase not configured - database operations will be skipped")

ROBLOX_THUMBNAILS_API_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"

logger.info("Server starting up with configuration...")
logger.info(f"Google API Key configured: {'Yes' if GOOGLE_API_KEY else 'No'}")
logger.info(f"Roblox API Key configured: {'Yes' if ROBLOX_API_KEY else 'No'}")
logger.info(f"Supabase configured: {'Yes' if SUPABASE_URL and SUPABASE_KEY else 'No'}")
logger.info("Gemini model initialized")

# Pydantic models for request/response
class AnalyzeRequest(BaseModel):
    message: str
    message_id: str
    player_id: Optional[int] = None
    player_name: Optional[str] = None



# Simple response for Roblox - just sentiment data
class SentimentResponse(BaseModel):
    player_id: int
    player_name: str
    message_id: str
    message: str
    sentiment_score: int
    error: Optional[str] = None

# Full response for frontend - includes moderation data
class AnalyzeResponse(BaseModel):
    player_id: int
    player_name: str
    message_id: str
    message: str
    sentiment_score: int
    moderation_passed: bool
    blocked: bool
    moderation_action: Optional[str] = None
    moderation_reason: Optional[str] = None
    sentiment_details: Optional[Dict[str, Any]] = None
    community_intent: Optional[Dict[str, Any]] = None
    rewards: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Background moderation function
async def run_background_moderation(chat_message: ChatMessage, message_id: str, player_id: int, user_message: str):
    """Run moderation analysis in background and update database if needed"""
    try:
        logger.info(f"Starting background moderation for message {message_id}")
        
        # Run moderation
        chat_service = ChatService()
        moderation_state = await chat_service.moderation_service.moderate_chat_message(chat_message)
        
        # Check if moderation found issues
        if moderation_state.recommended_action:
            logger.info(f"Moderation action recommended: {moderation_state.recommended_action.action.value}")
            
            # Update the message in database with moderation results
            try:
                update_data = {
                    "moderation_action": moderation_state.recommended_action.action.value,
                    "moderation_reason": moderation_state.recommended_action.reason
                }
                
                supabase.table('messages').update(update_data).eq('message_id', message_id).execute()
                logger.info(f"Updated message {message_id} with moderation results")
                
                # Check if message should be flagged for deletion
                from agents.moderation import ActionType
                if moderation_state.recommended_action.action in [ActionType.DELETE_MESSAGE, ActionType.BAN, ActionType.KICK]:
                    logger.warning(f"Message {message_id} flagged for {moderation_state.recommended_action.action.value}")
                    
            except Exception as db_error:
                logger.error(f"Failed to update moderation results in database: {db_error}")
        else:
            logger.info(f"No moderation issues found for message {message_id}")
            
    except Exception as e:
        logger.error(f"Background moderation failed for message {message_id}: {e}")

# Dependency for API key validation
async def verify_api_key(request: Request):
    if ROBLOX_API_KEY:
        api_key = request.headers.get('X-API-Key')
        logger.info(f"API Key authentication: {'Success' if api_key == ROBLOX_API_KEY else 'Failed'}")
        if not api_key or api_key != ROBLOX_API_KEY:
            logger.info("Unauthorized access attempt - invalid API key")
            raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/")
async def home():
    logger.info("Home endpoint accessed")
    return {
        "message": "BloomAI API is running",
        "status": "success"
    }



@app.post("/api/analyze", response_model=SentimentResponse)
async def analyze_sentiment_with_background_moderation(
    request_data: AnalyzeRequest,
    _: None = Depends(verify_api_key)
):
    """
    Returns sentiment analysis immediately, runs moderation in background
    """
    user_message = request_data.message
    message_id = request_data.message_id
    player_id = request_data.player_id
    player_name = request_data.player_name
    
    # Only use random values if no player_id or player_name was provided
    if player_id is None:
        player_id = random.randint(1, 100)
    if player_name is None:
        player_name = f"Player{random.randint(1, 999)}"
    
    logger.info(f"Processing enhanced analysis: Player ID: {player_id}, Player Name: {player_name}")
    logger.info(f"Message to analyze: {user_message}")
    
    try:
        # Create ChatMessage object
        chat_message = ChatMessage(
            message_id=message_id,
            content=user_message,
            user_id=player_id,
            timestamp=datetime.now(timezone.utc),
            deleted=False
        )
        
        # Run ONLY sentiment analysis for Roblox compatibility
        chat_service = ChatService()
        sentiment_result = await chat_service.sentiment_service.analyze_message_sentiment(
            chat_message, player_name
        )
        
        # Extract sentiment score
        sentiment_score = 0
        if sentiment_result and sentiment_result.chat_analysis:
            sentiment_score = sentiment_result.chat_analysis.sentiment_score or 0
        
        logger.info(f"Sentiment analysis completed with score: {sentiment_score}")
        
        # Store the data in supabase
        try:
            # Store player data
            player_data = {
                "player_id": player_id,
                "player_name": player_name,
                "last_seen": datetime.now(timezone.utc).isoformat()
            }
            
            player_response = supabase.table('players').upsert(player_data).execute()
            logger.info(f"Player data stored/updated in Supabase")
            
            # Store the message data
            message_data = {
                "message_id": message_id,
                "player_id": player_id,
                "message": user_message,
                "sentiment_score": sentiment_score,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            message_response = supabase.table('messages').insert(message_data).execute()
            logger.info(f"Message data stored in Supabase")
            
            # Update player sentiment score after message is stored
            try:
                supabase.rpc('update_player_sentiment_score').execute()
                logger.info("Player sentiment score updated")
            except Exception as score_error:
                logger.error(f"Error updating player sentiment score: {score_error}")
        
        except Exception as db_error:
            logger.error(f"Supabase storage error: {db_error}")
        
        # Return simple sentiment result for Roblox IMMEDIATELY
        result = SentimentResponse(
            player_id=player_id,
            player_name=player_name,
            message_id=message_id,
            message=user_message,
            sentiment_score=sentiment_score
        )
        
        logger.info(f"Returning sentiment result: {result}")
        
        # Run moderation in background (after response is sent)
        asyncio.create_task(run_background_moderation(chat_message, message_id, player_id, user_message))
        
        return result
    
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        fallback_result = SentimentResponse(
            player_id=player_id,
            player_name=player_name,
            message_id=message_id,
            message=user_message,
            sentiment_score=0,
            error=str(e)
        )
        
        logger.info(f"Returning sentiment fallback result: {fallback_result}")
        return fallback_result


@app.post("/api/moderate", response_model=Dict[str, Any])
async def moderate_message_endpoint(
    request_data: AnalyzeRequest,
    _: None = Depends(verify_api_key)
):
    """
    Moderation-only endpoint for checking messages
    """
    try:
        result = await ai_service.moderate_message_only(
            message=request_data.message,
            message_id=request_data.message_id,
            user_id=request_data.player_id or random.randint(1, 100)
        )
        return result
    except Exception as e:
        logger.error(f"Error in moderation endpoint: {e}")
        return {"passed": True, "error": str(e)}

@app.get("/api/players")
async def get_players():
    try:
        response = supabase.table('players').select('*').execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching players: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch players")

@app.get("/api/messages")
async def get_messages(
    player_id: Optional[str] = Query(None),
    limit: int = Query(100)
):
    try:
        query = supabase.table('messages').select('*').order('created_at', desc=True).limit(limit)
        
        if player_id:
            query = query.eq('player_id', player_id)
        
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@app.get("/api/live")
async def get_live_messages(limit: int = Query(20)):
    try:
        # Created a sql function to handle this easily and more efficiently
        messages_response = supabase.rpc('get_live_messages', {'p_limit': limit}).execute()
        
        return messages_response.data
    except Exception as e:
        logger.error(f"Error fetching live messages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch live messages: {str(e)}")

@app.get("/api/roblox-avatar")
async def get_roblox_avatar(userId: Optional[str] = Query(None)):
    """
    Proxies requests to the Roblox Thumbnails API to fetch user avatar headshots.
    Takes 'userId' as a query parameter.
    """
    if not userId:
        logger.info("Roblox avatar proxy: Missing userId parameter")
        raise HTTPException(status_code=400, detail="Missing userId parameter")

    try:
        user_id_int = int(userId)
        if user_id_int <= 0:
            logger.info(f"Roblox avatar proxy: Invalid userId format (non-positive): {userId}")
            raise HTTPException(status_code=400, detail="Invalid userId format")
    except ValueError:
        logger.info(f"Roblox avatar proxy: Invalid userId format (not an integer): {userId}")
        raise HTTPException(status_code=400, detail="Invalid userId format")

    logger.info(f"Roblox avatar proxy: Fetching avatar for user ID: {userId}")

    # Parameters for the Roblox API request
    roblox_params = {
        "userIds": userId,  # Pass the single user ID
        "size": "150x150",  # Desired size
        "format": "Png"     # Desired format
    }

    try:
        # Make the request to the actual Roblox Thumbnails API
        roblox_response = requests.get(ROBLOX_THUMBNAILS_API_URL, params=roblox_params)
        roblox_response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

        roblox_data = roblox_response.json()
        logger.info(f"Roblox avatar proxy: Received data from Roblox API: {roblox_data}")

        # Parse the response to find the image URL
        # The response structure is { "data": [ { "targetId": ..., "state": ..., "imageUrl": ... } ] }
        image_url = None
        if roblox_data and 'data' in roblox_data and isinstance(roblox_data['data'], list):
            # Find the item matching the requested user ID
            user_data = next((item for item in roblox_data['data'] if str(item.get('targetId')) == userId), None)
            if user_data and 'imageUrl' in user_data:
                image_url = user_data['imageUrl']
                logger.info(f"Roblox avatar proxy: Found imageUrl: {image_url}")
            else:
                logger.info(f"Roblox avatar proxy: imageUrl not found in Roblox response for user ID: {userId}")

        if image_url:
            # Return the image URL to the frontend
            return {"imageUrl": image_url}
        else:
            # Return a 404 if the image URL was not found for the user
            logger.info(f"Roblox avatar proxy: Avatar not found for user ID: {userId}")
            raise HTTPException(status_code=404, detail="Avatar not found")

    except requests.exceptions.RequestException as e:
        # Handle errors during the request to Roblox API
        logger.error(f"Roblox avatar proxy: Error fetching from Roblox API: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch avatar from Roblox")
    except HTTPException:
        # Re-raise HTTPExceptions
        raise
    except Exception as e:
        # Handle any other unexpected errors
        logger.error(f"Roblox avatar proxy: An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")

@app.get("/api/top-players")
async def get_top_players(limit: int = Query(10)):
    try:
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
        logger.error(f"Error fetching top players: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch top players: {str(e)}")

@app.get("/api/analytics/all-time/sentiment-trend")
async def get_sentiment_trend_data_all_time(interval: str = Query('month')):
    try:
        if interval not in ['day', 'hour', 'week', 'month', 'year']:
            raise HTTPException(status_code=400, detail="Invalid interval unit")

        params = {'interval_unit': interval}
        # Call the all_time version of the function
        response = supabase.rpc('get_sentiment_trend_all_time', params).execute()

        if hasattr(response, 'data'):
            logger.info(f"Fetched all-time sentiment trend data for interval: {interval}")
            return response.data
        else:
            logger.error(f"Error in Supabase response for all-time sentiment trend: {response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch all-time sentiment trend data: {str(response)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all-time sentiment trend: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch all-time sentiment trend: {str(e)}")

@app.get("/api/analytics/all-time/sentiment-distribution")
async def get_sentiment_distribution_data_all_time(
    positive_threshold: int = Query(30),
    negative_threshold: int = Query(-30)
):
    try:
        params = {
            'positive_threshold': positive_threshold,
            'negative_threshold': negative_threshold
        }
        # Call the all_time version of the function
        response = supabase.rpc('get_sentiment_distribution_all_time', params).execute()

        if hasattr(response, 'data'):
            logger.info(f"Fetched all-time sentiment distribution data")
            return response.data
        else:
            logger.error(f"Error in Supabase response for all-time sentiment distribution: {response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch all-time sentiment distribution data: {str(response)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all-time sentiment distribution: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch all-time sentiment distribution: {str(e)}")

@app.get("/api/analytics/all-time/overall-stats")
async def get_overall_stats_data_all_time():
    try:
        # Call the all_time version of the function (no parameters needed)
        response = supabase.rpc('get_overall_analytics_stats_all_time', {}).execute()

        if hasattr(response, 'data'):
            logger.info(f"Fetched all-time overall stats")
            data_to_return = response.data[0] if response.data and isinstance(response.data, list) else response.data
            return data_to_return
        else:
            logger.error(f"Error in Supabase response for all-time overall stats: {response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch all-time overall stats: {str(response)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all-time overall stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch all-time overall stats: {str(e)}")

class ServiceStatus(BaseModel):
    status: str
    details: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: Dict[str, ServiceStatus]

def check_supabase_connection() -> ServiceStatus:
    """Check if Supabase connection is working"""
    try:
        if not supabase:
            return ServiceStatus(status="not_configured")
        
        # Try a simple query
        supabase.table('players').select("count").limit(1).execute()
        return ServiceStatus(status="healthy")
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        return ServiceStatus(
            status="unhealthy",
            details={"error": str(e)}
        )

def check_ai_model() -> ServiceStatus:
    """Check if Gemini AI model is working"""
    try:
        if not GOOGLE_API_KEY:
            return ServiceStatus(status="not_configured")
        
        # Try a simple generation
        response = model.generate_content("test")
        if response:
            return ServiceStatus(status="healthy")
        return ServiceStatus(status="unhealthy")
    except Exception as e:
        logger.error(f"AI model health check failed: {e}")
        return ServiceStatus(
            status="unhealthy",
            details={"error": str(e)}
        )

def check_roblox_api() -> ServiceStatus:
    """Check if Roblox API key is configured"""
    if not ROBLOX_API_KEY:
        return ServiceStatus(status="not_configured")
    return ServiceStatus(status="healthy")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint that verifies all critical services.
    Returns the status of each service and overall system health.
    """
    logger.info("Health check requested")
    
    # Check all services
    services = {
        "database": check_supabase_connection(),
        "ai_model": check_ai_model(),
        "roblox_api": check_roblox_api()
    }
    
    # Determine overall status
    overall_status = "healthy"
    for service_status in services.values():
        if service_status.status == "unhealthy":
            overall_status = "unhealthy"
            break
        elif service_status.status == "not_configured":
            overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        services=services
    )

