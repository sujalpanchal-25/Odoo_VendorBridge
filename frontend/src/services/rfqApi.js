import api from './api.js';

export const listRfqs = (params) => api.get('/rfqs', { params });
export const createRfq = (data) => api.post('/rfqs', data);
export const getRfqDetail = (id) => api.get(`/rfqs/${id}`);
export const updateRfq = (id, data) => api.patch(`/rfqs/${id}`, data);
export const publishRfq = (id) => api.patch(`/rfqs/${id}/publish`);
export const closeRfq = (id) => api.patch(`/rfqs/${id}/close`);
export const cancelRfq = (id) => api.delete(`/rfqs/${id}`);
