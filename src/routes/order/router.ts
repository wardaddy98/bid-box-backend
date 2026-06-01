import isLoggedIn from '@/middlewares/isLoggedIn';
import validateSchema from '@/middlewares/validateSchema';
import { paymentFailureSchema, verifyPaymentSchema } from '@/validations/payment.validation';
import express from 'express';
import {
  handleCreateRazorPayOrder,
  handlePaymentFailure,
  handleVerifyRazorPayPayment,
} from './controller';

const router = express.Router();

router.route('/').post(isLoggedIn, handleCreateRazorPayOrder);

router
  .route('/verify')
  .post(isLoggedIn, validateSchema(verifyPaymentSchema), handleVerifyRazorPayPayment);

router
  .route('/failure')
  .patch(isLoggedIn, validateSchema(paymentFailureSchema), handlePaymentFailure);

export default router;
