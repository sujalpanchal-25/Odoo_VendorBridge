import api from './api.js';

export const getDashboardStats = () => api.get('/reports/dashboard');
export const getAnalytics = () => api.get('/reports/analytics');
export const exportProcurementData = () => api.get('/reports/export', { responseType: 'blob' });
