import { BadRequestError } from '@/middlewares/handleError';
import { RefreshToken, RefreshTokenModel } from '@/models/refreshToken.model';
import { User, UserModel } from '@/models/user.model';
import { generateHash } from '@/utils/hashing';
import { DecodedTokenData } from '@/utils/token';
import _ from 'lodash';
import mongoose, { UpdateQuery } from 'mongoose';

export const createUser = async (payload: User): Promise<User> => {
  const existingUser = await UserModel.find({ email: payload.email }).lean();

  if (!_.isEmpty(existingUser)) {
    throw new BadRequestError('User with this email already exists!');
  }
  const hash = await generateHash(payload?.password ?? '');
  return (await UserModel.create({ ...payload, password: hash })).toObject();
};

export const saveRefreshToken = async (refreshToken: string, tokenData: DecodedTokenData) => {
  return RefreshTokenModel.create({
    token: refreshToken,
    user: tokenData.userId,
    //seconds to milliseconds | JS expects milliseconds
    exp: tokenData?.exp ? new Date(tokenData?.exp * 1000) : new Date(),
    iat: tokenData?.iat ? new Date(tokenData?.iat * 1000) : new Date(),
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return UserModel.findOne({ email }).lean();
};
export const findUserById = async (userId: mongoose.Types.ObjectId): Promise<User | null> => {
  return UserModel.findOne({ _id: userId }).lean();
};

export const findRefreshToken = async (token: string): Promise<RefreshToken | null> => {
  return RefreshTokenModel.findOne({ token }).lean();
};

export const addBookmark = (auction: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) => {
  return UserModel.findByIdAndUpdate(
    user,
    {
      $addToSet: {
        favoriteAuctions: auction,
      },
    },
    {
      returnDocument: 'after',
    },
  );
};

export const removeBookmark = (auction: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) => {
  return UserModel.findByIdAndUpdate(
    user,
    {
      $pull: {
        favoriteAuctions: auction,
      },
    },
    {
      returnDocument: 'after',
    },
  );
};

export const updateUserById = (
  userObjectId: mongoose.Types.ObjectId,
  update: UpdateQuery<User>,
) => {
  return UserModel.findByIdAndUpdate(userObjectId, update, { returnDocument: 'after', lean: true });
};

export const createUserWithoutPassword = async (payload: Omit<User, '_id'>) => {
  return (await UserModel.create(payload)).toObject();
};

export const updateUserPassword = async (userObjectId: string, password: string) => {
  const hash = await generateHash(password);

  return UserModel.findByIdAndUpdate(
    userObjectId,
    {
      $set: {
        password: hash,
      },
    },
    {
      returnDocument: 'after',
      lean: true,
    },
  );
};
