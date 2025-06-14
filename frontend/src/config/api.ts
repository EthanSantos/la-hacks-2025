// Simple API URL configuration
export const getApiUrl = () => {
  // Check if we have an environment variable set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default to production API if no environment variable is set
  return 'https://la-hacks-api.vercel.app';
};

// Log current API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log(`🌐 API URL: ${getApiUrl()}`);
} 