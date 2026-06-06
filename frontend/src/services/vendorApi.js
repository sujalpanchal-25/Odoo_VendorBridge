import api from './api.js';

export const listVendors = (params) => api.get('/vendors', { params });
export const createVendor = (data) => api.post('/vendors', data);
export const getVendorDetail = (id) => api.get(`/vendors/${id}`);
export const updateVendor = (id, data) => api.patch(`/vendors/${id}`, data);
export const changeVendorStatus = (id, status) => api.patch(`/vendors/${id}/status`, { status });
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);
export const getVendorRfqs = (id) => api.get(`/vendors/${id}/rfqs`);
