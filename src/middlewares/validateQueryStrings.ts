import { BadRequestError } from '@/middlewares/handleError';
import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

const validateQueryString =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(
        `Validation failed- ${error.details.map(detail => detail.message).join(',')}`,
      );
    }

    req.body = value;
    next();
  };

export default validateQueryString;
