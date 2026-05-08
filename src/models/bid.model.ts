import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { User } from './user.model';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Bid {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => User })
  public placedBy!: Ref<User>;

  @prop({
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Bids Placed must be an integer',
    },
  })
  public bidsPlaced!: number;
}

export const UserModel = getModelForClass(Bid);
