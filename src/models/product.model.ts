import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Review } from './review.model';

export enum ProductCategoryEnum {
  Electronics = 'electronics',
  Automobile = 'automobile',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Product {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true, default: [], type: () => [String] })
  public productImages!: string[];

  @prop({ required: true })
  public originalPrice!: number;

  @prop({ required: true, enum: ProductCategoryEnum })
  public category!: ProductCategoryEnum;

  @prop({ required: true })
  public availableStock!: number;

  @prop({ default: [], ref: () => Review })
  public reviews?: Ref<Review>[];
}

export const ProductModel = getModelForClass(Product);
