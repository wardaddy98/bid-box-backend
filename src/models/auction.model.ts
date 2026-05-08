import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Bid } from './bid.model';
import { Product } from './product.model';

export enum AuctionStatusEnum {
  Pending = 'pending',
  Live = 'live',
  Completed = 'completed',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Auction {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Product })
  public product!: Ref<Product>;

  @prop({ required: true, ref: () => Bid })
  public bidsPlaced!: Ref<Bid>[];

  @prop({ required: true, enum: AuctionStatusEnum, default: AuctionStatusEnum.Pending })
  public status!: AuctionStatusEnum;

  @prop({ required: true })
  public liveOn!: Date;
}

export const UserModel = getModelForClass(Auction);
