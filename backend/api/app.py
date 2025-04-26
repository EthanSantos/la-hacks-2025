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

print("Server starting up with configuration...")
print(f"Google API Key configured: {'Yes' if GOOGLE_API_KEY else 'No'}")
print(f"Roblox API Key configured: {'Yes' if ROBLOX_API_KEY else 'No'}")

@app.route('/')
def home():
    print("Home endpoint accessed")
    return jsonify({
        "message": "Sentiment Analysis API is running",
        "status": "success"
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_message():
    
    if ROBLOX_API_KEY:
        request_api_key = request.headers.get('X-API-Key')
        print(f"API Key authentication: {'Success' if request_api_key == ROBLOX_API_KEY else 'Failed'}")
        if not request_api_key or request_api_key != ROBLOX_API_KEY:
            print("Unauthorized access attempt - invalid API key")
            return jsonify({"error": "Unauthorized"}), 401
    
    if not request.json or 'message' not in request.json:
        print("Bad request - no message provided")
        return jsonify({"error": "No message provided"}), 400
    
    user_message = request.json['message']
    player_id = request.json.get('player_id', random.randint(1, 100))
    player_name = request.json.get('player_name', f"Player{random.randint(1, 999)}")
    
    print(f"Processing request: Player ID: {player_id}, Player Name: {player_name}")
    print(f"Message to analyze: {user_message}")
    
    try:
        print("Initializing Gemini model...")
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
        
        print("Sending request to Gemini API...")
        response = model.generate_content(prompt)
        response_text = response.text
        print(f"Received response from Gemini: {response_text}")

        try:
            print("Parsing Gemini response as JSON...")
            json_match = re.search(r'({[\s\S]*})', response_text)
            if json_match:
                json_str = json_match.group(1)
                print(f"Extracted JSON string: {json_str}")
                gemini_data = json.loads(json_str)
            else:
                gemini_data = json.loads(response_text)
                
            sentiment_score = gemini_data.get("sentiment_score", 0)
            emotion = gemini_data.get("emotion", "Neutral")
            print(f"Parsed sentiment score: {sentiment_score}, emotion: {emotion}")
        except Exception as json_error:
            print(f"JSON parsing error: {json_error}")
            sentiment_score = 0
            emotion = "Neutral"
            print("Using fallback sentiment values due to parsing error")
        
        # Generate a response
        result = {
            "id": player_id,
            "player_name": player_name,
            "message": user_message,
            "sentiment_score": sentiment_score,
            "emotion": emotion
        }
        
        print(f"Returning result: {result}")
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        fallback_result = {
            "id": player_id,
            "player_name": player_name,
            "message": user_message,
            "sentiment_score": 0,
            "emotion": "Neutral"
        }
        
        print(f"Returning fallback result: {fallback_result}")
        return jsonify(fallback_result)

if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True)