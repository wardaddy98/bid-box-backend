import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from '@/middlewares/handleError';
import { User } from '@/models/user.model';
import { handleResponse } from '@/utils/handleResponse';
import { checkPasswordValid } from '@/utils/hashing';
import {
  generateAccessToken,
  generateRefreshToken,
  TokenCreationData,
  verifyRefreshToken,
} from '@/utils/token';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { createUser, findRefreshToken, findUserByEmail, findUserById } from './service';

export const handleRegisterController = async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  const tokenData: TokenCreationData = {
    email: user.email,
    role: user.role,
    userId: user._id,
  };

  const token = generateAccessToken(tokenData, { expiresIn: '15m' });
  await generateRefreshToken(tokenData, { expiresIn: '7d' }, res);
  const userResponse: Partial<User> = _.cloneDeep(user);
  delete userResponse.password;
  return handleResponse(res, 200, 'User created successfully', { user: userResponse, token });
};

export const handleLoginController = async (req: Request, res: Response) => {
  const user = await findUserByEmail(req?.body?.email);

  if (_.isEmpty(user)) {
    throw new BadRequestError('User with this email does not exist!');
  }

  const tokenData: TokenCreationData = {
    email: user.email,
    role: user.role,
    userId: user._id,
  };

  const isPasswordValid = await checkPasswordValid(req?.body?.password, user.password);
  if (!isPasswordValid) throw new BadRequestError('Incorrect Password!');

  const token = generateAccessToken(tokenData, { expiresIn: '15m' });
  await generateRefreshToken(tokenData, { expiresIn: '7d' }, res);

  const userResponse: Partial<User> = _.cloneDeep(user);
  delete userResponse.password;

  return handleResponse(res, 200, 'User logged in successfully', { user: userResponse, token });
};

export const handleRefreshController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ForbiddenError('Refresh Token missing!');
    }

    const tokenData = verifyRefreshToken(refreshToken);
    const tokenDataFromDB = await findRefreshToken(refreshToken);

    if (_.isEmpty(tokenDataFromDB)) {
      throw new ForbiddenError('Invalid Refresh Token!');
    }

    const user = await findUserById(tokenData.userId);

    if (_.isEmpty(user)) {
      throw new ForbiddenError('Invalid Refresh Token');
    }

    const freshToken = generateAccessToken(
      { userId: user._id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );

    return handleResponse(res, 200, 'New access token generated', { token: freshToken });
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;

    if (error instanceof jwt.TokenExpiredError) {
      throw new ForbiddenError('Refresh token expired!');
    } else {
      throw new InternalServerError();
    }
  }
};
