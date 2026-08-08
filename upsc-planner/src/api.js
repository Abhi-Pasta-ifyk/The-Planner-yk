import axios from 'axios';

// Create an Axios instance with Vite environment variable support
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // <-- CRITICAL: Tells the browser to automatically send the secure httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Handle global errors like expired tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Cookie expired or unauthorized — handle session termination
      console.warn("Session expired or unauthorized. Please log in again.");
      
      // If you have a dedicated login route, you can uncomment this to auto-kick them out:
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default API;