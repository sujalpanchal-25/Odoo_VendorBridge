import api from './api.js';

export const listApprovals = (params) => api.get('/approvals', { params });
export const getPendingApprovals = () => api.get('/approvals/pending');
export const getApprovalDetail = (id) => api.get(`/approvals/${id}`);
export const processApprovalAction = (id, data) => api.post(`/approvals/${id}/action`, data);
