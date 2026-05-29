import isLoggedIn from '@/middlewares/isLoggedIn';
import upload from '@/middlewares/upload';
import validateSchema from '@/middlewares/validateSchema';
import { bookmarkSchema, createUserSchema, loginUserSchema } from '@/validations/user.validation';
import express from 'express';
import {
  handleAddBookmark,
  handleLoginController,
  handleRefreshController,
  handleRegisterController,
  handleRemoveBookmark,
} from './controller';
const router = express.Router();

router.route('/add-bookmark').patch(isLoggedIn, validateSchema(bookmarkSchema), handleAddBookmark);

router
  .route('/remove-bookmark')
  .patch(isLoggedIn, validateSchema(bookmarkSchema), handleRemoveBookmark);

router
  .route('/register')
  .post(upload.single('file'), validateSchema(createUserSchema), handleRegisterController);

router.route('/login').post(validateSchema(loginUserSchema), handleLoginController);

router.route('/refresh').get(handleRefreshController);

export default router;
