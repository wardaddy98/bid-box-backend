import Joi from 'joi';

export const verifyPaymentSchema = Joi.object({
  razorpay_payment_id: Joi.string().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

export const paymentFailureSchema = Joi.object({
  orderId: Joi.string().required(),
});

export const createDirectPurchaseOrderSchema = Joi.object({
  productId: Joi.string().required(),
  auctionId: Joi.string().min(0).optional(),
  netDeduction: Joi.number().integer().required(),
});
