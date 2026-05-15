import constants from '@/constants';
import { User, UserRole } from '@/models/user.model';
import { saveRefreshToken } from '@/routes/user/service';
import { Request, Response } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
const { JWT_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY, NODE_ENV } = constants;

export interface RequestWithUser extends Request {
  user?: User;
}

export interface TokenCreationData {
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  email: string;
}

export interface DecodedTokenData extends TokenCreationData, JwtPayload {}

export const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET_KEY) as DecodedTokenData;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_TOKEN_SECRET_KEY) as DecodedTokenData;

export const generateAccessToken = (
  payload: TokenCreationData,
  options: SignOptions = {},
): string => jwt.sign(payload, JWT_SECRET_KEY, options);

export const generateRefreshToken = async (
  payload: TokenCreationData,
  options: SignOptions = {},
  res: Response,
): Promise<void> => {
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET_KEY, options);

  const tokenData = verifyRefreshToken(refreshToken);

  //save to db
  await saveRefreshToken(refreshToken, tokenData);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 604800000, //7 days
  });
};
