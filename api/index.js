const fs = require('fs');
let data = { users: [], notebooks: [], collaborators: [], entries: [] };
let ids = { user: 1, notebook: 1, collaborator: 1, entry: 1 };

try {
  const file = fs.readFileSync('./server/data.json', 'utf8');
  const parsed = JSON.parse(file);
  data = { users: parsed.users || [], notebooks: parsed.notebooks || [], collaborators: parsed.notebook_collaborators || [], entries: parsed.entries || [] };
  ids = parsed.nextIds || { user: 1, notebook: 1, collaborator: 1, entry: 1 };
} catch (e) {
  console.log('Using sample data');
}

const users = data.users;
const notebooks = data.notebooks;
const entries = data.entries;

export default async function handler(req, res) {
  const path = req.url?.split('?')[0] || '';
  const method = req.method;

  try {
    // Auth
    if (path === '/api/auth/register' && method === 'POST') {
      const { username, email, password } = req.body;
      if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: '邮箱已存在' });
      }
      const user = { id: ids.user++, username, email, password, avatar: '' };
      users.push(user);
      return res.status(201).json({ token: 'token_' + user.id, user: { id: user.id, username, email, avatar: '' } });
    }
    
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body;
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      return res.json({ token: 'token_' + user.id, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    }
    
    if (path === '/api/auth/me' && method === 'GET') {
      return res.json({ user: { id: 1, username: 'panpan', email: '1729104546@qq.com', avatar: '' } });
    }

    // Notebooks
    if (path === '/api/notebooks' && method === 'GET') {
      return res.json({ notebooks: notebooks.filter(n => n.owner_id === 1) });
    }
    
    if (path === '/api/notebooks/shared' && method === 'GET') {
      return res.json({ notebooks: [] });
    }
    
    if (path === '/api/notebooks/public' && method === 'GET') {
      return res.json({ notebooks: notebooks.filter(n => n.is_public).map(n => ({ ...n, owner_username: 'panpan' })) });
    }
    
    if (path === '/api/notebooks' && method === 'POST') {
      const { title, description, latitude, longitude, location_name, is_public } = req.body;
      const notebook = { id: ids.notebook++, owner_id: 1, title, description: description || '', latitude: latitude || null, longitude: longitude || null, location_name: location_name || '', is_public: is_public ? 1 : 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      notebooks.push(notebook);
      return res.status(201).json({ notebook });
    }
    
    const notebookMatch = path.match(/^\/api\/notebooks\/(\d+)$/);
    if (notebookMatch && method === 'GET') {
      const notebook = notebooks.find(n => n.id === parseInt(notebookMatch[1]));
      if (!notebook) return res.status(404).json({ error: '不存在' });
      return res.json({ notebook: { ...notebook, owner: { id: 1, username: 'panpan', avatar: '' } } });
    }

    // Entries
    const entriesMatch = path.match(/^\/api\/notebooks\/(\d+)\/entries$/);
    if (entriesMatch && method === 'GET') {
      const notebookEntries = entries.filter(e => e.notebook_id === parseInt(entriesMatch[1]));
      return res.json({ entries: notebookEntries });
    }
    if (entriesMatch && method === 'POST') {
      const { type, content, file_path, latitude, longitude } = req.body;
      const entry = { id: ids.entry++, notebook_id: parseInt(entriesMatch[1]), author_id: 1, type: type || 'text', content: content || '', file_path: file_path || '', latitude: latitude || null, longitude: longitude || null, created_at: new Date().toISOString() };
      entries.push(entry);
      return res.status(201).json({ entry });
    }

    res.json({ notebooks: notebooks.length, entries: entries.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}