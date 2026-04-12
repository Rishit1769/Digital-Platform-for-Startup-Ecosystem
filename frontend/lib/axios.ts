import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        // Prevent infinite loops if refresh itself fails
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;

      try {
        const res = await api.post('/auth/refresh');
        const token = res.data.data.accessToken;
        
        // This sets the Authorization header on the retry request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Ensure future requests also use the new token
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, it likely means the session is over.
        // We could redirect to login here.
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
