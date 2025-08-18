# LA Hacks 2025 - Sentiment Analysis & Moderation Platform

A real-time sentiment analysis and content moderation platform built for LA Hacks 2025.

## What it does

- Analyzes chat messages for sentiment
- Moderates content automatically
- Provides real-time analytics dashboard
- Integrates with Roblox for user avatars
- Uses AI-powered content filtering

## Tech Stack

### Backend
- FastAPI (Python)
- Google Gemini AI
- Supabase database
- Sentiment analysis services

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api.app:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the backend directory:
```
GOOGLE_API_KEY=your_google_api_key
BLOOM_API_KEY=your_bloom_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Features

- Real-time chat sentiment analysis
- Content moderation with AI
- User analytics dashboard
- Leaderboard system
- Moderation queue management
