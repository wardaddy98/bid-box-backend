import validateSchema from '@/middlewares/validateSchema';
import { userSchema } from '@/validations/user.validation';
import express from 'express';
import { handleRegisterController } from './controller';
const router = express.Router();

router.route('/register').post(validateSchema(userSchema), handleRegisterController);

export default router;
