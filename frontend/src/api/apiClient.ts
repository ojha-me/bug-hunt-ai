import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:8000/api/";

const TOKEN_KEY = 'auth_token';

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const isTokenExpired = (token: string) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  const now = Date.now() / 1000;
  return decoded.exp ? decoded.exp < now : true;
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  

// check if the token is expired
// if expired, refresh the token
// finally attach the token to the request headers
apiClient.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  // If token exists and is expired, refresh first
  // if (token && isTokenExpired(token)) {
  //   try {
  //     const { data } = await apiClient.post("/refresh");
  //     setAccessToken(data.access_token);
  //     token = data.access_token;
  //   } catch (err) {
  //     console.error("Refresh token failed", err);
  //   }
  // }

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


export default apiClient;