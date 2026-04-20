import multer from 'multer';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (adjust if needed)
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'video/mp4'
    ) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type', 400) as any, false);
    }
  },
});