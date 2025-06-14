from pydantic_graph import Graph
from typing import Optional

from .state import ChatMessage, ModerationState, ModAction, ActionType
from .nodes import (
    StartModeration,
    DetectPII,
    CheckIntent,
    ModerateContent,
    DetermineAction,
)

# ---------- Graph Definition ----------
moderation_graph = Graph(
    nodes=[StartModeration, DetectPII, CheckIntent, ModerateContent, DetermineAction],
    state_type=ModerationState,
)


# ---------- Main Function ----------
async def moderate_message(message: ChatMessage) -> ModerationState:
    """Main function to moderate a chat message"""
    state = ModerationState(message=message)

    try:
        result = await moderation_graph.run(StartModeration(), state=state)
        print(f"Graph execution completed: {result}")
        return state  # Return the full state, not just recommended_action
    except Exception as e:
        print(f"Moderation error: {e}")
        # Return a state with fallback action
        state.recommended_action = ModAction(
            action=ActionType.WARNING,
            reason="Moderation system error - manual review required",
        )
        return state
