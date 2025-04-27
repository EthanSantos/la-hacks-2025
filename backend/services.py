# services.py
# defines the fastapi web server and api endpoints

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid
import os
import time
import logging
from typing import Optional, List, Dict, Any


from models import (
    Message, MessageContext, ScoreResponse, AnalysisResult,
    ModerationResult, MediationResult, EducationResult, FinalAction, AgentState
)
from agents import moderation_workflow, perform_analysis, logger

app = FastAPI(title="GrowTogether AI Moderation API")

# middleware for basic request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Request: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {process_time:.4f}s")
    return response

# --- Request/Response Models ---

class AnalyzeRequest(BaseModel):
    id: Optional[str] = None
    username: str
    message: str
    message_id: Optional[str] = None

class AnalyzeResponse(BaseModel):
    message_id: str
    sentiment_score: int
    detected_categories: Dict[str, float]
    moderation_decision: str
    moderation_reason: str
    notification: Optional[str] = None
    actions: List[str]
    educational_assessment: str
    educational_resources: List[Dict[str, Any]]
    conflict_assessment: str
    resolution_strategies: List[Dict[str, Any]]

# --- API Endpoints ---

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    # endpoint for full analysis using the moderation_workflow graph
    try:
        message_id = request.message_id or f"msg_{uuid.uuid4().hex[:8]}"
        player_id = request.id or f"player_{uuid.uuid4().hex[:8]}"
        logger.info(f"Endpoint /analyze: Received request for user {request.username}, message_id: {message_id}")

        context = MessageContext(id=player_id, username=request.username, message_id=message_id)
        message = Message(content=request.message, context=context)
        initial_state = {"message": message}

        # run the full agent workflow
        result = await moderation_workflow.ainvoke(initial_state)

        # extract results
        analysis_result: Optional[AnalysisResult] = result.get("analysis_result")
        moderation_result: Optional[ModerationResult] = result.get("moderation_result")
        mediation_result: Optional[MediationResult] = result.get("mediation_result")
        education_result: Optional[EducationResult] = result.get("education_result")
        final_action: Optional[FinalAction] = result.get("final_action")

        # check if critical steps produced results
        if not final_action or not analysis_result:
             logger.error(f"Endpoint /analyze: Critical steps missing (FinalAction: {final_action is not None}, Analysis: {analysis_result is not None}) for message_id {message_id}.")
             if final_action:
                 return JSONResponse(
                    status_code=500,
                    content={
                        "message_id": message_id,
                        "sentiment_score": analysis_result.sentiment.score if analysis_result else -999,
                        "detected_categories": {cat.value: round(score, 4) for cat, score in analysis_result.categories} if analysis_result else {"error": 1.0},
                        "moderation_decision": final_action.decision,
                        "moderation_reason": moderation_result.reason if moderation_result else "N/A - Step Failed",
                        "notification": final_action.notification,
                        "actions": final_action.actions,
                        "educational_assessment": education_result.assessment if education_result else "N/A - Step Failed",
                        "educational_resources": [res.model_dump() for res in education_result.resources] if education_result else [],
                        "conflict_assessment": mediation_result.assessment if mediation_result else "N/A - Step Failed",
                        "resolution_strategies": [strat.model_dump() for strat in mediation_result.strategies] if mediation_result else []
                    }
                 )
             else:
                raise HTTPException(status_code=500, detail="Workflow failed critically, no final action available.")

        # prepare successful response
        logger.info(f"Endpoint /analyze: Successfully processed message_id {message_id}. Final Decision: {final_action.decision}")
        return AnalyzeResponse(
            message_id=message_id,
            sentiment_score=analysis_result.sentiment.score,
            detected_categories={cat.value: round(score, 4) for cat, score in analysis_result.categories},
            moderation_decision=final_action.decision,
            moderation_reason=moderation_result.reason if moderation_result else "N/A",
            notification=final_action.notification,
            actions=final_action.actions,
            educational_assessment=education_result.assessment if education_result else "N/A",
            educational_resources=[res.model_dump() for res in education_result.resources] if education_result else [],
            conflict_assessment=mediation_result.assessment if mediation_result else "N/A",
            resolution_strategies=[strat.model_dump() for strat in mediation_result.strategies] if mediation_result else []
        )
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Endpoint /analyze: Unhandled error for user {request.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error processing /analyze: {str(e)}")


@app.post("/score", response_model=ScoreResponse)
async def get_sentiment_score(request: AnalyzeRequest):
    # endpoint for getting score only, calls perform_analysis directly
    try:
        message_id = request.message_id or f"msg_{uuid.uuid4().hex[:8]}"
        player_id = request.id or f"player_{uuid.uuid4().hex[:8]}"
        logger.info(f"Endpoint /score: Received request for user {request.username}, message_id: {message_id}")

        analysis_result = await perform_analysis(request.message)

        if not analysis_result:
            logger.error(f"Endpoint /score: Failed to get analysis result for message_id {message_id}")
            raise HTTPException(status_code=500, detail="Failed to perform sentiment analysis.")

        sentiment_score = analysis_result.sentiment.score

        # determine emotion category based on score
        emotion = "Neutral"
        if sentiment_score > 70: emotion = "Very Positive"
        elif sentiment_score > 30: emotion = "Positive"
        elif sentiment_score >= -30: emotion = "Neutral"
        elif sentiment_score >= -70: emotion = "Negative"
        else: emotion = "Very Negative"

        logger.info(f"Endpoint /score: Successfully processed message_id {message_id}. Score: {sentiment_score}, Emotion: {emotion}")
        return ScoreResponse(
            id=player_id,
            message_id=message_id,
            username=request.username,
            message=request.message,
            sentiment_score=sentiment_score,
            emotion=emotion
        )
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Endpoint /score: Unhandled error for user {request.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error processing /score: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting GrowTogether AI Moderation API...")
    uvicorn.run("services:app", host="0.0.0.0", port=8000, reload=True)