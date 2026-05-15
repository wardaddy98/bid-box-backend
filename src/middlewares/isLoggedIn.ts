import { UserModel } from '@/models/user.model';
import { RequestWithUser, verifyToken } from '@/utils/token';
import { NextFunction, Response } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import _ from 'lodash';
import { ApiError, ForbiddenError, InternalServerError, UnAuthorizedError } from './handleError';

export default async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const {
      headers: { authorization },
    } = req;

    const token = authorization?.split(' ')?.[1];

    if (!token) {
      throw new ForbiddenError('Token missing!');
    }

    const decoded = verifyToken(token);

    const user = await UserModel.findOne({ _id: decoded.userId }).lean();

    if (_.isEmpty(user)) {
      throw new ForbiddenError('User does not exist!');
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;

    if (error instanceof jwt.TokenExpiredError) {
      throw new UnAuthorizedError('Token Expired!');
    }

    if (error instanceof JsonWebTokenError) {
      throw new ForbiddenError('Invalid Token!');
    }
    throw new InternalServerError();
  }
};
