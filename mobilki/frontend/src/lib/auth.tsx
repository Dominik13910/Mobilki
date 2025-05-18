import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const login = async (data: { username: string; password: string }) => {
  const response = await axios.post(`${API_URL}/login`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const register = async (data: {
  username: string;
  password: string;
}) => {
  const response = await axios.post(`${API_URL}/register`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(
    `${API_URL}/logout`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};
