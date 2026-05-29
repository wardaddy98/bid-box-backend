import Joi from 'joi';

export const getSignedUrlsSchema = Joi.object({
  objectKeys: Joi.array().items(Joi.string()),
});
