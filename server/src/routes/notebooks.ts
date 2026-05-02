import { Router, Response } from 'express';
import * as db from '../database';
import { generateToken, authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const notebooks = db.getNotebooks().filter(n => n.owner_id === req.userId);
  notebooks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  res.json({ notebooks });
});

router.get('/shared', authMiddleware, (req: AuthRequest, res: Response): void => {
  const collabs = db.getCollaborators().filter(c => c.user_id === req.userId);
  const notebookIds = collabs.map(c => c.notebook_id);
  const notebooks = db.getNotebooks().filter(n => notebookIds.includes(n.id) && n.owner_id !== req.userId);
  notebooks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  res.json({ notebooks });
});

router.get('/public', optionalAuth, (req: AuthRequest, res: Response): void => {
  const notebooks = db.getNotebooks().filter(n => n.is_public === 1);
  const users = db.getUsers();
  
  const result = notebooks.map(n => {
    const owner = users.find(u => u.id === n.owner_id);
    return { ...n, owner_username: owner?.username || '' };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);

  res.json({ notebooks: result });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, description, cover_image, latitude, longitude, location_name, is_public } = req.body;
  if (!title) {
    res.status(400).json({ error: '请填写标题' });
    return;
  }

  const notebook = db.addNotebook({
    owner_id: req.userId!,
    title,
    description: description || '',
    cover_image: cover_image || '',
    latitude: latitude || null,
    longitude: longitude || null,
    location_name: location_name || '',
    is_public: is_public ? 1 : 0
  });

  res.status(201).json({ notebook });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notebookId = parseInt(id);
  
  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  const isOwner = notebook.owner_id === req.userId;
  const collabs = db.getCollaborators();
  const collaborator = collabs.find(c => c.notebook_id === notebookId && c.user_id === req.userId);

  if (!isOwner && !collaborator && !notebook.is_public) {
    res.status(403).json({ error: '无权访问' });
    return;
  }

  const users = db.getUsers();
  const owner = users.find(u => u.id === notebook.owner_id);
  res.json({ notebook: { ...notebook, owner: owner ? { id: owner.id, username: owner.username, avatar: owner.avatar } : null } });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notebookId = parseInt(id);
  const { title, description, cover_image, latitude, longitude, location_name, is_public } = req.body;

  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  if (notebook.owner_id !== req.userId!) {
    res.status(403).json({ error: '只有所有者可以编辑' });
    return;
  }

  const updated = db.updateNotebook(notebookId, {
    title: title ?? notebook.title,
    description: description ?? notebook.description,
    cover_image: cover_image ?? notebook.cover_image,
    latitude: latitude ?? notebook.latitude,
    longitude: longitude ?? notebook.longitude,
    location_name: location_name ?? notebook.location_name,
    is_public: is_public !== undefined ? (is_public ? 1 : 0) : notebook.is_public
  });

  res.json({ notebook: updated });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notebookId = parseInt(id);

  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  if (notebook.owner_id !== req.userId!) {
    res.status(403).json({ error: '只有所有者可以删除' });
    return;
  }

  db.deleteNotebook(notebookId);
  res.json({ success: true });
});

router.get('/:id/collaborators', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notebookId = parseInt(id);

  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  if (notebook.owner_id !== req.userId!) {
    res.status(403).json({ error: '只有所有者可以管理协作者' });
    return;
  }

  const collabs = db.getCollaborators().filter(c => c.notebook_id === notebookId);
  const users = db.getUsers();
  
  const result = collabs.map(c => {
    const user = users.find(u => u.id === c.user_id);
    return { ...c, username: user?.username || '', avatar: user?.avatar || '' };
  });

  res.json({ collaborators: result });
});

router.post('/:id/collaborators', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notebookId = parseInt(id);
  const { user_id } = req.body;

  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  if (notebook.owner_id !== req.userId!) {
    res.status(403).json({ error: '只有所有者可以邀请协作者' });
    return;
  }

  if (!user_id) {
    res.status(400).json({ error: '请指定用户' });
    return;
  }

  const users = db.getUsers();
  const user = users.find(u => u.id === user_id);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  const collabs = db.getCollaborators();
  const existing = collabs.find(c => c.notebook_id === notebookId && c.user_id === user_id);

  if (existing) {
    res.status(400).json({ error: '该用户已是协作者' });
    return;
  }

  db.addCollaborator({ notebook_id: notebookId, user_id, role: 'editor' });
  res.status(201).json({ success: true });
});

router.delete('/:id/collaborators/:userId', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id, userId } = req.params;
  const notebookId = parseInt(id);
  const targetUserId = parseInt(userId);

  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);

  if (!notebook) {
    res.status(404).json({ error: '记录本不存在' });
    return;
  }

  if (notebook.owner_id !== req.userId!) {
    res.status(403).json({ error: '只有所有者可以移除协作者' });
    return;
  }

  db.removeCollaborator(notebookId, targetUserId);
  res.json({ success: true });
});

export default router;