# models.py
# defines data structures used throughout the application

from typing import List, Dict, Optional, Any, Literal, TypedDict, Annotated, Union, Tuple
from enum import Enum
from pydantic import BaseModel, Field, model_validator, field_validator

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
    # categories from the Vrandan/Comment-Moderation model
    OK = "OK"
    S = "S"
    H = "H"
    V = "V"
    HR = "HR"
    SH = "SH"
    S3 = "S3"
    H2 = "H2"
    V2 = "V2"

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
    details: Union[List[str], str] = Field(description="Additional details about the decision")

    @model_validator(mode='after')
    def convert_details_to_list(self) -> 'ModerationResult':
        # ensures 'details' is always a list
        if isinstance(self.details, str):
            self.details = [self.details]
        return self

class ResolutionStrategy(BaseModel):
    title: str = Field(description="Title of the resolution strategy")
    description: str = Field(description="Description of the strategy")
    example: str = Field(description="Example implementation of the strategy")

class MediationResult(BaseModel):
    assessment: Union[str, Dict[str, Any]] = Field(description="Conflict assessment")
    strategies: List[ResolutionStrategy] = Field(description="Recommended resolution strategies")

    @model_validator(mode='after')
    def convert_assessment_to_string(self) -> 'MediationResult':
        # ensures 'assessment' is stored as a string
        if isinstance(self.assessment, dict):
            self.assessment = str(self.assessment)
        elif not isinstance(self.assessment, str):
             self.assessment = str(self.assessment)
        return self

class EducationalResource(BaseModel):
    title: str = Field(description="Title of the resource")
    description: str = Field(description="Description of the resource")
    url: str = Field(description="URL to access the resource")

class EducationResult(BaseModel):
    assessment: str = Field(description="Educational assessment")
    resources: List[EducationalResource] = Field(description="Recommended resources")

    @field_validator('assessment', mode='before')
    @classmethod
    def validate_assessment_type(cls, v: Any) -> str:
        # ensure assessment is treated as string
        if isinstance(v, dict):
            return str(v)
        return v

class ActionItem(str, Enum):
    APPROVE_MESSAGE = "Approve message for public display"
    HIDE_MESSAGE = "Hide message from public view pending review"
    BLOCK_MESSAGE = "Block message from being displayed"
    AWARD_POINTS = "Award Positive Communication points to user"
    NOTIFY_USER = "Notify user of guideline violation"
    QUEUE_REVIEW = "Queue for human moderator review"
    RESTRICT_CHAT = "Restrict chat privileges temporarily"
    REQUIRE_COURSE = "Require completion of Community Standards course"

class FinalAction(BaseModel):
    decision: str = Field(description="Final decision description")
    actions: List[str] = Field(description="List of actions to be taken")
    notification: Optional[str] = Field(None, description="Notification to send to the user")

class AgentState(TypedDict):
    # defines the structure for data passed between agent graph nodes
    message: Message
    analysis_result: Optional[AnalysisResult]
    moderation_result: Optional[ModerationResult]
    mediation_result: Optional[MediationResult]
    education_result: Optional[EducationResult]
    final_action: Optional[FinalAction]

class ScoreResponse(BaseModel):
    # response model for the /score endpoint
    id: str
    message_id: str
    username: str
    message: str
    sentiment_score: int
    emotion: str