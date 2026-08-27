import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) => api.post('/login', { email, password }),
  register: (name: string, email: string, password: string, password_confirmation: string) =>
    api.post('/register', { name, email, password, password_confirmation }),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
};

export const smtpApi = {
  list: () => api.get('/smtps'),
  create: (data: any) => api.post('/smtps', data),
  update: (id: number, data: any) => api.put(`/smtps/${id}`, data),
  delete: (id: number) => api.delete(`/smtps/${id}`),
  test: (id: number, recipient_email: string) => api.post(`/smtps/${id}/test`, { recipient_email }),
};

export const templateApi = {
  list: () => api.get('/templates'),
  create: (data: any) => api.post('/templates', data),
  update: (id: number, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: number) => api.delete(`/templates/${id}`),
};

export const recipientListApi = {
  list: () => api.get('/recipient-lists'),
  get: (id: number) => api.get(`/recipient-lists/${id}`),
  create: (data: any) => api.post('/recipient-lists', data),
  delete: (id: number) => api.delete(`/recipient-lists/${id}`),
};

export const campaignApi = {
  list: () => api.get('/campaigns'),
  get: (id: number) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
  launch: (id: number) => api.post(`/campaigns/${id}/launch`),
  pause: (id: number) => api.post(`/campaigns/${id}/pause`),
  resume: (id: number) => api.post(`/campaigns/${id}/resume`),
};
