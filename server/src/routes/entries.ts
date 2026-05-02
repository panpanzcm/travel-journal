import { Router, Response } from 'express';
import * as db from '../database';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function canAccessNotebook(notebookId: number, userId: number | undefined): boolean {
  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);
  if (!notebook) return false;
  if (notebook.is_public) return true;
  if (notebook.owner_id === userId) return true;
  const collabs = db.getCollaborators();
  return collabs.some(c => c.notebook_id === notebookId && c.user_id === userId);
}

function canEditNotebook(notebookId: number, userId: number | undefined): boolean {
  const notebooks = db.getNotebooks();
  const notebook = notebooks.find(n => n.id === notebookId);
  if (!notebook) return false;
  if (notebook.owner_id === userId) return true;
  const collabs = db.getCollaborators();
  return collabs.some(c => c.notebook_id === notebookId && c.user_id === userId);
}

router.get('/:notebookId/entries', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { notebookId } = req.params;
  const nid = parseInt(notebookId);

  if (!canAccessNotebook(nid, req.userId)) {
    res.status(403).json({ error: '无权访问' });
    return;
  }

  const entries = db.getEntries().filter(e => e.notebook_id === nid);
  const users = db.getUsers();

  const result = entries.map(e => {
    const author = users.find(u => u.id === e.author_id);
    return {
      ...e,
      author_username: author?.username || '',
      author_avatar: author?.avatar || ''
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ entries: result });
});

router.post('/:notebookId/entries', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { notebookId } = req.params;
  const nid = parseInt(notebookId);
  const { type, content, file_path, thumbnail_path, latitude, longitude, route_data } = req.body;

  if (!canEditNotebook(nid, req.userId)) {
    res.status(403).json({ error: '无权编辑' });
    return;
  }

  if (!type) {
    res.status(400).json({ error: '请指定类型' });
    return;
  }

  const validTypes = ['text', 'photo', 'video', 'audio', 'route'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: '无效类型' });
    return;
  }

  const entry = db.addEntry({
    notebook_id: nid,
    author_id: req.userId!,
    type,
    content: content || '',
    file_path: file_path || '',
    thumbnail_path: thumbnail_path || '',
    latitude: latitude || null,
    longitude: longitude || null,
    route_data: route_data || ''
  });

  const users = db.getUsers();
  const author = users.find(u => u.id === req.userId);
  
  db.updateNotebook(nid, {});

  res.status(201).json({ entry: { ...entry, author_username: author?.username || '', author_avatar: author?.avatar || '' } });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const entryId = parseInt(id);
  const { content, file_path, thumbnail_path, latitude, longitude, route_data } = req.body;

  const entries = db.getEntries();
  const entry = entries.find(e => e.id === entryId);

  if (!entry) {
    res.status(404).json({ error: '条目不存在' });
    return;
  }

  if (!canEditNotebook(entry.notebook_id, req.userId)) {
    res.status(403).json({ error: '无权编辑' });
    return;
  }

  const updated = db.updateEntry(entryId, {
    content: content ?? entry.content,
    file_path: file_path ?? entry.file_path,
    thumbnail_path: thumbnail_path ?? entry.thumbnail_path,
    latitude: latitude ?? entry.latitude,
    longitude: longitude ?? entry.longitude,
    route_data: route_data ?? entry.route_data
  });

  res.json({ entry: updated });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const entryId = parseInt(id);

  const entries = db.getEntries();
  const entry = entries.find(e => e.id === entryId);

  if (!entry) {
    res.status(404).json({ error: '条目不存在' });
    return;
  }

  if (!canEditNotebook(entry.notebook_id, req.userId)) {
    res.status(403).json({ error: '无权删除' });
    return;
  }

  db.deleteEntry(entryId);
  res.json({ success: true });
});

export default router;