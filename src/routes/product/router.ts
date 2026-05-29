import isLoggedIn from '@/middlewares/isLoggedIn';
import upload from '@/middlewares/upload';
import validateQueryString from '@/middlewares/validateQueryStrings';
import validateSchema from '@/middlewares/validateSchema';
import {
  createProductSchema,
  editProductSchema,
  getAllProductsQuerySchema,
} from '@/validations/product.validation';
import express from 'express';
import {
  handleCreateProduct,
  handleEditProduct,
  handleGetAllProducts,
  handleGetAllProductsUnpaginated,
} from './controller';

const router = express.Router();

router
  .route('/')
  .post(isLoggedIn, upload.array('files'), validateSchema(createProductSchema), handleCreateProduct)
  .get(isLoggedIn, validateQueryString(getAllProductsQuerySchema), handleGetAllProducts);

router
  .route('/:productId')
  .patch(isLoggedIn, upload.array('files'), validateSchema(editProductSchema), handleEditProduct);

router.route('/raw').get(isLoggedIn, handleGetAllProductsUnpaginated);
export default router;
