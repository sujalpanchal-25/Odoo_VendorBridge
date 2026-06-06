import api from './api.js';

export const listQuotations = (params) => api.get('/quotations', { params });
export const submitQuotation = (data) => api.post('/quotations', data);
export const getQuotationDetail = (id) => api.get(`/quotations/${id}`);
export const editQuotation = (id, data) => api.patch(`/quotations/${id}`, data);
export const selectQuotation = (id) => api.post(`/quotations/${id}/select`);
export const compareQuotations = (rfqId) => api.get(`/quotations/compare/${rfqId}`);
