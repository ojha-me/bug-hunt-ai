import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:8000/api/";
const TOKEN_KEY = 'auth_token';

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const isTokenExpired = (token: string) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  const now = Date.now() / 1000; 
  return decoded.exp ? decoded.exp < now : true;
};

// using a separate refreshApiClient for refreshing token
// token expires -> checks token -> sees expired -> uses apiClient -> my suspect it this cycle runs infinitely and the app crashes
// to prevent infinite loop.
// This may work may not. Fingers Crossed.
const refreshApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(async (config) => {
  let token = getAccessToken();

  // If token exists and is expired, refresh it
  if (token && isTokenExpired(token)) {
    try {
      const response = await refreshApiClient.post("users/refresh", {
        refresh: token,
      });

      const newAccessToken = response.data.access_token;
      setAccessToken(newAccessToken);
      token = newAccessToken;
    } catch (error) {
      console.error("Token refresh failed", error);
      removeAccessToken();
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }

  // Attach Authorization header if we have a token
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;