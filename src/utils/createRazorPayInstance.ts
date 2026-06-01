import constants from '@/constants';
import Razorpay from 'razorpay';

const createRazorPayInstance = () =>
  new Razorpay({
    key_id: constants.RAZORPAY_KEY_ID,
    key_secret: constants.RAZORPAY_KEY_SECRET,
  });

export default createRazorPayInstance;
