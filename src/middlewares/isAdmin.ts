import { User, UserRole } from '@/models/user.model';
import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from './handleError';

export interface IRequestWithUser extends Request {
  user?: User;
}

const isAdmin = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  console.log(req.user, 'LMM');
  if (req.user?.role !== UserRole.Admin) {
    throw new BadRequestError('User is not admin!');
  }
  next();
};

export default isAdmin;
