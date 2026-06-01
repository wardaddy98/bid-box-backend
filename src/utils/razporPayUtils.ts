import constants from '@/constants';
import crypto from 'crypto';

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
