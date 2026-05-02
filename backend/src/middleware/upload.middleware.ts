import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure temp upload directory exists
const uploadDir = path.join(process.cwd(), 'temp_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/tiff',
    // Video
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac',
    // Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // Design
    'application/postscript', 'application/x-photoshop',
    // Archives
    'application/zip', 'application/x-rar-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
}).single('file');

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 5,
  },
}).array('files', 5);

export const uploadAvatar = multer({
  storage,
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed for avatar'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('avatar');

export default { uploadSingle, uploadMultiple, uploadAvatar };
