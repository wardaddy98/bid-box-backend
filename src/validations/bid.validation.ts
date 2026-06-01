import Joi from 'joi';

export const placeBidSchema = Joi.object({
  auctionId: Joi.string().required(),
  amount: Joi.number().integer().required(),
});

export const createBidBackSchema = Joi.object({
  baseBids: Joi.number().integer().required(),
  bonusBids: Joi.number().integer().required(),
  price: Joi.number().integer().required(),
  popular: Joi.boolean().optional(),
});
