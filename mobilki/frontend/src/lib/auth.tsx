import axios from "axios";

const API_URL = "/api/auth";

export const login = async (data: { username: string; password: string }) => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};

export const register = async (data: {
  username: string;
  password: string;
}) => {
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};
