import { AuctionStatusEnum } from '@/models/auction.model';
import { ProductCategoryEnum } from '@/models/product.model';
import Joi from 'joi';

export const getAllAuctionsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10).optional(),
  category: Joi.string()
    .valid(...Object.values(ProductCategoryEnum), 'all_categories')
    .optional(),
  search: Joi.string().optional().allow(''),
  status: Joi.string()
    .valid(...Object.values(AuctionStatusEnum))
    .optional(),
});
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
