from dataclasses import dataclass
from pydantic_ai import Agent
from pydantic_graph import BaseNode, GraphRunContext, End
from typing import Union
import requests
import asyncio
import os
from dotenv import load_dotenv

from .state import (
    ModerationState,
    PIIResult,
    ContentResult,
    ModAction,
    PIIType,
    ContentType,
    ActionType,
)

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# ---------- Configuration Constants ----------
# API Endpoints
PII_DETECTION_API_URL = "https://router.huggingface.co/hf-inference/models/iiiorg/piiranha-v1-detect-personal-information"
CONTENT_MODERATION_API_URL = (
    "https://router.huggingface.co/hf-inference/models/KoalaAI/Text-Moderation"
)

# AI Models
GEMINI_MODEL = "google-gla:gemini-2.0-flash"

# API Configuration
API_TIMEOUT = 30

# Default Responses
DEFAULT_PII_RESPONSE = []
DEFAULT_CONTENT_RESPONSE = [{"label": "OK", "score": 1.0}]

# Agent Prompts
PII_INTENT_PROMPT = "Analyze if the message contains intent to share personal information. Return only true or false."
MODERATION_ACTION_PROMPT = (
    "Determine the appropriate moderation action for harmful content"
)


# ---------- API Functions ----------
async def detect_pii(text: str):
    def sync_query():
        try:
            response = requests.post(
                PII_DETECTION_API_URL,
                headers={"Authorization": f"Bearer {HF_TOKEN}"},
                json={"inputs": text},
                timeout=API_TIMEOUT,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"PII detection API error: {e}")
            return DEFAULT_PII_RESPONSE
        except ValueError as e:
            print(f"PII detection JSON parsing error: {e}")
            return DEFAULT_PII_RESPONSE

    return await asyncio.get_event_loop().run_in_executor(None, sync_query)


async def moderate_content(text: str):
    def sync_query():
        try:
            response = requests.post(
                CONTENT_MODERATION_API_URL,
                headers={"Authorization": f"Bearer {HF_TOKEN}"},
                json={"inputs": text},
                timeout=API_TIMEOUT,
            )
            response.raise_for_status()
            result = response.json()

            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], list):
                    return result[0]
                return result
            elif isinstance(result, dict):
                return [result]
            else:
                return DEFAULT_CONTENT_RESPONSE

        except requests.exceptions.RequestException as e:
            print(f"Content moderation API error: {e}")
            return DEFAULT_CONTENT_RESPONSE
        except ValueError as e:
            print(f"Content moderation JSON parsing error: {e}")
            return DEFAULT_CONTENT_RESPONSE

    return await asyncio.get_event_loop().run_in_executor(None, sync_query)


# ---------- AI Agents ----------
PIIAgent = Agent(GEMINI_MODEL, system_prompt=PII_INTENT_PROMPT, output_type=bool)

ModAgent = Agent(
    GEMINI_MODEL, system_prompt=MODERATION_ACTION_PROMPT, output_type=ModAction
)


# ---------- Forward Declarations ----------
class DetectPII(BaseNode[ModerationState]):
    pass


class CheckIntent(BaseNode[ModerationState]):
    pass


class ModerateContent(BaseNode[ModerationState]):
    pass


class DetermineAction(BaseNode[ModerationState]):
    pass


# ---------- Node Implementations ----------
@dataclass
class StartModeration(BaseNode[ModerationState]):
    async def run(self, ctx: GraphRunContext) -> DetectPII:
        return DetectPII()


@dataclass
class DetectPII(BaseNode[ModerationState]):
    async def run(self, ctx: GraphRunContext) -> Union[CheckIntent, End]:
        pii_data = await detect_pii(ctx.state.message.content)

        if not isinstance(pii_data, list):
            pii_data = []

        pii_presence = any(
            entity.get("entity_group") in PIIType.__members__.values()
            for entity in pii_data
            if isinstance(entity, dict) and "entity_group" in entity
        )

        pii_type = None
        if pii_presence:
            for entity in pii_data:
                if (
                    isinstance(entity, dict)
                    and entity.get("entity_group") in PIIType.__members__.values()
                ):
                    pii_type = PIIType(entity["entity_group"])
                    break

        ctx.state.pii_result = PIIResult(pii_presence=pii_presence, pii_type=pii_type)

        if pii_presence:
            ctx.state.recommended_action = ModAction(
                action=ActionType.DELETE_MESSAGE,
                reason=f"Detected {pii_type.value if pii_type else 'PII'} in message",
            )
            return End("PII detected - message blocked")

        return CheckIntent()


@dataclass
class CheckIntent(BaseNode[ModerationState]):
    async def run(self, ctx: GraphRunContext) -> Union[ModerateContent, End]:
        try:
            result = await PIIAgent.run(ctx.state.message.content)
            intent = result.output if hasattr(result, "output") else result

            if ctx.state.pii_result:
                ctx.state.pii_result.pii_intent = intent
            else:
                ctx.state.pii_result = PIIResult(pii_presence=False, pii_intent=intent)

            if intent:
                ctx.state.recommended_action = ModAction(
                    action=ActionType.DELETE_MESSAGE,
                    reason="Potential PII sharing intent detected",
                )
                return End("PII intent detected - message blocked")

        except Exception as e:
            print(f"Intent analysis error: {e}")
            if ctx.state.pii_result:
                ctx.state.pii_result.pii_intent = False
            else:
                ctx.state.pii_result = PIIResult(pii_presence=False, pii_intent=False)

        return ModerateContent()


@dataclass
class ModerateContent(BaseNode[ModerationState]):
    async def run(self, ctx: GraphRunContext) -> Union[DetermineAction, End]:
        content_data = await moderate_content(ctx.state.message.content)

        if not content_data or not isinstance(content_data, list):
            content_data = DEFAULT_CONTENT_RESPONSE

        main_item = max(content_data, key=lambda x: x.get("score", 0))
        main_category_str = main_item.get("label", "OK")

        try:
            main_category = ContentType(main_category_str)
        except ValueError:
            print(f"Unknown category: {main_category_str}, defaulting to OK")
            main_category = ContentType.OK

        categories = {
            item.get("label", "OK"): item.get("score", 0.0) for item in content_data
        }

        ctx.state.content_result = ContentResult(
            main_category=main_category, categories=categories
        )

        if main_category != ContentType.OK:
            return DetermineAction()

        return End("Content approved")


@dataclass
class DetermineAction(BaseNode[ModerationState]):
    async def run(self, ctx: GraphRunContext) -> End:
        try:
            prompt = f"Content type: {ctx.state.content_result.main_category.value}, Message: {ctx.state.message.content}"
            result = await ModAgent.run(prompt)
            action = result.output if hasattr(result, "output") else result
            ctx.state.recommended_action = action
            return End(f"Action determined: {action.action.value}")

        except Exception as e:
            print(f"Action determination error: {e}")
            ctx.state.recommended_action = ModAction(
                action=ActionType.WARNING,
                reason="Automated moderation - manual review required",
            )
            return End("Fallback action applied")
