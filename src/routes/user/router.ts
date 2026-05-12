import validateSchema from '@/middlewares/validateSchema';
import { createUserSchema, loginUserSchema } from '@/validations/user.validation';
import express from 'express';
import {
  handleLoginController,
  handleRefreshController,
  handleRegisterController,
} from './controller';
const router = express.Router();

router.route('/register').post(validateSchema(createUserSchema), handleRegisterController);
router.route('/login').post(validateSchema(loginUserSchema), handleLoginController);
router.route('/refresh').get(handleRefreshController);

export default router;
