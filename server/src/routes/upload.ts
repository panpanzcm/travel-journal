import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type as string || 'general';
    const dir = path.join(uploadDir, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const type = req.query.type as string || 'general';
  const allowed: Record<string, string[]> = {
    photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.webm', '.mov'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a'],
    general: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov', '.mp3', '.wav', '.ogg', '.m4a', '.pdf']
  };
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed[type]?.includes(ext) || type === 'general') {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/', authMiddleware, upload.single('file'), (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: '请上传文件' });
    return;
  }

  const type = req.query.type as string || 'general';
  const filePath = `/uploads/${type}/${req.file.filename}`;
  
  let thumbnailPath = '';
  const ext = path.extname(req.file.filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    thumbnailPath = filePath;
  }

  res.json({
    file: {
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      type,
      path: filePath,
      thumbnail_path: thumbnailPath
    }
  });
});

router.post('/multiple', authMiddleware, upload.array('files', 10), (req: AuthRequest, res: Response): void => {
  if (!req.files || !Array.isArray(req.files)) {
    res.status(400).json({ error: '请上传文件' });
    return;
  }

  const type = req.query.type as string || 'general';
  const files = req.files.map(file => ({
    filename: file.filename,
    original_name: file.originalname,
    size: file.size,
    type,
    path: `/uploads/${type}/${file.filename}`
  }));

  res.json({ files });
});

export default router;