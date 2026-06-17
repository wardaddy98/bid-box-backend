import isLoggedIn from '@/middlewares/isLoggedIn';
import upload from '@/middlewares/upload';
import validateQueryString from '@/middlewares/validateQueryStrings';
import validateSchema from '@/middlewares/validateSchema';
import {
  createProductReviewSchema,
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
  handleProductReview,
} from './controller';

const router = express.Router();

router
  .route('/')
  .post(isLoggedIn, upload.array('files'), validateSchema(createProductSchema), handleCreateProduct)
  .get(isLoggedIn, validateQueryString(getAllProductsQuerySchema), handleGetAllProducts);

router.route('/raw').get(isLoggedIn, handleGetAllProductsUnpaginated);

router
  .route('/review')
  .post(isLoggedIn, validateSchema(createProductReviewSchema), handleProductReview);

router
  .route('/:productId')
  .patch(isLoggedIn, upload.array('files'), validateSchema(editProductSchema), handleEditProduct);

export default router;
