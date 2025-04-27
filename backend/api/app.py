from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import google.generativeai as genai
import random
import json
import re
from supabase import create_client, Client
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

# API Keys
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
ROBLOX_API_KEY = os.environ.get("ROBLOX_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize APIs
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ROBLOX_THUMBNAILS_API_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"

print("Server starting up with configuration...")
print(f"Google API Key configured: {'Yes' if GOOGLE_API_KEY else 'No'}")
print(f"Roblox API Key configured: {'Yes' if ROBLOX_API_KEY else 'No'}")
print(f"Supabase configured: {'Yes' if SUPABASE_URL and SUPABASE_KEY else 'No'}")
print("Gemini model initialized")

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
        
    if 'message_id' not in request.json:
        print("Bad request - no message_id provided")
        return jsonify({"error": "No message_id provided"}), 400
    
    user_message = request.json['message']
    message_id = request.json['message_id']
    player_id = request.json.get('player_id')
    player_name = request.json.get('player_name')
    
    # Only use random values if no player_id or player_name was provided
    if player_id is None:
        player_id = random.randint(1, 100)
    if player_name is None:
        player_name = f"Player{random.randint(1, 999)}"
    
    print(f"Processing request: Player ID: {player_id}, Player Name: {player_name}")
    print(f"Message to analyze: {user_message}")
    
    try:
        
        prompt = f"""
        You are a precise sentiment analysis tool. Evaluate the sentiment expressed in the user message below.

        Assign a sentiment score based on the following scale:
        - -100 to -51: Very Negative (Strongly expresses anger, sadness, disgust, etc.)
        - -50 to -11: Negative (Expresses mild negativity, dissatisfaction, criticism)
        - -10 to 10: Neutral (Objective statements, questions, ambiguous sentiment, or lacking clear emotion)
        - 11 to 50: Positive (Expresses mild positivity, satisfaction, agreement)
        - 51 to 100: Very Positive (Strongly expresses joy, excitement, high praise, etc.)

        User Message:
        >>>
        {user_message}
        <<<

        Your response must be *only* a valid JSON object containing the single key "sentiment_score" mapped to the calculated integer score.
        Ensure absolutely no other text, markdown, or explanation surrounds the JSON output.

        Required JSON Output Format:
        {{
          "sentiment_score": <calculated_integer_score>
        }}
        """
        
        print("Sending request to Gemini API...")
        response = model.generate_content(prompt)
        response_text = response.text
        print(f"Received response from Gemini: {response_text}")

        try:
            json_match = re.search(r'({[\s\S]*})', response_text)
            if json_match:
                json_str = json_match.group(1)
                print(f"Extracted JSON string: {json_str}")
                gemini_data = json.loads(json_str)
            else:
                gemini_data = json.loads(response_text)
                
            sentiment_score = gemini_data.get("sentiment_score", 0)
            print(f"Parsed sentiment score: {sentiment_score}")
        except Exception as json_error:
            print(f"JSON parsing error: {json_error}")
            sentiment_score = 0
            print("Using fallback sentiment values due to parsing error")
        
        # Generate a response
        result = {
            "player_id": player_id,
            "player_name": player_name,
            "message_id": message_id,
            "message": user_message,
            "sentiment_score": sentiment_score
        }
        
        # store the data in supabase
        try:
            # check if the player exists in the players table
            player_data = {
                "player_id": player_id,
                "player_name": player_name,
                "last_seen": datetime.now().isoformat()
            }
            
            player_response = supabase.table('players').upsert(player_data).execute()
            print(f"Player data stored/updated in Supabase")
            
            # store the message data
            message_data = {
                "message_id": message_id,
                "player_id": player_id,
                "message": user_message,
                "sentiment_score": sentiment_score,
                "created_at": datetime.now().isoformat()
            }
            
            message_response = supabase.table('messages').insert(message_data).execute()
            print(f"Message data stored in Supabase")
            
            # Update player sentiment score after message is stored
            try:
                supabase.rpc('update_player_sentiment_score').execute()
                print("Player sentiment score updated")
            except Exception as score_error:
                print(f"Error updating player sentiment score: {score_error}")
        
        except Exception as db_error:
            print(f"Supabase storage error: {db_error}")
        
        print(f"Returning result: {result}")
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        fallback_result = {
            "player_id": player_id,
            "player_name": player_name,
            "message_id": message_id,
            "message": user_message,
            "sentiment_score": 0
        }
        
        print(f"Returning fallback result: {fallback_result}")
        return jsonify(fallback_result)

@app.route('/api/players', methods=['GET'])
def get_players():
    try:
        response = supabase.table('players').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching players: {e}")
        return jsonify({"error": "Failed to fetch players"}), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    try:
        # get optional query params for filtering
        player_id = request.args.get('player_id')
        limit = request.args.get('limit', 100)
        
        query = supabase.table('messages').select('*').order('created_at', desc=True).limit(limit)
        
        if player_id:
            query = query.eq('player_id', player_id)
        
        response = query.execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({"error": "Failed to fetch messages"}), 500

@app.route('/api/live', methods=['GET'])
def get_live_messages():
    try:
        limit = int(request.args.get('limit', 20))
        
        # created a sql function to handle this easily and more efficiently
        messages_response = supabase.rpc('get_live_messages', {'p_limit': limit}).execute()
        
        return jsonify(messages_response.data)
    except Exception as e:
        print(f"Error fetching live messages: {e}")
        return jsonify({"error": f"Failed to fetch live messages: {str(e)}"}), 500
    
@app.route('/api/roblox-avatar', methods=['GET'])
def get_roblox_avatar():
    """
    Proxies requests to the Roblox Thumbnails API to fetch user avatar headshots.
    Takes 'userId' as a query parameter.
    """
    user_id = request.args.get('userId')

    if not user_id:
        print("Roblox avatar proxy: Missing userId parameter")
        return jsonify({"error": "Missing userId parameter"}), 400

    try:
        user_id_int = int(user_id)
        if user_id_int <= 0:
             print(f"Roblox avatar proxy: Invalid userId format (non-positive): {user_id}")
             return jsonify({"error": "Invalid userId format"}), 400
    except ValueError:
        print(f"Roblox avatar proxy: Invalid userId format (not an integer): {user_id}")
        return jsonify({"error": "Invalid userId format"}), 400


    print(f"Roblox avatar proxy: Fetching avatar for user ID: {user_id}")

    # Parameters for the Roblox API request
    roblox_params = {
        "userIds": user_id, # Pass the single user ID
        "size": "150x150",  # Desired size
        "format": "Png"     # Desired format
    }

    try:
        # Make the request to the actual Roblox Thumbnails API
        roblox_response = requests.get(ROBLOX_THUMBNAILS_API_URL, params=roblox_params)
        roblox_response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)

        roblox_data = roblox_response.json()
        print(f"Roblox avatar proxy: Received data from Roblox API: {roblox_data}")

        # Parse the response to find the image URL
        # The response structure is { "data": [ { "targetId": ..., "state": ..., "imageUrl": ... } ] }
        image_url = None
        if roblox_data and 'data' in roblox_data and isinstance(roblox_data['data'], list):
            # Find the item matching the requested user ID
            user_data = next((item for item in roblox_data['data'] if str(item.get('targetId')) == user_id), None)
            if user_data and 'imageUrl' in user_data:
                image_url = user_data['imageUrl']
                print(f"Roblox avatar proxy: Found imageUrl: {image_url}")
            else:
                 print(f"Roblox avatar proxy: imageUrl not found in Roblox response for user ID: {user_id}")


        if image_url:
            # Return the image URL to the frontend
            return jsonify({"imageUrl": image_url})
        else:
            # Return a 404 if the image URL was not found for the user
            print(f"Roblox avatar proxy: Avatar not found for user ID: {user_id}")
            return jsonify({"error": "Avatar not found"}), 404

    except requests.exceptions.RequestException as e:
        # Handle errors during the request to Roblox API
        print(f"Roblox avatar proxy: Error fetching from Roblox API: {e}")
        return jsonify({"error": "Failed to fetch avatar from Roblox"}), 500
    except Exception as e:
        # Handle any other unexpected errors
        print(f"Roblox avatar proxy: An unexpected error occurred: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/api/top-players', methods=['GET'])
def get_top_players():
    try:
        limit = int(request.args.get('limit', 10))
        
        response = supabase.rpc('get_top_players_by_sentiment', {'p_limit': limit}).execute()
        
        # Format the response to ensure we have the required fields
        formatted_data = []
        for player in response.data:
            formatted_data.append({
                "player_id": player["player_id"],
                "player_name": player["player_name"],
                "total_sentiment_score": player["total_sentiment_score"],
                "message_count": player["message_count"]
            })
        
        return jsonify(formatted_data)
    except Exception as e:
        print(f"Error fetching top players: {e}")
        return jsonify({"error": f"Failed to fetch top players: {str(e)}"}), 500
    
@app.route('/api/analytics/all-time/sentiment-trend', methods=['GET'])
def get_sentiment_trend_data_all_time():
    try:
        interval = request.args.get('interval', 'month') 
        if interval not in ['day', 'hour', 'week', 'month', 'year']:
            return jsonify({"error": "Invalid interval unit"}), 400

        params = {'interval_unit': interval}
        # Call the all_time version of the function
        response = supabase.rpc('get_sentiment_trend_all_time', params).execute()

        if hasattr(response, 'data'):
             print(f"Fetched all-time sentiment trend data for interval: {interval}")
             return jsonify(response.data)
        else:
             print(f"Error in Supabase response for all-time sentiment trend: {response}")
             return jsonify({"error": "Failed to fetch all-time sentiment trend data", "details": str(response)}), 500

    except Exception as e:
        print(f"Error fetching all-time sentiment trend: {e}")
        return jsonify({"error": f"Failed to fetch all-time sentiment trend: {str(e)}"}), 500

@app.route('/api/analytics/all-time/sentiment-distribution', methods=['GET'])
def get_sentiment_distribution_data_all_time():
    try:
        positive_threshold = request.args.get('positive_threshold', 30, type=int)
        negative_threshold = request.args.get('negative_threshold', -30, type=int)

        params = {
            'positive_threshold': positive_threshold,
            'negative_threshold': negative_threshold
        }
        # Call the all_time version of the function
        response = supabase.rpc('get_sentiment_distribution_all_time', params).execute()

        if hasattr(response, 'data'):
            print(f"Fetched all-time sentiment distribution data")
            return jsonify(response.data)
        else:
            print(f"Error in Supabase response for all-time sentiment distribution: {response}")
            return jsonify({"error": "Failed to fetch all-time sentiment distribution data", "details": str(response)}), 500

    except Exception as e:
        print(f"Error fetching all-time sentiment distribution: {e}")
        return jsonify({"error": f"Failed to fetch all-time sentiment distribution: {str(e)}"}), 500

@app.route('/api/analytics/all-time/overall-stats', methods=['GET'])
def get_overall_stats_data_all_time():
    try:
        # Call the all_time version of the function (no parameters needed)
        response = supabase.rpc('get_overall_analytics_stats_all_time', {}).execute()

        if hasattr(response, 'data'):
            print(f"Fetched all-time overall stats")
            data_to_return = response.data[0] if response.data and isinstance(response.data, list) else response.data
            return jsonify(data_to_return)
        else:
            print(f"Error in Supabase response for all-time overall stats: {response}")
            return jsonify({"error": "Failed to fetch all-time overall stats", "details": str(response)}), 500

    except Exception as e:
        print(f"Error fetching all-time overall stats: {e}")
        return jsonify({"error": f"Failed to fetch all-time overall stats: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True)