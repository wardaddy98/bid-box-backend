import { getModelForClass } from '@typegoose/typegoose';
import mongoose from 'mongoose';

export class Review {
  public _id!: mongoose.Types.ObjectId;
}

export const ReviewModel = getModelForClass(Review);
