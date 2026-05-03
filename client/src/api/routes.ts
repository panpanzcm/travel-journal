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

const demoNotebooks = [
  { id: 1, title: '我的北京之旅', description: '2024年夏天北京游玩', latitude: 39.9042, longitude: 116.4074, location_name: '北京', is_public: 1, owner_id: 1, created_at: '2024-06-01', updated_at: '2024-06-01' },
  { id: 2, title: '日本东京游', description: '东京大阪 Kyoto', latitude: 35.6762, longitude: 139.6503, location_name: '东京', is_public: 0, owner_id: 1, created_at: '2024-07-01', updated_at: '2024-07-01' }
];

const demoEntries = [
  { id: 1, notebook_id: 1, type: 'text', content: '今天去了天安门广场，非常壮观！', author_id: 1, created_at: '2024-06-01', author_username: 'demo', author_avatar: '' },
  { id: 2, notebook_id: 1, type: 'photo', file_path: 'https://picsum.photos/400/300', thumbnail_path: 'https://picsum.photos/400/300', author_id: 1, created_at: '2024-06-02', author_username: 'demo', author_avatar: '' }
];

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const user = { id: 1, username: data.username, email: data.email, avatar: '' };
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify(user));
    return { data: { token: 'demo-token', user } };
  },
  login: async (data: { email: string; password: string }) => {
    const user = { id: 1, username: data.email.split('@')[0], email: data.email, avatar: '' };
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify(user));
    return { data: { token: 'demo-token', user } };
  },
  getMe: async () => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : { id: 1, username: 'demo', email: 'demo@test.com', avatar: '' };
    return { data: { user } };
  },
  search: async () => ({ data: { users: [] } })
};

export const notebookApi = {
  list: async () => ({ data: { notebooks: demoNotebooks } }),
  listShared: async () => ({ data: { notebooks: [] } }),
  listPublic: async () => ({ data: { notebooks: demoNotebooks.filter((n: any) => n.is_public) } }),
  get: async (id: number) => {
    const notebook = demoNotebooks.find((n: any) => n.id === id);
    return { data: { notebook: notebook ? { ...notebook, owner: { id: 1, username: 'demo', avatar: '' } } : null } };
  },
  create: async (data: any) => {
    return { data: { notebook: { id: Date.now(), owner_id: 1, created_at: new Date().toISOString(), ...data } } };
  },
  update: async () => ({ data: { notebook: {} } }),
  delete: async () => ({ data: { success: true } }),
  getCollaborators: async () => ({ data: { collaborators: [] } }),
  addCollaborator: async () => ({ data: { success: true } }),
  removeCollaborator: async () => ({ data: { success: true } })
};

export const entryApi = {
  list: async (notebookId: number) => ({ data: { entries: demoEntries.filter((e: any) => e.notebook_id === notebookId) } }),
  create: async (notebookId: number, data: any) => ({ data: { entry: { id: Date.now(), notebook_id: notebookId, author_id: 1, created_at: new Date().toISOString(), ...data } } }),
  update: async () => ({ data: { entry: {} } }),
  delete: async () => ({ data: { success: true } })
};

export const uploadApi = {
  upload: async () => ({ data: { file: { path: 'https://picsum.photos/400/300', thumbnail_path: 'https://picsum.photos/400/300' } } })
};

export default api;