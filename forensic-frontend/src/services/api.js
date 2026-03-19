import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/forensic',
  headers: { 'Content-Type': 'application/json' },
});

// Individual engines
export const runBenfords = (amounts) => api.post('/benfords', { amounts });
export const runAnomalyScan = (transactions) => api.post('/anomalies', { transactions });
export const verifyVendors = (data) => api.post('/vendors/verify', data);
export const crossRefPayroll = (data) => api.post('/payroll/cross-reference', data);
export const analyzeMoneyTrail = (transactions) => api.post('/money-trail', { transactions });

// Full audit
export const runFullAudit = (data) => api.post('/audit', data);

export default api;
