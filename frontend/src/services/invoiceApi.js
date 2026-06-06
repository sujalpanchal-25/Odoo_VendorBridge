import api from './api.js';

export const listInvoices = (params) => api.get('/invoices', { params });
export const generateInvoice = (poId) => api.post('/invoices', { poId });
export const getInvoiceDetail = (id) => api.get(`/invoices/${id}`);
export const getInvoicePrintUrl = (id) => api.get(`/invoices/${id}/print`);
export const emailInvoice = (id) => api.post(`/invoices/${id}/email`);
export const markInvoicePaid = (id) => api.patch(`/invoices/${id}/mark-paid`);
