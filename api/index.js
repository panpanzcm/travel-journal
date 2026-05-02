// In-memory database
const db = {
  users: [],
  notebooks: [],
  collaborators: [],
  entries: []
};
let ids = { user: 1, notebook: 1, collaborator: 1, entry: 1 };

export default async function handler(req, res) {
  const { method, query, body } = req;
  const path = req.url?.split('?')[0] || '';
  
  try {
    // /api/auth/register
    if (path === '/api/auth/register' && method === 'POST') {
      const { username, email, password } = body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: '请填写完整信息' });
      }
      if (db.users.find(u => u.email === email || u.username === username)) {
        return res.status(409).json({ error: '用户名或邮箱已存在' });
      }
      const user = { id: ids.user++, username, email, password, avatar: '' };
      db.users.push(user);
      return res.status(201).json({ token: 'token_' + user.id, user: { id: user.id, username, email, avatar: '' } });
    }
    
    // /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      return res.json({ token: 'token_' + user.id, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    }
    
    // /api/notebooks (GET)
    if (path === '/api/notebooks' && method === 'GET') {
      return res.json({ notebooks: db.notebooks });
    }
    
    // /api/notebooks (POST)
    if (path === '/api/notebooks' && method === 'POST') {
      const { title, description, cover_image, latitude, longitude, location_name, is_public } = body;
      const notebook = {
        id: ids.notebook++,
        owner_id: 1,
        title,
        description: description || '',
        cover_image: cover_image || '',
        latitude: latitude || null,
        longitude: longitude || null,
        location_name: location_name || '',
        is_public: is_public ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.notebooks.push(notebook);
      return res.status(201).json({ notebook });
    }
    
    // /api/notebooks/public
    if (path === '/api/notebooks/public' && method === 'GET') {
      const publicNotebooks = db.notebooks.filter(n => n.is_public === 1);
      return res.json({ notebooks: publicNotebooks.map(n => ({ ...n, owner_username: 'user' })) });
    }
    
    // /api/notebooks/:id
    const notebookMatch = path.match(/^\/api\/notebooks\/(\d+)$/);
    if (notebookMatch && method === 'GET') {
      const notebook = db.notebooks.find(n => n.id === parseInt(notebookMatch[1]));
      if (!notebook) {
        return res.status(404).json({ error: '记录本不存在' });
      }
      return res.json({ notebook: { ...notebook, owner: { id: 1, username: 'user', avatar: '' } } });
    }
    
    // /api/notebooks/:id/entries
    const entriesMatch = path.match(/^\/api\/notebooks\/(\d+)\/entries$/);
    if (entriesMatch && method === 'GET') {
      const entries = db.entries.filter(e => e.notebook_id === parseInt(entriesMatch[1]));
      return res.json({ entries });
    }
    if (entriesMatch && method === 'POST') {
      const { type, content, file_path, thumbnail_path, latitude, longitude, route_data } = body;
      const entry = {
        id: ids.entry++,
        notebook_id: parseInt(entriesMatch[1]),
        author_id: 1,
        type: type || 'text',
        content: content || '',
        file_path: file_path || '',
        thumbnail_path: thumbnail_path || '',
        latitude: latitude || null,
        longitude: longitude || null,
        route_data: route_data || '',
        created_at: new Date().toISOString()
      };
      db.entries.push(entry);
      return res.status(201).json({ entry });
    }
    
    // Default
    res.json({ message: 'Travel Journal API', db: { users: db.users.length, notebooks: db.notebooks.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}