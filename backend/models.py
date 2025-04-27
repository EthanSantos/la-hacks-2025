# models.py
# Defines core data structures using Pydantic for validation

from typing import List, Dict, Optional, Any, Literal, TypedDict, Tuple
from enum import Enum
from pydantic import BaseModel, Field, model_validator

class MessageContext(BaseModel):
    id: str = Field(description="Player ID")
    username: str = Field(description="Username of the message sender")
    message_id: str = Field(description="Unique message identifier")

class Message(BaseModel):
    content: str = Field(description="The text content of the message")
    context: MessageContext = Field(description="Contextual information about the message")

class SentimentScore(BaseModel):
    score: int = Field(description="Overall sentiment score (-100 to 100)")

class ContentCategory(str, Enum):
    """Categories from the Comment-Moderation model"""
    OK = "OK"  # No issues detected
    S = "S"    # Sexual content
    H = "H"    # Hate speech
    V = "V"    # Violence
    HR = "HR"  # Harassment
    SH = "SH"  # Self-harm
    S3 = "S3"  # Severe sexual content
    H2 = "H2"  # Severe hate speech
    V2 = "V2"  # Severe violence

class AnalysisResult(BaseModel):
    sentiment: SentimentScore = Field(description="Sentiment analysis results")
    categories: List[Tuple[ContentCategory, float]] = Field(description="Content categories identified with scores")

    @property
    def category_names(self) -> List[ContentCategory]:
        return [cat for cat, score in self.categories]

class ModerationDecision(str, Enum):
    APPROVE = "approve"
    FLAG = "flag"
    BLOCK = "block"

class ModerationResult(BaseModel):
    decision: ModerationDecision = Field(description="The moderation decision")
    reason: str = Field(description="Reason for the moderation decision")
    details: List[str] = Field(description="Additional details about the decision")

    @model_validator(mode='after')
    def convert_details_to_list(self) -> 'ModerationResult':
        # Ensures 'details' is always a list
        if isinstance(self.details, str):
            self.details = [self.details]
        return self

class ResolutionStrategy(BaseModel):
    title: str = Field(description="Title of the resolution strategy")
    description: str = Field(description="Description of the strategy")
    example: str = Field(description="Example implementation of the strategy")

class MediationResult(BaseModel):
    assessment: str = Field(description="Conflict assessment")
    strategies: List[ResolutionStrategy] = Field(description="Recommended resolution strategies")

class FinalAction(BaseModel):
    decision: str = Field(description="Final decision description")
    actions: List[str] = Field(description="List of actions to be taken")
    notification: Optional[str] = Field(None, description="Notification to send to the user")

class AgentState(TypedDict):
    """Defines the structure for data passed between agent graph nodes"""
    message: Message
    analysis_result: Optional[AnalysisResult]
    moderation_result: Optional[ModerationResult]
    mediation_result: Optional[MediationResult]
    final_action: Optional[FinalAction]

class AnalyzeRequest(BaseModel):
    message: str
    message_id: Optional[str] = None
    player_id: Optional[str] = None
    player_name: Optional[str] = None

class AnalyzeResult(BaseModel):
    player_id: str
    player_name: str
    message_id: str
    message: str
    sentiment_score: int
    emotion: str
    moderation_decision: str
    moderation_reason: str
    conflict_assessment: str
    resolution_strategies: List[Dict[str, Any]]
    actions: List[str]