import Joi from 'joi';

export const placeBidSchema = Joi.object({
  auctionId: Joi.string().required(),
  amount: Joi.number().integer().required(),
});
