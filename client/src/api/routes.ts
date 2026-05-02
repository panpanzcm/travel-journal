import api from './index';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  getMe: () => api.get<{ user: User }>('/auth/me'),

  search: (q: string) =>
    api.get<{ users: User[] }>('/auth/search', { params: { q } }),
};

export const notebookApi = {
  list: () => api.get<{ notebooks: any[] }>('/notebooks'),

  listShared: () => api.get<{ notebooks: any[] }>('/notebooks/shared'),

  listPublic: () => api.get<{ notebooks: any[] }>('/notebooks/public'),

  get: (id: number) => api.get<{ notebook: any }>(`/notebooks/${id}`),

  create: (data: {
    title: string;
    description?: string;
    cover_image?: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
    is_public?: boolean;
  }) => api.post<{ notebook: any }>('/notebooks', data),

  update: (id: number, data: Partial<{
    title: string;
    description: string;
    cover_image: string;
    latitude: number;
    longitude: number;
    location_name: string;
    is_public: boolean;
  }>) => api.put<{ notebook: any }>(`/notebooks/${id}`, data),

  delete: (id: number) => api.delete(`/notebooks/${id}`),

  getCollaborators: (id: number) =>
    api.get<{ collaborators: any[] }>(`/notebooks/${id}/collaborators`),

  addCollaborator: (id: number, userId: number) =>
    api.post(`/notebooks/${id}/collaborators`, { user_id: userId }),

  removeCollaborator: (id: number, userId: number) =>
    api.delete(`/notebooks/${id}/collaborators/${userId}`),
};

export const entryApi = {
  list: (notebookId: number) =>
    api.get<{ entries: any[] }>(`/entries/${notebookId}/entries`),

  create: (notebookId: number, data: {
    type: 'text' | 'photo' | 'video' | 'audio' | 'route';
    content?: string;
    file_path?: string;
    thumbnail_path?: string;
    latitude?: number | null;
    longitude?: number | null;
    route_data?: string;
  }) => api.post<{ entry: any }>(`/entries/${notebookId}/entries`, data),

  update: (id: number, data: Partial<{
    content: string;
    file_path: string;
    thumbnail_path: string;
    latitude: number;
    longitude: number;
    route_data: string;
  }>) => api.put<{ entry: any }>(`/entries/${id}`, data),

  delete: (id: number) => api.delete(`/entries/${id}`),
};

export const uploadApi = {
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ file: any }>('/upload', formData, {
      params: { type },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};