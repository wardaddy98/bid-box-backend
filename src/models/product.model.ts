import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

export enum ProductCategoryEnum {
  Electronics = 'electronics',
  Fashion = 'fashion',
  'Home Appliances' = 'home_appliances',
  Automobiles = 'automobiles',
  Collectables = 'collectables',
  Sports = 'sports',
  Furniture = 'furniture',
  Books = 'books',
  Others = 'others',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Product {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true, unique: true, default: () => `PRD-${nanoid(6).toUpperCase()}` })
  public productId!: string;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true, default: [], type: () => [String] })
  public productImages!: string[];

  @prop({ required: true })
  public sellingPrice!: number;

  @prop({ required: true, enum: ProductCategoryEnum })
  public category!: ProductCategoryEnum;

  @prop({ required: true })
  public availableStock!: number;
}

export const ProductModel = getModelForClass(Product);
