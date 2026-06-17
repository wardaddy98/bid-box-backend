import { InternalServerError } from '@/middlewares/handleError';
import { Order, OrderModel, OrderTypeEnum } from '@/models/order.model';
import { Product, ProductModel } from '@/models/product.model';
import { UserModel } from '@/models/user.model';
import { generateOrderId } from '@/utils/commonUtils';
import handleTransaction from '@/utils/handleTransaction';
import { generateSignedUrl } from '@/utils/s3Utils';
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
        { session, returnDocument: 'after', lean: true },
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

export const getAllOrders = async (
  userObjectId: mongoose.Types.ObjectId,
  paymentStatus?: OrderPaymentStatusEnum | 'all',
  search?: string,
) => {
  const orders = await OrderModel.aggregate([
    {
      $match: {
        user: userObjectId,
        ...(paymentStatus === 'all' ? {} : { paymentStatus }),
        ...(search ? { orderId: { $regex: search, $options: 'i' } } : {}),
      },
    },

    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        pipeline: [
          {
            $lookup: {
              from: 'reviews',
              let: {
                productObjectId: '$_id',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$productObjectId', '$product'] },
                        { $eq: [userObjectId, '$user'] },
                      ],
                    },
                  },
                },
              ],
              as: 'review',
            },
          },
          {
            $unwind: {
              path: '$review',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],

        as: 'product',
      },
    },
    {
      $unwind: {
        path: '$product',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'auctions',
        localField: 'auction',
        foreignField: '_id',
        pipeline: [
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'product',
            },
          },

          {
            $unwind: {
              path: '$product',
            },
          },
        ],

        as: 'auction',
      },
    },
    {
      $unwind: {
        path: '$auction',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'bidpacks',
        localField: 'bidPack',
        foreignField: '_id',
        as: 'bidPack',
      },
    },
    {
      $unwind: {
        path: '$bidPack',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]).exec();

  const ordersWithProductImages = await Promise.all(
    orders.map(async order => {
      let productImages = [];
      if (order.product) {
        productImages = await Promise.all(
          order?.product?.productImages.map(async (objectKey: string) => {
            return {
              objectKey,
              signedUrl: await generateSignedUrl(objectKey),
            };
          }),
        );
      }

      return {
        ...order,
        ...(order?.product ? { product: { ...order.product, productImages } } : {}),
      };
    }),
  );

  return ordersWithProductImages;
};
