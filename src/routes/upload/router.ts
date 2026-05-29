import isLoggedIn from '@/middlewares/isLoggedIn';
import upload from '@/middlewares/upload';
import validateSchema from '@/middlewares/validateSchema';
import { getSignedUrlsSchema } from '@/validations/upload.validation';
import express from 'express';
import { handleGetSignedUrls, handleUpload } from './controller';

const router = express.Router();

router
  .route('/')
  .post(isLoggedIn, upload.array('files'), handleUpload)
  .get(isLoggedIn, validateSchema(getSignedUrlsSchema), handleGetSignedUrls);

export default router;
