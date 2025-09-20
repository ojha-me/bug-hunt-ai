import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:8000/api/";

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};


const isTokenExpired = (token: string) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  const now = Date.now() / 1000;
  return decoded.exp ? decoded.exp < now : true;
};


export const getAccessToken = () => accessToken;

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
  let token = getAccessToken();

  // If token exists and is expired, refresh first
  if (token && isTokenExpired(token)) {
    try {
      const { data } = await apiClient.post("/refresh");
      setAccessToken(data.access_token);
      token = data.access_token;
    } catch (err) {
      console.error("Refresh token failed", err);
    }
  }

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


export default apiClient;