import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

export const fetchRiskAll    = ()          => api.get('/risk/all').then(r => r.data.data);
export const fetchRisk       = (id)        => api.get(`/risk/${id}`).then(r => r.data.data);
export const fetchAlerts     = ()          => api.get('/alerts').then(r => r.data.data);
export const acknowledgeAlert = (id)       => api.patch(`/alerts/${id}/acknowledge`).then(r => r.data.data);
export const dispatchAction  = (body)      => api.post('/alerts/dispatch', body).then(r => r.data.data);
export const fetchSensors    = ()          => api.get('/sensors').then(r => r.data.data);
export const fetchHistory    = (id, h=24)  => api.get(`/sensors/${id}/history?hours=${h}`).then(r => r.data.data);
export const fetchReports    = ()          => api.get('/reports').then(r => r.data.data);
export const submitReport    = (body)      => api.post('/reports', body).then(r => r.data.data);
export const fetchRegions    = ()          => api.get('/regions').then(r => r.data.data);
export const calculateRisk   = (params)    => api.post('/risk/calculate', params).then(r => r.data.data);

export default api;
