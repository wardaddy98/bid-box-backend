import { NextFunction, Request, Response } from 'express';

export default (req: Request & { isLoggedIn?: string }, res: Response, next: NextFunction) => {
  req.isLoggedIn = 'test';
  next();
};
