import { InternalServerError } from '@/middlewares/handleError';
import { Order, OrderModel, OrderTypeEnum } from '@/models/order.model';
import { Product, ProductModel } from '@/models/product.model';
import { UserModel } from '@/models/user.model';
import { generateOrderId } from '@/utils/commonUtils';
import handleTransaction from '@/utils/handleTransaction';
import mongoose, { ClientSession } from 'mongoose';
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
        orderObjectId,
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

export const createDirectPurchaseOrder = async (
  user: mongoose.Types.ObjectId,
  product: Product,
  netDeduction: number,
) => {
  return handleTransaction(async (session: ClientSession) => {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user,
      {
        $inc: {
          bidsBalance: -netDeduction,
        },
      },
      {
        returnDocument: 'after',
        lean: true,
        session,
      },
    );

    await OrderModel.create(
      [
        {
          user: user,
          amount: Number(product?.sellingPrice ?? 0) * 100,
          orderId: generateOrderId(),
          product: product._id,
          orderType: OrderTypeEnum.Product,
          paymentStatus: OrderPaymentStatusEnum.Success,
        },
      ],
      {
        session,
      },
    );

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      product._id,
      {
        $inc: {
          availableStock: -1,
        },
      },
      {
        returnDocument: 'after',
        lean: true,
        session,
      },
    );

    return {
      bidsBalance: updatedUser?.bidsBalance ?? 0,
      availableStock: updatedProduct?.availableStock ?? 0,
    };
  });
};
