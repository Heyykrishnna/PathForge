import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR, 'resumes');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only PDF files are supported for resume upload'));
  }
};

export const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
}).single('resume');

