from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import google.generativeai as genai
import random
import json
import re

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

ROBLOX_API_KEY = os.environ.get("ROBLOX_API_KEY")

@app.route('/')
def home():
    return jsonify({
        "message": "Sentiment Analysis API is running",
        "status": "success"
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_message():
    if ROBLOX_API_KEY:
        request_api_key = request.headers.get('X-API-Key')
        if not request_api_key or request_api_key != ROBLOX_API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
    
    if not request.json or 'message' not in request.json:
        return jsonify({"error": "No message provided"}), 400
    
    user_message = request.json['message']
    player_id = request.json.get('player_id', random.randint(1, 100))
    player_name = request.json.get('player_name', f"Player{random.randint(1, 999)}")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Analyze the following message for its sentiment and emotion.
        Give a sentiment score from -100 (extremely negative) to 100 (extremely positive).
        
        For emotions, classify as one of:
        - Very Positive
        - Positive
        - Neutral
        - Negative
        - Very Negative
        
        Message: {user_message}
        
        Format your response in valid JSON like this example:
        {{
          "sentiment_score": 75,
          "emotion": "Positive"
        }}
        
        Respond ONLY with the JSON, nothing else.
        """
        
        response = model.generate_content(prompt)
        response_text = response.text

        try:
            json_match = re.search(r'({[\s\S]*})', response_text)
            if json_match:
                json_str = json_match.group(1)
                gemini_data = json.loads(json_str)
            else:
                gemini_data = json.loads(response_text)
                
            sentiment_score = gemini_data.get("sentiment_score", 0)
            emotion = gemini_data.get("emotion", "Neutral")
        except Exception:
            sentiment_score = 0
            emotion = "Neutral"
        
        # Generate a response
        result = {
            "id": player_id,
            "player_name": player_name,
            "message": user_message,
            "sentiment_score": sentiment_score,
            "emotion": emotion
        }
        
        return jsonify(result)
    
    except Exception as e:
        fallback_result = {
            "id": player_id,
            "player_name": player_name,
            "message": user_message,
            "sentiment_score": 0,
            "emotion": "Neutral"
        }
        
        return jsonify(fallback_result)

if __name__ == '__main__':
    app.run(debug=True)