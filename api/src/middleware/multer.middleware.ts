import multer from 'multer';
import { CLOUDINARY } from '../utils/constants';
import { BadRequestError } from '../utils/errors';

// Use memory storage for Cloudinary upload
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

  if (!fileExtension || !CLOUDINARY.ALLOWED_FORMATS.includes(fileExtension as any)) {
    cb(
      new BadRequestError(
        `Invalid file format. Allowed formats: ${CLOUDINARY.ALLOWED_FORMATS.join(', ')}`
      )
    );
    return;
  }

  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CLOUDINARY.MAX_FILE_SIZE,
  },
});

