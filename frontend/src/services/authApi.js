import api from './api.js';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/profile', data);
