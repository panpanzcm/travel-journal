import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as db from '../database';
import { generateToken, authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response): void => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: '密码至少6位' });
    return;
  }

  const users = db.getUsers();
  const existing = users.find(u => u.email === email || u.username === username);
  if (existing) {
    res.status(409).json({ error: '用户名或邮箱已存在' });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = db.addUser({ username, email, password: hashed, avatar: '' });
  const token = generateToken(newUser.id);

  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, avatar: newUser.avatar } });
});

router.post('/login', (req: AuthRequest, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: '请填写邮箱和密码' });
    return;
  }

  const users = db.getUsers();
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const users = db.getUsers();
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, created_at: user.created_at } });
});

router.get('/search', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { q } = req.query;
  if (!q || String(q).length < 1) {
    res.json({ users: [] });
    return;
  }

  const users = db.getUsers();
  const searchTerm = String(q).toLowerCase();
  const filtered = users
    .filter(u => (u.username.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm)) && u.id !== req.userId)
    .slice(0, 20)
    .map(u => ({ id: u.id, username: u.username, email: u.email, avatar: u.avatar }));

  res.json({ users: filtered });
});

export default router;