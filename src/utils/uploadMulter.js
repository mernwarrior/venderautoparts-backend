
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const createUploader = (subFolder = '') => {
  const baseUploadPath = path.join(process.cwd(), 'uploads');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(baseUploadPath, subFolder);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);

      const uniqueName = `${uuidv4()}${extension}`;

      // save relative path
      file.relativePath = path
        .join('uploads', subFolder, uniqueName)
        .replace(/\\/g, '/');

      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      // images
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',

      // videos
      'video/mp4',
      'video/mpeg',
      'video/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only images (JPG, PNG, WEBP) and videos (MP4) are allowed'
        ),
        false
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 200 * 1024 * 1024,
    },
  });
};