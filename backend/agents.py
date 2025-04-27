# agents.py
# Defines agent logic, transformer analyzers, and the workflow graph

import os
import json
import logging
import re
from typing import Dict, List, Optional, Any, Literal, Tuple

import numpy as np
from scipy.special import softmax
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    AutoConfig,
    PreTrainedTokenizer,
    PreTrainedModel
)
import requests
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END

from models import (
    ContentCategory, SentimentScore, AnalysisResult, ModerationResult, 
    ModerationDecision, MediationResult, ResolutionStrategy, FinalAction,
    AgentState
)

# --- Configuration ---
SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
MODERATION_MODEL_NAME = "Vrandan/Comment-Moderation"

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- ASI-1 Mini configuration ---
ASI1_API_KEY = os.getenv("ASI1_API_KEY")
ASI1_API_URL = os.getenv("ASI1_API_URL", "https://api.asi1.ai/v1/chat/completions")
ASI1_MODEL_NAME = os.getenv("ASI1_MODEL_NAME", "asi1-mini")

if not ASI1_API_KEY:
    logger.warning("ASI1_API_KEY not set. LLM functionality will be limited.")

# --- Transformer analyzer classes ---
class SentimentAnalyzer:
    def __init__(self, model_name: str = SENTIMENT_MODEL_NAME):
        self.model_name = model_name
        try:
            self.tokenizer: PreTrainedTokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model: PreTrainedModel = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.config: AutoConfig = AutoConfig.from_pretrained(self.model_name)
        except Exception as e:
            logger.error(f"Failed to initialize SentimentAnalyzer: {str(e)}")
            raise

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
            return sorted(results_unsorted, key=lambda item: item[1], reverse=True)
        except Exception as e:
            logger.error(f"Error during sentiment analysis: {str(e)}")
            return []

class ModerationAnalyzer:
    def __init__(self, model_name: str = MODERATION_MODEL_NAME):
        self.model_name = model_name
        try:
            self.tokenizer: PreTrainedTokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model: PreTrainedModel = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.labels = [self.model.config.id2label[i] for i in range(self.model.config.num_labels)]
        except Exception as e:
            logger.error(f"Failed to initialize ModerationAnalyzer: {str(e)}")
            raise

    def analyze(self, text: str) -> List[Tuple[str, float]]:
        inputs = self.tokenizer(text, return_tensors="pt")
        try:
            outputs = self.model(**inputs)
            probabilities = outputs.logits.softmax(dim=-1).squeeze().tolist()
            results = sorted(zip(self.labels, probabilities), key=lambda item: item[1], reverse=True)
            return results
        except Exception as e:
            logger.error(f"Error during moderation analysis: {str(e)}")
            return []

# --- Initialize analyzers ---
try:
    sentiment_analyzer = SentimentAnalyzer()
    moderation_analyzer = ModerationAnalyzer()
except Exception as e:
    logger.critical(f"Failed to initialize analyzers: {str(e)}")
    raise SystemExit(f"Could not initialize analyzers: {e}")

# --- Improved LLM agent prompts ---
MODERATOR_PROMPT = """
You are the moderator agent for GrowTogether. Your task is to make moderation decisions based on sentiment and content analysis.

Analysis:
- Sentiment score: {sentiment_score} (Range: -100 to +100)
- Categories: {categories_json}

Guidelines (apply in priority order):
1. If harmful categories (S, H, V, HR, SH) have scores >0.3: BLOCK
2. If sentiment is extremely negative (<-85) AND contains personal attacks: BLOCK
3. If sentiment is negative (-70 to -85) OR harmful categories have scores between 0.1-0.3: FLAG for review
4. If sentiment is mildly negative (-30 to -70) with no harmful content markers: APPROVE with monitoring
5. If high 'OK' category (>0.9) and positive/neutral sentiment (>-30): APPROVE
6. For any borderline or uncertain cases: FLAG for review

Remember: We want to discourage harmful content while allowing constructive criticism and feedback that may have negative sentiment but isn't harmful.

Respond ONLY with a valid JSON object:
{{"decision": "approve|flag|block", 
  "reason": "brief reason based on guidelines", 
  "details": ["specific observations"]}}
"""

MEDIATOR_PROMPT = """
You are the mediator agent for GrowTogether. Your task is to provide conflict resolution strategies for flagged messages.

Details:
- Message: {message}
- Sentiment score: {sentiment_score}
- Categories detected: {categories_json}
- Moderation decision: {moderation_json}

Provide:
1. A brief assessment of the conflict
2. 1-2 specific resolution strategies with:
   - Clear title
   - Brief description
   - Practical example

Respond ONLY with a valid JSON object:
{{"assessment": "brief conflict assessment", 
  "strategies": [
    {{"title": "strategy name", 
     "description": "brief description", 
     "example": "concrete example"}}
  ]}}
"""

ORCHESTRATOR_PROMPT = """
You are the orchestrator agent for GrowTogether. Your task is to compile the inputs from moderation and mediation into a final action plan.

Context:
- Message: {message}
- Sentiment score: {sentiment_score}
- Categories: {categories_json}
- Moderation decision: {moderation_json}
- Mediation: {mediation_json}

Determine:
1. Final decision description
2. Specific actions to take (select from: approve message, hide message, block message, award points, notify user, queue for human review, restrict chat, require course)
3. User notification text if applicable

Respond ONLY with a valid JSON object:
{{"decision": "concise final decision", 
  "actions": ["specific action 1", "specific action 2"], 
  "notification": "user notification text or null"}}
"""

# --- JSON extraction helper ---
def strip_markdown_fences(text: str) -> str:
    """Extracts JSON from markdown code blocks or attempts direct extraction."""
    if not text:
        return text
    
    text_stripped = text.strip()
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?```$"
    match = re.match(pattern, text_stripped, re.DOTALL | re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    # Direct JSON extraction
    if text_stripped.startswith('{') and text_stripped.endswith('}'):
        return text_stripped
    
    # Extract JSON between braces
    first_brace = text_stripped.find('{')
    last_brace = text_stripped.rfind('}')
    if first_brace != -1 and last_brace != -1 and first_brace < last_brace:
        return text_stripped[first_brace:last_brace+1]
    
    return text_stripped

# --- ASI-1 Mini API integration ---
def call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Calls the ASI-1 Mini API using OpenAI-compatible interface."""
    if not ASI1_API_KEY:
        logger.error("Cannot call LLM: ASI1_API_KEY not set")
        return None
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {ASI1_API_KEY}'
        }
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        payload = {
            "model": ASI1_MODEL_NAME,
            "messages": messages,
            "temperature": 0.5,
            "stream": False,
            "max_tokens": 512
        }
        
        response = requests.post(ASI1_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            choice = data['choices'][0]
            if 'message' in choice and 'content' in choice['message']:
                return strip_markdown_fences(choice['message']['content'])
            elif 'content' in choice:
                return strip_markdown_fences(choice['content'])
    
    except Exception as e:
        logger.error(f"LLM API call failed: {str(e)}")
    
    return None

# --- Core analysis function ---
async def perform_analysis(message_content: str) -> Optional[AnalysisResult]:
    """Performs sentiment and moderation analysis using transformers."""
    if not message_content or not message_content.strip():
        return AnalysisResult(
            sentiment=SentimentScore(score=0),
            categories=[(ContentCategory.OK, 1.0)]
        )
    
    try:
        # Sentiment analysis
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

        # Content moderation analysis
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
            sentiment=SentimentScore(score=final_sentiment_score),
            categories=category_results
        )
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return AnalysisResult(
            sentiment=SentimentScore(score=0),
            categories=[(ContentCategory.OK, 1.0)]
        )

# --- Agent functions (graph nodes) ---
async def analyze_content(state: AgentState) -> AgentState:
    """Analyzes message content for sentiment and moderation categories."""
    message = state["message"]
    analysis_result = await perform_analysis(message.content)
    
    # Initialize optional fields
    state_update = {
        "analysis_result": analysis_result,
        "moderation_result": None,
        "mediation_result": None,
        "final_action": None
    }
    
    return {**state, **state_update}

async def make_moderation_decision(state: AgentState) -> AgentState:
    """Uses ASI-1 Mini to decide moderation action based on analysis."""
    analysis_result = state.get("analysis_result")
    
    # Default moderation result
    moderation_result = ModerationResult(
        decision=ModerationDecision.FLAG,
        reason="Processing error occurred",
        details=["System unable to complete moderation."]
    )
    
    if not analysis_result:
        return {**state, "moderation_result": moderation_result}
    
    # Prepare prompt data
    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    user_prompt = f"Analysis:\n- Sentiment score: {analysis_result.sentiment.score}\n- Categories: {categories_json}\n\nPlease determine the appropriate moderation action."
    
    # Call ASI-1 Mini
    llm_response = call_llm(MODERATOR_PROMPT, user_prompt)
    
    if llm_response:
        try:
            moderation_data = json.loads(llm_response)
            moderation_result = ModerationResult(**moderation_data)
        except Exception as e:
            logger.error(f"Moderation parsing error: {str(e)}")
    
    return {**state, "moderation_result": moderation_result}

async def create_mediation_strategies(state: AgentState) -> AgentState:
    """Uses ASI-1 Mini to suggest conflict resolution strategies."""
    analysis_result = state.get("analysis_result")
    moderation_result = state.get("moderation_result")
    
    # Skip if moderation approved or analysis missing
    if (not analysis_result or 
        not moderation_result or 
        moderation_result.decision == ModerationDecision.APPROVE):
        return {**state, "mediation_result": None}
    
    # Prepare prompt data
    message = state["message"]
    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    moderation_json = moderation_result.model_dump_json()
    
    user_prompt = (
        f"Details:\n"
        f"- Message: {message.content}\n"
        f"- Sentiment score: {analysis_result.sentiment.score}\n"
        f"- Categories: {categories_json}\n"
        f"- Moderation: {moderation_json}\n\n"
        f"Please provide mediation strategies."
    )
    
    # Call ASI-1 Mini
    llm_response = call_llm(MEDIATOR_PROMPT, user_prompt)
    
    # Default mediation result
    mediation_result = MediationResult(
        assessment="Could not generate conflict assessment",
        strategies=[]
    )
    
    if llm_response:
        try:
            mediation_data = json.loads(llm_response)
            mediation_result = MediationResult(**mediation_data)
        except Exception as e:
            logger.error(f"Mediation parsing error: {str(e)}")
    
    return {**state, "mediation_result": mediation_result}

async def compile_final_action(state: AgentState) -> AgentState:
    """Uses ASI-1 Mini to compile final action plan."""
    analysis_result = state.get("analysis_result")
    moderation_result = state.get("moderation_result")
    mediation_result = state.get("mediation_result")
    
    # Fallback action for critical failures
    fallback_action = FinalAction(
        decision="System error occurred",
        actions=["queue for human moderator review"],
        notification="Your message requires manual review due to a system issue."
    )
    
    if not analysis_result or not moderation_result:
        return {**state, "final_action": fallback_action}
    
    # Prepare prompt data
    message = state["message"]
    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    moderation_json = moderation_result.model_dump_json()
    mediation_json = mediation_result.model_dump_json() if mediation_result else '{"assessment": "skipped", "strategies": []}'
    
    user_prompt = (
        f"Context:\n"
        f"- Message: {message.content}\n"
        f"- Sentiment score: {analysis_result.sentiment.score}\n"
        f"- Categories: {categories_json}\n"
        f"- Moderation: {moderation_json}\n"
        f"- Mediation: {mediation_json}\n\n"
        f"Please determine the final action plan."
    )
    
    # Call ASI-1 Mini
    llm_response = call_llm(ORCHESTRATOR_PROMPT, user_prompt)
    
    if llm_response:
        try:
            action_data = json.loads(llm_response)
            final_action = FinalAction(**action_data)
            return {**state, "final_action": final_action}
        except Exception as e:
            logger.error(f"Final action parsing error: {str(e)}")
    
    return {**state, "final_action": fallback_action}

# --- Conditional logic for workflow ---
def should_skip_mediation(state: AgentState) -> Literal["mediation", "orchestrator"]:
    """Determines if mediation should be skipped based on moderation decision."""
    moderation_result = state.get("moderation_result")
    
    if (moderation_result and 
        moderation_result.decision == ModerationDecision.APPROVE):
        return "orchestrator"
    else:
        return "mediation"

# --- Workflow graph definition ---
def create_moderation_graph():
    """Creates the agent workflow graph using Langgraph."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("analyzer", analyze_content)
    workflow.add_node("moderator", make_moderation_decision)
    workflow.add_node("mediation", create_mediation_strategies)
    workflow.add_node("orchestrator", compile_final_action)
    
    # Define edges
    workflow.add_edge(START, "analyzer")
    workflow.add_edge("analyzer", "moderator")
    workflow.add_conditional_edges(
        "moderator",
        should_skip_mediation,
        {
            "mediation": "mediation",
            "orchestrator": "orchestrator"
        }
    )
    workflow.add_edge("mediation", "orchestrator")
    workflow.add_edge("orchestrator", END)
    
    return workflow.compile()

# Create the runnable workflow object
moderation_workflow = create_moderation_graph()