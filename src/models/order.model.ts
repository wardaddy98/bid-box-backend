import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Auction } from './auction.model';
import { BidPack } from './bidPacks.model';
import { Product } from './product.model';
import { User } from './user.model';

export enum OrderTypeEnum {
  'Bids Pack' = 'bids_pack',
  Auction = 'auction',
  Product = 'product',
}

export enum OrderPaymentStatusEnum {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Order {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  orderId!: string;

  @prop({ required: true, ref: () => User })
  public user!: Ref<User>;

  @prop({ required: true })
  public amount!: number;

  @prop({})
  public razorPayOrderId?: string;

  @prop({ type: () => mongoose.Schema.Types.Mixed })
  public razorPayMetaData?: unknown;

  @prop({ ref: () => Product })
  public product?: Ref<Product>;

  @prop({ ref: () => Auction })
  public auction?: Ref<Auction>;

  @prop({ ref: () => BidPack })
  public bidPack?: Ref<BidPack>;

  @prop({ required: true, enum: OrderTypeEnum })
  public orderType!: OrderTypeEnum;

  @prop({ required: true, enum: OrderPaymentStatusEnum, default: OrderPaymentStatusEnum.Pending })
  public paymentStatus!: OrderPaymentStatusEnum;
}

export const OrderModel = getModelForClass(Order);
