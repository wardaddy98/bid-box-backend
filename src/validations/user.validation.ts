import { UserRole } from '@/models/user.model';
import Joi from 'joi';

export const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]).{8,16}$/)
    .required(),
  role: Joi.string().valid(UserRole.Admin, UserRole.Customer).required(),
  profileImage: Joi.string().optional(),
  bidsBalance: Joi.number().integer().positive().optional(),
  favoriteProducts: Joi.any(),
  googleId: Joi.string().optional(),
});
