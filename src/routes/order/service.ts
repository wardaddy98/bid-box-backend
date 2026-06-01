import { InternalServerError } from '@/middlewares/handleError';
import { Order, OrderModel } from '@/models/order.model';
import { UserModel } from '@/models/user.model';
import handleTransaction from '@/utils/handleTransaction';
import mongoose from 'mongoose';
import { OrderPaymentStatusEnum } from '../../models/order.model';

export const getOrderByRazorPayId = async (razorPayOrderId: string) => {
  return OrderModel.findOne({
    razorPayOrderId,
  }).lean();
};

export const bidPackPurchaseSuccessFullTransaction = async (
  userObjectId: mongoose.Types.ObjectId,
  orderObjectId: mongoose.Types.ObjectId,
  totalBids: number,
) => {
  return handleTransaction(
    async session => {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userObjectId,
        {
          $inc: {
            bidsBalance: totalBids,
          },
        },
        { session, returnDocument: 'after' },
      ).lean();

      await OrderModel.findByIdAndUpdate(
        {
          _id: orderObjectId,
        },
        {
          $set: {
            paymentStatus: OrderPaymentStatusEnum.Success,
          },
        },
        {
          session,
        },
      );

      return {
        updatedUser,
      };
    },

    () => {
      throw new InternalServerError('Unexpected error has occurred! Contact our team for support.');
    },
  );
};

export const createOrder = async (payload: Omit<Order, '_id' | 'paymentStatus'>) => {
  return (await OrderModel.create(payload)).toObject();
};

export const updatePaymentFailure = async (orderId: string) => {
  return OrderModel.findOneAndUpdate(
    { orderId },
    {
      $set: {
        paymentStatus: OrderPaymentStatusEnum.Failed,
      },
    },
  );
};
