import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (accessToken: string, refreshToken?: string) => {
    const response = await axios.post(
      `${API_URL}/auth/logout`,
      { refresh_token: refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  },

  getProfile: async (accessToken: string) => {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },

  updateProfile: async (accessToken: string, data: UpdateProfileData) => {
    const response = await axios.put(`${API_URL}/auth/profile`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },

  changePassword: async (accessToken: string, data: ChangePasswordData) => {
    const response = await axios.patch(`${API_URL}/auth/change-password`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email,
    });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authApi;
