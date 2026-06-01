import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import mongoose from 'mongoose';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class BidPack {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public baseBids!: number;

  @prop({ required: true })
  public bonusBids!: number;

  @prop({ required: true })
  public price!: number;

  @prop({ default: false })
  public popular?: boolean;
}

export const BidPackModel = getModelForClass(BidPack);
