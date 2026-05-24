import { getModelForClass, index, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { Bid } from './bid.model';
import { Product } from './product.model';

export enum AuctionStatusEnum {
  Pending = 'pending',
  Live = 'live',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

//compound index for status and liveOn, as these are repeatedly searched in cron job
@index({ status: 1, liveOn: 1 })
@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Auction {
  public _id!: mongoose.Types.ObjectId;

  public updatedAt!: Date;
  public createdAt!: Date;

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

  @prop()
  public expiresAt?: Date;

  // used string instead of  ref : ()=> Bid to avoid circular dependency
  @prop({ ref: 'Bid' })
  public winningBid?: Ref<Bid>;
}

export const AuctionModel = getModelForClass(Auction);
