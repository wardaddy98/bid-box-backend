import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';

export enum ProductPurchaseThroughEnum {
  Auction = 'auction',
  Direct = 'direct',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Order {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Product })
  public product!: Ref<Product>;

  @prop({ required: true, ref: () => User })
  public user!: Ref<User>;

  @prop({ required: true, enum: ProductPurchaseThroughEnum })
  public purchasedThrough!: ProductPurchaseThroughEnum;

  @prop({ required: true })
  public sellingPrice!: number;
}

export const UserModel = getModelForClass(Order);
