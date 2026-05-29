import multer from 'multer';
import { BadRequestError } from './handleError';

const upload = multer({
  // saves file to RAM temporarily until it is accessed in next middleware to be uploaded to s3
  storage: multer.memoryStorage(),
  limits: {
    files: 6,
    //5mb
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new BadRequestError('Only images are allowed'));
    }

    callback(null, true);
  },
});

export default upload;
