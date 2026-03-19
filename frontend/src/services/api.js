import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Tax Engine
export const calculateGST = (data) => api.post('/tax/gst', data);
export const calculateWHT = (data) => api.post('/tax/withholding', data);
export const calculateIncomeTax = (data) => api.post('/tax/income-tax', data);
export const analyzeTax = (data) => api.post('/tax/analyze', data);
export const getTreaties = () => api.get('/tax/treaties');
export const getTreaty = (a, b) => api.get(`/tax/treaties/${a}/${b}`);
export const getJurisdictionRates = (code) => api.get(`/tax/rates/${code}`);

// Entities
export const createEntity = (data) => api.post('/entities/', data);
export const getEntities = () => api.get('/entities/');
export const getEntity = (id) => api.get(`/entities/${id}`);

// Transactions
export const createTransaction = (data) => api.post('/transactions/', data);
export const getTransactions = (params) => api.get('/transactions/', { params });
export const getReviewQueue = (params) => api.get('/transactions/review', { params });
export const reviewTransaction = (id, data) => api.post(`/transactions/${id}/review`, data);

// AI
export const askAstra = (query) => api.post('/ai/query', { query });
export const categorizeTransaction = (data) => api.post('/ai/categorize', data);
export const generateNarrative = (data) => api.post('/ai/narrative', data);

// Agentic AI
export const orchestrate = (request, entityId, context) =>
  api.post('/agentic/orchestrate', { request, entity_id: entityId, context });
export const runAutomation = (process, params) =>
  api.post(`/agentic/automate/${process}`, params);
export const getAgentStatus = () => api.get('/agentic/agents/status');
export const runMonthEndClose = (data) => api.post('/agentic/close/run', data);
export const generateCashForecast = (data) => api.post('/agentic/forecast', data);
export const checkCompliance = (data) => api.post('/agentic/compliance/check', data);

export default api;
