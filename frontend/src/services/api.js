import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("leaflogic_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function saveToken(token) {
  localStorage.setItem("leaflogic_token", token);
}

export function clearToken() {
  localStorage.removeItem("leaflogic_token");
}

export function hasToken() {
  return Boolean(localStorage.getItem("leaflogic_token"));
}

export default api;
