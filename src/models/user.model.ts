import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Product } from './product.model';

export enum UserRole {
  Admin = 'admin',
  Customer = 'customer',
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class User {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, unique: true, immutable: true, lowercase: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ enum: UserRole, required: true })
  public role!: UserRole;

  @prop()
  public profileImage?: string;

  @prop({
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Bids balance must be an integer',
    },
  })
  public bidsBalance?: number;

  @prop({ default: [], ref: () => Product })
  public favoriteProducts?: Ref<Product>[];

  @prop()
  public googleId?: string;
}

export const UserModel = getModelForClass(User);
