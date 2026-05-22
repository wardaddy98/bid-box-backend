import constants from '@/constants';
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from '@/middlewares/handleError';
import { User, UserRole } from '@/models/user.model';
import { handleResponse } from '@/utils/handleResponse';
import { checkPasswordValid } from '@/utils/hashing';
import {
  generateAccessToken,
  generateRefreshToken,
  RequestWithUser,
  TokenCreationData,
  verifyRefreshToken,
} from '@/utils/token';
import { Request, Response } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import _ from 'lodash';
import mongoose from 'mongoose';
import { getAuctionByAuctionId } from '../auction/service';
import {
  addBookmark,
  createUser,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  removeBookmark,
} from './service';

export const handleRegisterController = async (req: Request, res: Response) => {
  const payload = req.body;
  if (payload?.role === UserRole.Admin && payload?.adminCode !== constants.ADMIN_CODE) {
    throw new BadRequestError('Admin code is incorrect!');
  } else {
    delete payload?.adminCode;
  }

  const user = await createUser(payload);
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
    }

    if (error instanceof JsonWebTokenError) {
      throw new ForbiddenError('Invalid Refresh Token!');
    }

    throw new InternalServerError();
  }
};

export const handleAddBookmark = async (req: RequestWithUser, res: Response) => {
  const auctionId = req?.body?.auctionId;

  const auction = await getAuctionByAuctionId(auctionId);

  if (_.isEmpty(auction)) {
    throw new BadRequestError('Auction does not exist!');
  }

  const user = await addBookmark(auction._id, req?.user?._id as mongoose.Types.ObjectId);
  return handleResponse(res, 200, 'Auction added to favorite', {
    data: user,
    user,
    choot: req?.user?._id,
  });
};

export const handleRemoveBookmark = async (req: RequestWithUser, res: Response) => {
  const auctionId = req?.body?.auctionId;

  const auction = await getAuctionByAuctionId(auctionId);

  if (_.isEmpty(auction)) {
    throw new BadRequestError('Auction does not exist!');
  }

  const user = await removeBookmark(auction._id, req?.user?._id as mongoose.Types.ObjectId);
  return handleResponse(res, 200, 'Auction removed from favorite', { data: user });
};
