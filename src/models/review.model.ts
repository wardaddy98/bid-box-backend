import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Product } from './product.model';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Review {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Product })
  product!: Ref<Product>;
}

export const ReviewModel = getModelForClass(Review);
