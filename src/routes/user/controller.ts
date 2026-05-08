import { handleResponse } from '@/utils/handleResponse';
import { Request, Response } from 'express';
import { createUser } from './service';
// import constants from '@/constants';
// const {JWT_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY} = constants;

export const handleRegisterController = async (req: Request, res: Response) => {
  const createdUser = await createUser(req.body);

  //     jwt logic

  return handleResponse(res, 200, 'User created successfully', createdUser);
};
