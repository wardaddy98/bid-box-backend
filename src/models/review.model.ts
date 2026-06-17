import { getModelForClass, index, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';

@modelOptions({
  schemaOptions: {
    _id: false,
  },
})
class ReviewDetails {
  @prop({ required: true, min: 1, max: 5 })
  shipping!: number;

  @prop({ required: true, min: 1, max: 5 })
  productQuality!: number;

  @prop({ required: true, min: 1, max: 5 })
  asDescribed!: number;

  @prop({ required: true, min: 1, max: 5 })
  packaging!: number;
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
@index({ product: 1, user: 1 }, { unique: true })
export class Review {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Product })
  product!: Ref<Product>;

  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  details!: ReviewDetails;

  @prop({ required: true, min: 1, max: 5 })
  overallRating!: number;

  @prop({ maxlength: 1000, trim: true })
  comment!: string;

  @prop({ maxlength: 500, trim: true })
  title!: string;
}

export const ReviewModel = getModelForClass(Review);
