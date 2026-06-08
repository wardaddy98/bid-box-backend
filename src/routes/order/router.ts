import isLoggedIn from '@/middlewares/isLoggedIn';
import validateSchema from '@/middlewares/validateSchema';
import {
  createDirectPurchaseOrderSchema,
  paymentFailureSchema,
  verifyPaymentSchema,
} from '@/validations/order.validation';
import express from 'express';
import {
  handleCreateDirectPurchaseOrder,
  handleCreateRazorPayOrder,
  handlePaymentFailure,
  handleVerifyRazorPayPayment,
} from './controller';

const router = express.Router();

router.route('/').post(isLoggedIn, handleCreateRazorPayOrder, handleCreateDirectPurchaseOrder);

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
