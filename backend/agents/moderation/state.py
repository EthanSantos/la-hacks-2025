from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

from models.chat import ChatMessage


# ---------- Enum Definitions ----------
class PIIType(str, Enum):
    ACCOUNTNUM = "ACCOUNTNUM"
    BUILDINGNUM = "BUILDINGNUM"
    CITY = "CITY"
    CREDITCARDNUMBER = "CREDITCARDNUMBER"
    DATEOFBIRTH = "DATEOFBIRTH"
    DRIVERLICENSENUM = "DRIVERLICENSENUM"
    EMAIL = "EMAIL"
    GIVENNAME = "GIVENNAME"
    IDCARDNUM = "IDCARDNUM"
    PASSWORD = "PASSWORD"
    SOCIALNUM = "SOCIALNUM"
    STREET = "STREET"
    SURNAME = "SURNAME"
    TAXNUM = "TAXNUM"
    TELEPHONENUM = "TELEPHONENUM"
    USERNAME = "USERNAME"
    ZIPCODE = "ZIPCODE"


class ContentType(str, Enum):
    OK = "OK"
    S = "S"
    H = "H"
    V = "V"
    HR = "HR"
    SH = "SH"
    S3 = "S3"
    H2 = "H2"
    V2 = "V2"


class ActionType(str, Enum):
    WARNING = "WARNING"
    MUTE = "MUTE"
    KICK = "KICK"
    BAN = "BAN"
    DELETE_MESSAGE = "DELETE_MESSAGE"
    ACCOUNT_RESTRICTION = "ACCOUNT_RESTRICTION"


# ---------- Pydantic Models ----------
class PIIResult(BaseModel):
    pii_presence: bool
    pii_type: Optional[PIIType] = None
    pii_intent: Optional[bool] = None


class ContentResult(BaseModel):
    main_category: ContentType
    categories: Dict[str, float]


class ModAction(BaseModel):
    action: ActionType
    reason: str


class ModerationState(BaseModel):
    message: ChatMessage
    pii_result: Optional[PIIResult] = None
    content_result: Optional[ContentResult] = None
    recommended_action: Optional[ModAction] = None
