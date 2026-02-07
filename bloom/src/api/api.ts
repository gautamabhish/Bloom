import axios from "axios";

const api = axios.create({
  baseURL: "http://10.104.11.210:8000/api",
  withCredentials: true,
});

export default api;