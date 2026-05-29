import { UserRole } from '@/models/user.model';
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]).{8,16}$/)
    .required(),
  role: Joi.string().valid(UserRole.Admin, UserRole.Customer).required(),
  profileImage: Joi.string().optional(),
  googleId: Joi.string().optional(),
  adminCode: Joi.string().length(4).optional(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

export const bookmarkSchema = Joi.object({
  auctionId: Joi.string().required(),
});
