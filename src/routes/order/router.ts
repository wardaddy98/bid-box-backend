import isLoggedIn from '@/middlewares/isLoggedIn';
import validateQueryString from '@/middlewares/validateQueryStrings';
import validateSchema from '@/middlewares/validateSchema';
import {
  createDirectPurchaseOrderSchema,
  createRazorPayOrderSchema,
  getAllOrdersQuerySchema,
  paymentFailureSchema,
  verifyPaymentSchema,
} from '@/validations/order.validation';
import express from 'express';
import {
  handleCreateDirectPurchaseOrder,
  handleCreateRazorPayOrder,
  handleGetAllOrders,
  handlePaymentFailure,
  handleVerifyRazorPayPayment,
} from './controller';

const router = express.Router();

router
  .route('/')
  .post(isLoggedIn, validateSchema(createRazorPayOrderSchema), handleCreateRazorPayOrder)
  .get(isLoggedIn, validateQueryString(getAllOrdersQuerySchema), handleGetAllOrders);

router
  .route('/product')
  .post(
    isLoggedIn,
    validateSchema(createDirectPurchaseOrderSchema),
    handleCreateDirectPurchaseOrder,
  );

router
  .route('/verify')
  .post(isLoggedIn, validateSchema(verifyPaymentSchema), handleVerifyRazorPayPayment);

router
  .route('/failure')
  .patch(isLoggedIn, validateSchema(paymentFailureSchema), handlePaymentFailure);

export default router;
