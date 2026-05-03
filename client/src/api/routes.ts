import axios from './index';

export const authApi = {
  register: (data) => axios.post('/api/auth/register', data),
  login: (data) => axios.post('/api/auth/login', data),
  getMe: () => axios.get('/api/auth/me'),
  search: (q) => axios.get('/api/auth/search', { params: { q } })
};

export const notebookApi = {
  list: () => axios.get('/api/notebooks'),
  listShared: () => axios.get('/api/notebooks/shared'),
  listPublic: () => axios.get('/api/notebooks/public'),
  get: (id) => axios.get(`/api/notebooks/${id}`),
  create: (data) => axios.post('/api/notebooks', data),
  update: (id, data) => axios.put(`/api/notebooks/${id}`, data),
  delete: (id) => axios.delete(`/api/notebooks/${id}`),
  getCollaborators: (id) => axios.get(`/api/notebooks/${id}/collaborators`),
  addCollaborator: (id, userId) => axios.post(`/api/notebooks/${id}/collaborators`, { user_id: userId }),
  removeCollaborator: (id, userId) => axios.delete(`/api/notebooks/${id}/collaborators/${userId}`)
};

export const entryApi = {
  list: (notebookId) => axios.get(`/api/notebooks/${notebookId}/entries`),
  create: (notebookId, data) => axios.post(`/api/notebooks/${notebookId}/entries`, data),
  update: (id, data) => axios.put(`/api/entries/${id}`, data),
  delete: (id) => axios.delete(`/api/entries/${id}`)
};

export const uploadApi = {
  upload: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/api/upload', formData, {
      params: { type },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};