import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Auction } from './auction.model';
import { User } from './user.model';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Bid {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Auction })
  public auction!: Ref<Auction>;

  @prop({ required: true, ref: () => User })
  public user!: Ref<User>;

  @prop({
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Bids Placed must be an integer',
    },
  })
  public amount!: number;
}

export const BidModel = getModelForClass(Bid);
