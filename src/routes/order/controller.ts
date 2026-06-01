import { BadRequestError } from '@/middlewares/handleError';
import { IRequestWithUser } from '@/middlewares/isAdmin';
import { OrderTypeEnum } from '@/models/order.model';
import { generateOrderId } from '@/utils/commonUtils';
import createRazorPayInstance from '@/utils/createRazorPayInstance';
import { handleResponse } from '@/utils/handleResponse';
import { verifyPaymentSignature } from '@/utils/razporPayUtils';
import stringToObjectId from '@/utils/stringToObjectId';
import { Request, Response } from 'express';
import _ from 'lodash';
import mongoose from 'mongoose';
import { getBidPackById } from '../bid/service';
import { getProductById } from '../product/service';
import {
  bidPackPurchaseSuccessFullTransaction,
  createOrder,
  getOrderByRazorPayId,
  updatePaymentFailure,
} from './service';

const razorPayInstance = createRazorPayInstance();

interface ICreateOrderRequest extends Omit<IRequestWithUser, 'body'> {
  body: {
    orderType: OrderTypeEnum;
    bidPack?: string;
    product?: string;
  };
}

export interface IRazorPaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

type IVerifyPaymentRequest = Omit<IRequestWithUser, 'body'> & {
  body: IRazorPaySuccessResponse;
};

export const handleCreateRazorPayOrder = async (req: ICreateOrderRequest, res: Response) => {
  const orderId = generateOrderId();
  const payload = req.body;
  let amount = 0;

  if (payload.orderType === OrderTypeEnum['Bids Pack']) {
    const bidPack = await getBidPackById(payload.bidPack || '');

    if (!payload.bidPack) {
      throw new BadRequestError('Bid pack not selected!');
    }

    if (_.isEmpty(bidPack)) {
      throw new BadRequestError('Bid pack does not exist!');
    }
    amount = bidPack?.price ?? 0;
  } else if (payload.orderType === OrderTypeEnum.Product) {
    if (!payload.product) {
      throw new BadRequestError('Product not selected!');
    }

    const product = await getProductById(payload.product);
    if (_.isEmpty(product)) {
      throw new BadRequestError('Product does not exist!');
    }

    if (!(product.availableStock > 0)) {
      throw new BadRequestError('Product stock not available!');
    }

    amount = product.sellingPrice;
  }

  const response = await razorPayInstance.orders.create({
    currency: 'INR',
    receipt: orderId,
    amount: amount * 100,
  });

  const order = await createOrder({
    user: req.user?._id as mongoose.Types.ObjectId,
    amount,
    orderType: payload.orderType,
    orderId,
    razorPayOrderId: response?.id,
    razorPayMetaData: response,
    ...(payload?.bidPack ? { bidPack: stringToObjectId(payload?.bidPack ?? '') } : {}),
    ...(payload?.product ? { product: stringToObjectId(payload?.product ?? '') } : {}),
  });

  return handleResponse(res, 200, 'Razorpay order created', {
    data: { razorPayOrderId: order.razorPayOrderId, amount: order.amount, orderId: order.orderId },
  });
};

export const handleVerifyRazorPayPayment = async (req: IVerifyPaymentRequest, res: Response) => {
  const user = req.user;

  const order = await getOrderByRazorPayId(req.body.razorpay_order_id);

  if (_.isEmpty(order)) {
    throw new BadRequestError('Order does not exist!');
  }

  if (!order.bidPack) {
    throw new BadRequestError('Bid pack not selected at the time of purchase');
  }

  const bidPack = await getBidPackById(order.bidPack.toString());

  const verified = verifyPaymentSignature({
    razorpay_order_id: req.body.razorpay_order_id,
    razorpay_payment_id: req.body.razorpay_payment_id,
    razorpay_signature: req.body.razorpay_signature,
  });

  if (!verified) {
    return handleResponse(res, 200, '', {
      data: { verified },
    });
  }

  const totalBids = Number(bidPack?.baseBids || 0) + Number(bidPack?.bonusBids || 0);

  const { updatedUser } = await bidPackPurchaseSuccessFullTransaction(
    user?._id as mongoose.Types.ObjectId,
    order._id as mongoose.Types.ObjectId,
    totalBids,
  );

  return handleResponse(res, 200, '', {
    data: {
      verified,
      user: {
        bidsBalance: updatedUser?.bidsBalance,
        email: updatedUser?.email,
      },
    },
  });
};

export const handlePaymentFailure = async (req: Request, res: Response) => {
  await updatePaymentFailure(req.body?.orderId as string);

  return handleResponse(res, 200, '', {
    data: {},
  });
};
