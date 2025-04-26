'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
 const [message, setMessage] = useState('');
 const [result, setResult] = useState<any>(null);
 const [error, setError] = useState('');

 const analyzeSentiment = async () => {
   if (!message.trim()) {
     setError('Please enter a message');
     return;
   }

   try {
     const response = await axios.post(
       "http://127.0.0.1:5000/api/analyze",
       { 
         message,
         player_id: 1,
         player_name: "Test User"
       },
       {
         headers: {
           'X-API-Key': process.env.NEXT_PUBLIC_ROBLOX_API_KEY,
           'Content-Type': 'application/json'
         }
       }
     );

     setResult(response.data);
     setError('');
   } catch (err) {
     setError('Failed to analyze sentiment');
     console.error(err);
   }
 };

 return (
   <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
     <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
       <h1 className="text-2xl font-bold mb-4 text-center">Sentiment Analyzer</h1>
       
       <textarea 
         value={message}
         onChange={(e) => setMessage(e.target.value)}
         placeholder="Enter your message to analyze"
         className="w-full p-2 border rounded mb-4 min-h-[100px]"
       />
       
       <button 
         onClick={analyzeSentiment}
         className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-4"
       >
         Analyze Sentiment
       </button>
       
       {error && (
         <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
           {error}
         </div>
       )}
       
       {result && (
         <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
           {JSON.stringify(result, null, 2)}
         </pre>
       )}
     </div>
   </main>
 );
}