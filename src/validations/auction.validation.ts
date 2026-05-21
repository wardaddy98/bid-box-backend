import Joi from 'joi';
import { getAllProductsQuerySchema } from './product.validation';

export const getAllAuctionsQuerySchema = getAllProductsQuerySchema;

export const createAuctionSchema = Joi.object({
  product: Joi.string().required(),
  liveOn: Joi.string().required(),
  startingBid: Joi.number().min(1).integer().required(),
});

export const editAuctionSchema = Joi.object({
  product: Joi.string().optional().min(0),
  liveOn: Joi.string().optional().min(0),
  startingBid: Joi.number().min(1).integer().required(),
});
