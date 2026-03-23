import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('astra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      localStorage.removeItem('astra_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

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

// Banking
export const getBankProviders = () => api.get('/banking/providers');
export const connectBank = (data) => api.post('/banking/connect', data);
export const exchangeBankToken = (data) => api.post('/banking/exchange', data);
export const syncBankTransactions = (data) => api.post('/banking/sync', data);

// Invoicing
export const createInvoice = (data) => api.post('/invoicing/', data);
export const getInvoices = (params) => api.get('/invoicing/', { params });
export const getInvoiceSummary = () => api.get('/invoicing/summary');
export const sendInvoice = (id) => api.post(`/invoicing/${id}/send`);
export const recordPayment = (id, data) => api.post(`/invoicing/${id}/payment`, data);

// Documents
export const uploadDocument = (data) => api.post('/documents/upload', data);
export const searchDocuments = (query) => api.get(`/documents/search/${query}`);
export const getDocumentSummary = () => api.get('/documents/summary');

// Enterprise
export const getPractices = () => api.get('/enterprise/practices');
export const createPractice = (data) => api.post('/enterprise/practices', data);
export const getBranding = (params) => api.get('/enterprise/branding', { params });
export const updateBranding = (data) => api.put('/enterprise/branding', data);
export const exportData = (data) => api.post('/enterprise/data-export', data);
export const importData = (data) => api.post('/enterprise/data-import', data);
export const getBulkTransactions = (params) => api.get('/enterprise/bulk/transactions', { params });
export const bulkCategorize = (data) => api.post('/enterprise/bulk/categorize', data);
export const bulkApprove = (data) => api.post('/enterprise/bulk/approve', data);

// Audit / Activity Feed
export const queryAuditTrail = (params) => api.get('/audit/query', { params });
export const verifyAuditChain = () => api.get('/audit/verify');

// Tax Filing
export const generateTaxReturn = (data) => api.post('/tax/returns/generate', data);
export const listTaxReturns = (params) => api.get('/tax/returns/', { params });
export const getTaxReturn = (id) => api.get(`/tax/returns/${id}`);
export const validateTaxReturn = (id) => api.post(`/tax/returns/${id}/validate`);
export const lodgeTaxReturn = (id) => api.post(`/tax/returns/${id}/lodge`);
export const getTaxDeadlines = (params) => api.get('/tax/returns/deadlines', { params });

export default api;
