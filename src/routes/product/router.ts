import isLoggedIn from '@/middlewares/isLoggedIn';
import validateQueryString from '@/middlewares/validateQueryStrings';
import validateSchema from '@/middlewares/validateSchema';
import { createProductSchema, getAllProductsQuerySchema } from '@/validations/product.validation';
import express from 'express';
import { handleCreateProduct, handleGetAllProducts } from './controller';

const router = express.Router();

router
  .route('/')
  .post(isLoggedIn, validateSchema(createProductSchema), handleCreateProduct)
  .get(isLoggedIn, validateQueryString(getAllProductsQuerySchema), handleGetAllProducts);

export default router;
