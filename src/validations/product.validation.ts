import { ProductCategoryEnum } from '@/models/product.model';
import Joi from 'joi';

export const createProductSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  productImages: Joi.array().items(Joi.string()).min(1).required(),
  sellingPrice: Joi.number().positive().required(),
  category: Joi.string()
    .valid(...Object.values(ProductCategoryEnum))
    .required(),
  availableStock: Joi.number().integer().min(0).required(),
});

export const getAllProductsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10).optional(),
  category: Joi.string()
    .valid(...Object.values(ProductCategoryEnum), 'all_categories')
    .optional(),
  search: Joi.string().optional().allow(''),
});
