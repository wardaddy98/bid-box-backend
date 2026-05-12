import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { User } from './user.model';

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class RefreshToken {
  public _id!: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  public token!: string;

  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  public iat!: Date;

  //TTL Index , will delete document 0 seconds after exp
  @prop({ required: true, expires: 0 })
  public exp!: Date;
}

export const RefreshTokenModel = getModelForClass(RefreshToken);
