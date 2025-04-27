# TODO need to handle parsing errors better for /analyze endpoint

# agents.py
# defines agent logic, transformer analyzers, prompts, and the workflow graph for asi:1

import os
import json
import logging
import re # for regex stripping
import csv
import urllib.request
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
# removed openai imports
import requests # for asi:1 calls
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END

from models import * # type: ignore

# --- configuration ---
SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
MODERATION_MODEL_NAME = "Vrandan/Comment-Moderation"

load_dotenv()
# basic logging setup (minimal)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- asi:1 configuration (only) ---
ASI1_API_KEY = os.getenv("ASI1_API_KEY")
ASI1_API_URL = os.getenv("ASI1_API_URL", "https://api.asi1.ai/v1/chat/completions")
ASI1_MODEL_NAME = os.getenv("ASI1_MODEL_NAME", "asi1-mini")

if not ASI1_API_KEY:
    pass # api key check


# --- transformer analyzer classes ---
class SentimentAnalyzer:
    def __init__(self, model_name: str = SENTIMENT_MODEL_NAME):
        self.model_name = model_name
        try:
            self.tokenizer: PreTrainedTokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model: PreTrainedModel = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.config: AutoConfig = AutoConfig.from_pretrained(self.model_name)
        except Exception as e:
            raise

    def _preprocess(self, text: str) -> str:
        # simple preprocessing
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
            results = sorted(results_unsorted, key=lambda item: item[1], reverse=True)
            return results
        except Exception as e:
            return []

class ModerationAnalyzer:
    def __init__(self, model_name: str = MODERATION_MODEL_NAME):
        self.model_name = model_name
        try:
            self.tokenizer: PreTrainedTokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model: PreTrainedModel = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.labels = [self.model.config.id2label[i] for i in range(self.model.config.num_labels)]
        except Exception as e:
            raise

    def analyze(self, text: str) -> List[Tuple[str, float]]:
         inputs = self.tokenizer(text, return_tensors="pt")
         try:
            outputs = self.model(**inputs)
            probabilities = outputs.logits.softmax(dim=-1).squeeze().tolist()
            results = sorted(zip(self.labels, probabilities), key=lambda item: item[1], reverse=True)
            return results
         except Exception as e:
            return []

# --- instantiate analyzers ---
try:
    sentiment_analyzer = SentimentAnalyzer()
    moderation_analyzer = ModerationAnalyzer()
except Exception as e:
    raise SystemExit(f"could not initialize analyzers: {e}")


# --- core analysis function ---
async def perform_analysis(message_content: str) -> Optional[AnalysisResult]:
    """performs analysis using transformers, returns analysisresult or none."""
    if not message_content or not message_content.strip():
        return AnalysisResult(
             sentiment=SentimentScore(score=0),
             categories=[(ContentCategory.OK, 1.0)] # default to ok if empty
        )
    try:
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

        sentiment_obj = SentimentScore(score=final_sentiment_score)
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
                    pass # ignore unknown categories
        if not category_results:
             category_results = [(ContentCategory.OK, 1.0)]

        analysis_result = AnalysisResult(
            sentiment=sentiment_obj,
            categories=category_results
        )
        return analysis_result
    except Exception as e:
        return AnalysisResult(
             sentiment=SentimentScore(score=0),
             categories=[(ContentCategory.OK, 1.0)]
        ) # fallback analysis result


# --- llm agent prompts ---
# prompts remain the same, but system prompt context is lost for asi:1
MODERATOR_PROMPT = """you are the moderator agent for growtogether. your role is to make moderation decisions based on analysis. be concise.

analysis:
sentiment score: {sentiment_score} (-100 to +100)
categories (probabilities): {categories_json}

task: check for sarcasm/contradiction. don't rely solely on sentiment score if sarcasm seems likely.

guidelines:
1. high 'ok' (> 0.95): prefer 'approve', unless strong negative sentiment (< -60) or significant harmful category (> 0.10).
2. sarcasm suspected: lean 'flag'.
3. clear violation (high harmful category or very negative sentiment): 'block'.
4. borderline: lean 'flag'.

based on analysis and guidelines (incl. sarcasm check), determine action: approved, flagged, or blocked.
provide:
1. decision (approve, flag, block)
2. brief reason referencing analysis/guidelines/sarcasm check.
3. brief details/observations (optional).
respond *only* with a valid json object formatted like this: {"decision": "...", "reason": "...", "details": ["..."] or "..."}
do not include any other text or markdown formatting like ```json.
keep reason and details succinct.
"""

MEDIATOR_PROMPT = """you are the mediator agent for growtogether. provide concise conflict resolution ideas when needed.

details:
message: {message}
sentiment score: {sentiment_score}
categories detected: {categories_json}
moderation decision: {moderation_json}

provide:
1. brief conflict assessment.
2. 1-2 concise resolution strategies:
   - title
   - brief description
   - brief example (what to say/do)
respond *only* with a valid json object formatted like this: {"assessment": "...", "strategies": [{"title": "...", "description": "...", "example": "..."}]}
do not include any other text or markdown formatting like ```json.
keep assessment, descriptions, and examples succinct.
"""

EDUCATOR_PROMPT = """you are the educator agent for growtogether. identify learning opportunities and suggest resources briefly.

details:
message: {message}
sentiment score: {sentiment_score}
categories detected: {categories_json}
moderation decision: {moderation_json}

provide:
1. brief educational assessment (learning opportunities).
2. 2-3 recommended resources:
   - title
   - very brief description
   - url (placeholder like '/resources/resource-name')
respond *only* with a valid json object formatted like this: {"assessment": "...", "resources": [{"title": "...", "description": "...", "url": "..."}]}
do not include any other text or markdown formatting like ```json.
keep assessment and descriptions very brief.
"""

ORCHESTRATOR_PROMPT = """you are the orchestrator agent for growtogether. compile a succinct action plan.

inputs:
message: {message}
analysis:
  sentiment: {sentiment_score}
  categories: {categories_json}
moderation: {moderation_json}
mediation: {mediation_json}
education: {education_json}

determine final plan:
1. succinct final decision description.
2. list of actions (select from: approve message for public display, hide message from public view pending review, block message from being displayed, award positive communication points to user, notify user of guideline violation, queue for human moderator review, restrict chat privileges temporarily, require completion of community standards course)
3. concise user notification text (if applicable, otherwise null).
respond *only* with a valid json object formatted like this: {"decision": "...", "actions": ["...", "..."], "notification": "..." or null}
do not include any other text or markdown formatting like ```json.
keep decision description and notification concise.
"""

# --- llm call abstraction (asi:1 only) ---

def strip_markdown_fences(text: str) -> str:
    """removes markdown code fences and attempts simple json extraction as fallback."""
    if not text:
        return text
    text_stripped = text.strip()
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?```$"
    match = re.match(pattern, text_stripped, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    if text_stripped.startswith('{') and text_stripped.endswith('}'):
        return text_stripped
    if text_stripped.startswith('[') and text_stripped.endswith(']'):
         return text_stripped
    first_brace = text_stripped.find('{')
    last_brace = text_stripped.rfind('}')
    first_bracket = text_stripped.find('[')
    last_bracket = text_stripped.rfind(']')
    if first_brace != -1 and last_brace != -1 and first_brace < last_brace:
         if not (first_bracket != -1 and first_bracket > first_brace and last_bracket != -1 and last_bracket < last_brace):
             return text_stripped[first_brace:last_brace+1]
    if first_bracket != -1 and last_bracket != -1 and first_bracket < last_bracket:
        return text_stripped[first_bracket:last_bracket+1]
    return text_stripped


def call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """calls the asi:1 api and returns the response content, handling errors."""
    llm_response_content = None
    llm_response_raw = None

    if not ASI1_API_KEY:
        return None
    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {ASI1_API_KEY}'
        }
        # *** simplify payload: send only user prompt, discard system prompt ***
        # this is the simplest documented format, sacrificing system context for stability
        # include system instructions within the user prompt for the llm
        # note: system_prompt variable is ignored below, but kept in signature for consistency
        messages = [
            {"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"} # Combine prompts into user content
        ]
        # alternative: if above still fails, try sending only the original user_prompt:
        # messages = [{"role": "user", "content": user_prompt}]


        payload = json.dumps({
            "model": ASI1_MODEL_NAME,
            "messages": messages,
            "temperature": 0.5,
            "stream": False,
            "max_tokens": 768
        })
        response = requests.post(ASI1_API_URL, headers=headers, data=payload, timeout=60)

        response.raise_for_status() # raise http errors

        response_data = response.json()

        if 'choices' in response_data and len(response_data['choices']) > 0:
             choice = response_data['choices'][0]
             if 'message' in choice and 'content' in choice['message']:
                 llm_response_raw = choice['message']['content']
             elif 'content' in choice:
                 llm_response_raw = choice['content']

             if llm_response_raw:
                 llm_response_content = strip_markdown_fences(llm_response_raw)

    # broad exception handling returns None on any failure
    except (requests.exceptions.RequestException, json.JSONDecodeError, Exception):
        pass # errors result in returning none

    return llm_response_content # returns none if any error occurred


# --- agent functions (graph nodes) ---

async def analyze_content(state: AgentState) -> AgentState:
    # graph node performs analysis via helper function
    message = state["message"]
    analysis_result = await perform_analysis(message.content)
    # initialize optional fields
    state["moderation_result"] = None
    state["mediation_result"] = None
    state["education_result"] = None
    state["final_action"] = None
    # always include analysis result, even if default
    return {**state, "analysis_result": analysis_result}


async def make_moderation_decision(state: AgentState) -> AgentState:
    # uses asi:1 llm to decide action based on analysis
    analysis_result = state.get("analysis_result")
    # create default/error moderation result first
    moderation_result = ModerationResult(
            decision=ModerationDecision.FLAG, # default to flag on error
            reason="llm call or parsing failed",
            details=["system error during moderation check."]
        )

    if not analysis_result:
        # this case should be rare now with default analysis, but handles it
        return {**state, "moderation_result": moderation_result}

    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    # create user prompt content (system instructions included in call_llm if needed)
    user_prompt_content = f"analysis:\nsentiment score: {analysis_result.sentiment.score}\ncategories (probabilities): {categories_json}\n\ntask: check for sarcasm/contradiction. don't rely solely on sentiment score if sarcasm seems likely.\n\nguidelines:\n1. high 'ok' (> 0.95): prefer 'approve', unless strong negative sentiment (< -60) or significant harmful category (> 0.10).\n2. sarcasm suspected: lean 'flag'.\n3. clear violation (high harmful category or very negative sentiment): 'block'.\n4. borderline: lean 'flag'.\n\nbased on analysis and guidelines (incl. sarcasm check), determine action: approved, flagged, or blocked.\nprovide:\n1. decision (approve, flag, block)\n2. brief reason referencing analysis/guidelines/sarcasm check.\n3. brief details/observations (optional).\nrespond *only* with a valid json object formatted like this: {{\"decision\": \"...\", \"reason\": \"...\", \"details\": [\"...\"] or \"...\"}}\ndo not include any other text or markdown formatting like ```json.\nkeep reason and details succinct."

    # pass system prompt (which might be ignored/combined in call_llm) and user data
    llm_response_content = call_llm(MODERATOR_PROMPT, user_prompt_content)

    if llm_response_content:
        try:
            moderation_dict = json.loads(llm_response_content)
            if isinstance(moderation_dict, dict):
                # attempt validation; if it fails, keep the default error object
                moderation_result = ModerationResult(**moderation_dict)
        except (ValidationError, json.JSONDecodeError):
            pass # keep default error object

    return {**state, "moderation_result": moderation_result}


async def create_mediation_strategies(state: AgentState) -> AgentState:
    # uses asi:1 llm to suggest conflict resolution strategies
    analysis_result = state.get("analysis_result")
    moderation_result = state.get("moderation_result")

    # skip entirely if analysis/moderation missing or if decision was approve
    # note: moderation_result should always exist now (either success or default error)
    if not analysis_result or not moderation_result or moderation_result.decision == ModerationDecision.APPROVE:
         return {**state, "mediation_result": None}

    # create default/error result
    mediation_result = MediationResult(
            assessment="error: llm call or parsing failed for mediation",
            strategies=[]
        )

    message = state["message"]
    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    moderation_json = moderation_result.model_dump_json() # will use error object if needed

    # create user prompt content
    user_prompt_content = (
        f"details:\nmessage: {message.content}\n"
        f"sentiment score: {analysis_result.sentiment.score}\n"
        f"categories detected: {categories_json}\n"
        f"moderation decision: {moderation_json}\n\n"
        f"provide:\n1. brief conflict assessment.\n2. 1-2 concise resolution strategies:\n   - title\n   - brief description\n   - brief example (what to say/do)\n"
        f"respond *only* with a valid json object formatted like this: {{\"assessment\": \"...\", \"strategies\": [{{\"title\": \"...\", \"description\": \"...\", \"example\": \"...\"}}]}}\n"
        f"do not include any other text or markdown formatting like ```json.\n"
        f"keep assessment, descriptions, and examples succinct."
    )

    llm_response_content = call_llm(MEDIATOR_PROMPT, user_prompt_content) # pass system prompt

    if llm_response_content:
        try:
            mediation_dict = json.loads(llm_response_content)
            if isinstance(mediation_dict, dict):
                 mediation_result = MediationResult(**mediation_dict) # attempt validation
        except (ValidationError, json.JSONDecodeError):
            pass # keep default error result

    return {**state, "mediation_result": mediation_result}


async def identify_educational_resources(state: AgentState) -> AgentState:
    # uses asi:1 llm to find relevant educational resources
    analysis_result = state.get("analysis_result")
    moderation_result = state.get("moderation_result")

    # skip entirely if analysis/moderation missing or if approved
    if not analysis_result or not moderation_result or moderation_result.decision == ModerationDecision.APPROVE:
         return {**state, "education_result": None}

    # create default/error result
    education_result = EducationResult(
            assessment="error: llm call or parsing failed for education",
            resources=[]
        )

    message = state["message"]
    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    moderation_json = moderation_result.model_dump_json() # will use error object if needed

    # create user prompt content
    user_prompt_content = (
        f"details:\nmessage: {message.content}\n"
        f"sentiment score: {analysis_result.sentiment.score}\n"
        f"categories detected: {categories_json}\n"
        f"moderation decision: {moderation_json}\n\n"
        f"provide:\n1. brief educational assessment (learning opportunities).\n2. 2-3 recommended resources:\n   - title\n   - very brief description\n   - url (placeholder like '/resources/resource-name')\n"
        f"respond *only* with a valid json object formatted like this: {{\"assessment\": \"...\", \"resources\": [{{\"title\": \"...\", \"description\": \"...\", \"url\": \"...\"}}]}}\n"
        f"do not include any other text or markdown formatting like ```json.\n"
        f"keep assessment and descriptions very brief."
    )

    llm_response_content = call_llm(EDUCATOR_PROMPT, user_prompt_content) # pass system prompt

    if llm_response_content:
        try:
            education_dict = json.loads(llm_response_content)
            if isinstance(education_dict, dict):
                education_result = EducationResult(**education_dict) # attempt validation
        except (ValidationError, json.JSONDecodeError):
            pass # keep default error result

    return {**state, "education_result": education_result}


async def compile_final_action(state: AgentState) -> AgentState:
    # uses asi:1 llm to aggregate results and define final action
    analysis_result = state.get("analysis_result")
    moderation_result = state.get("moderation_result") # should always exist now

    # create fallback action for critical upstream failures (safety net)
    fallback_critical = FinalAction(
            decision="error: critical processing failure (analysis/moderation missing)",
            actions=["queue for human moderator review"],
            notification="your message requires manual review due to an internal processing issue."
        )

    if not analysis_result or not moderation_result:
        return {**state, "final_action": fallback_critical}

    # create fallback action specifically for orchestrator llm/parsing failure
    # use the actual moderation decision (even if it was the error default)
    fallback_orchestrator = FinalAction(
            decision=f"flagged due to orchestration error ({moderation_result.decision.value} suggested)",
            actions=["queue for human moderator review"],
            notification=None
        )

    # default to orchestrator fallback before trying llm call
    final_action = fallback_orchestrator

    # prepare context for llm
    message = state["message"]
    mediation_result = state.get("mediation_result") 
    education_result = state.get("education_result") 

    categories_json = json.dumps({cat.value: f"{score:.4f}" for cat, score in analysis_result.categories})
    moderation_json = moderation_result.model_dump_json() # will include error state if needed
    # handle optional results gracefully for the prompt
    mediation_json = mediation_result.model_dump_json() if mediation_result else '{"assessment": "n/a - step skipped or failed", "strategies": []}'
    education_json = education_result.model_dump_json() if education_result else '{"assessment": "n/a - step skipped or failed", "resources": []}'

    # create user prompt content
    user_prompt_content = (
        f"inputs:\nmessage: {message.content}\n"
        f"analysis:\n  sentiment: {analysis_result.sentiment.score}\n  categories: {categories_json}\n"
        f"moderation: {moderation_json}\n"
        f"mediation: {mediation_json}\n"
        f"education: {education_json}\n\n"
        f"determine final plan:\n1. succinct final decision description.\n2. list of actions (select from: approve message for public display, hide message from public view pending review, block message from being displayed, award positive communication points to user, notify user of guideline violation, queue for human moderator review, restrict chat privileges temporarily, require completion of community standards course)\n3. concise user notification text (if applicable, otherwise null).\n"
        f"respond *only* with a valid json object formatted like this: {{\"decision\": \"...\", \"actions\": [\"...\", \"...\"], \"notification\": \"...\" or null}}\n"
        f"do not include any other text or markdown formatting like ```json.\n"
        f"keep decision description and notification concise."
    )

    llm_response_content = call_llm(ORCHESTRATOR_PROMPT, user_prompt_content) # pass system prompt

    if llm_response_content:
        try:
            action_data = json.loads(llm_response_content)
            action_dict = None
            # handle list or dict response
            if isinstance(action_data, list) and len(action_data) > 0 and isinstance(action_data[0], dict):
                action_dict = action_data[0]
            elif isinstance(action_data, dict):
                action_dict = action_data

            if action_dict:
                # attempt validation; if it fails, final_action remains the orchestrator fallback
                final_action = FinalAction(**action_dict)

        except (ValidationError, json.JSONDecodeError):
            # parsing/validation failed, final_action remains the orchestrator fallback set before the try block
            pass

    # return the result (either successfully parsed or one of the fallbacks)
    return {**state, "final_action": final_action}


# --- conditional logic for workflow ---

def should_skip_extra_steps(state: AgentState) -> Literal["mediator", "orchestrator"]:
    """determines the next step after moderation based on the decision."""
    moderation_result = state.get("moderation_result") # should always exist
    # only skip if moderation succeeded (not error default) AND decision is approve
    if moderation_result and moderation_result.reason != "llm call or parsing failed" and moderation_result.decision == ModerationDecision.APPROVE:
        return "orchestrator"
    else:
        # includes cases where moderation failed (default error obj used) or decision is flag/block
        return "mediator"


# --- workflow graph definition ---
def create_moderation_graph():
    # defines the sequence of agent calls with conditional branching
    workflow = StateGraph(AgentState)

    # add nodes
    workflow.add_node("analyzer", analyze_content)
    workflow.add_node("moderator", make_moderation_decision)
    workflow.add_node("mediator", create_mediation_strategies)
    workflow.add_node("educator", identify_educational_resources)
    workflow.add_node("orchestrator", compile_final_action)

    # define edges
    workflow.add_edge(START, "analyzer")
    workflow.add_edge("analyzer", "moderator")
    workflow.add_conditional_edges(
        "moderator",
        should_skip_extra_steps,
        {
            "mediator": "mediator",
            "orchestrator": "orchestrator"
        }
    )
    workflow.add_edge("mediator", "educator")
    workflow.add_edge("educator", "orchestrator")
    workflow.add_edge("orchestrator", END)

    return workflow.compile()

# create the runnable workflow object
moderation_workflow = create_moderation_graph()