import api from './api.js';

export const listPurchaseOrders = (params) => api.get('/purchase-orders', { params });
export const getPurchaseOrderDetail = (id) => api.get(`/purchase-orders/${id}`);
export const changePoStatus = (id, status) => api.patch(`/purchase-orders/${id}/status`, { status });
