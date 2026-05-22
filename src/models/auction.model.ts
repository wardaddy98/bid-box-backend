import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
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

  @prop({ required: true, unique: true, default: () => `AUC-${nanoid(6).toUpperCase()}` })
  public auctionId!: string;

  @prop({ required: true, ref: () => Product })
  public product!: Ref<Product>;

  @prop({
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Starting Bid must be an integer',
    },
  })
  public startingBid!: number;

  @prop({ required: true, enum: AuctionStatusEnum, default: AuctionStatusEnum.Pending })
  public status!: AuctionStatusEnum;

  @prop({ required: true })
  public liveOn!: Date;
}

export const AuctionModel = getModelForClass(Auction);
