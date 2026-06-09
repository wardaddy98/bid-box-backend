import constants from '@/constants';
import crypto from 'crypto';
import createRazorPayInstance from './createRazorPayInstance';

const razorPayInstance = createRazorPayInstance();

export const verifyPaymentSignature = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean => {
  const generatedSignature = crypto
    .createHmac('sha256', constants.RAZORPAY_KEY_SECRET)
    .update(data.razorpay_order_id + '|' + data.razorpay_payment_id)
    .digest('hex');
  return generatedSignature === data.razorpay_signature;
};

export const createRPayOrder = async (orderId: string, amount: number) => {
  const response = await razorPayInstance.orders.create({
    currency: 'INR',
    receipt: orderId,
    //amount in rupees converted to paise
    amount: amount * 100,
  });

  return response;
};
