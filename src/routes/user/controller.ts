import constants from '@/constants';
import {
  ApiError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from '@/middlewares/handleError';
import { User, UserRole } from '@/models/user.model';
import { verifyGoogleToken } from '@/utils/googleOAuthUtils';
import { handleResponse } from '@/utils/handleResponse';
import { checkPasswordValid } from '@/utils/hashing';
import {
  deleteFile,
  generateSignedUrl,
  uploadFile,
  uploadGooglePictureToS3Bucket,
} from '@/utils/s3Utils';
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
import mongoose, { UpdateQuery } from 'mongoose';
import 'multer';
import { nanoid } from 'nanoid';
import { getAuctionByAuctionId } from '../auction/service';
import {
  addBookmark,
  createUser,
  createUserWithoutPassword,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  getAdminHomeData,
  removeBookmark,
  updateUserById,
  updateUserPassword,
} from './service';

export const handleRegisterController = async (req: Request, res: Response) => {
  const file = req?.file as Express.Multer.File;
  const payload = req.body;

  if (payload?.role === UserRole.Admin && payload?.adminCode !== constants.ADMIN_CODE) {
    throw new BadRequestError('Admin code is incorrect!');
  } else {
    delete payload?.adminCode;
  }

  let objectKey = '';
  try {
    let profileImageSignedUrl = '';
    if (file) {
      objectKey = `profile/${Date.now()}-${nanoid()}`;
      await uploadFile(objectKey, file);
      profileImageSignedUrl = await generateSignedUrl(objectKey, 60 * 24 * 7);
    }

    const user = await createUser({ ...payload, profileImage: objectKey });
    const tokenData: TokenCreationData = {
      email: user.email,
      role: user.role,
      userId: user._id,
    };

    const token = generateAccessToken(tokenData, { expiresIn: '15m' });
    await generateRefreshToken(tokenData, { expiresIn: '7d' }, res);

    const userResponse: Partial<User> = _.cloneDeep(user);
    delete userResponse.password;
    return handleResponse(res, 200, 'User created successfully', {
      user: { ...userResponse, profileImage: profileImageSignedUrl },
      token,
    });
  } catch (err) {
    if (objectKey) {
      await deleteFile(objectKey);
    }
    throw err;
  }
};

export const handleLoginController = async (req: Request, res: Response) => {
  const user = await findUserByEmail(req?.body?.email);

  if (_.isEmpty(user)) {
    throw new BadRequestError('User with this email does not exist!');
  }

  //handle logic for when user logs in with google then tries to login with pass , but pass does not exist
  const tokenData: TokenCreationData = {
    email: user.email,
    role: user.role,
    userId: user._id,
  };

  const isPasswordValid = await checkPasswordValid(req?.body?.password, user?.password ?? '');
  if (!isPasswordValid) throw new BadRequestError('Incorrect Password!');

  const token = generateAccessToken(tokenData, { expiresIn: '15m' });
  await generateRefreshToken(tokenData, { expiresIn: '7d' }, res);

  const userResponse: Partial<User> = _.cloneDeep(user);
  delete userResponse.password;

  let profileImageSignedUrl = '';
  if (user?.profileImage) {
    profileImageSignedUrl = await generateSignedUrl(user?.profileImage, 60 * 24 * 7);
  }

  return handleResponse(res, 200, 'User logged in successfully', {
    user: { ...userResponse, profileImage: profileImageSignedUrl },
    token,
  });
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

    //to check if user in refresh token received in client is same as refresh token saved in DB
    if (!user._id.equals(tokenDataFromDB.user as mongoose.Types.ObjectId)) {
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

export const handleGoogleAuth = async (req: Request, res: Response) => {
  const tokenPayload = await verifyGoogleToken(req?.body?.credential ?? '');

  //will be used to generate access and refresh token
  let finalUserData;

  let requiresPasswordCreation = true;
  const existingUser = await findUserByEmail(tokenPayload.email as string);

  if (existingUser) {
    let updateQuery: UpdateQuery<User> = {};

    if (!existingUser?.googleId) {
      //set googleId if missing
      updateQuery = {
        $set: {
          googleId: tokenPayload.sub,
        },
      };
    }

    if (!existingUser?.profileImage && tokenPayload?.picture) {
      //if no profileImage, download google picture if available and set in user
      const uploadedPictureObjectKey = await uploadGooglePictureToS3Bucket(tokenPayload.picture);

      if (uploadedPictureObjectKey) {
        updateQuery = {
          ...updateQuery,
          $set: { ...(updateQuery?.$set ?? {}), profileImage: uploadedPictureObjectKey },
        };
      }
    }

    if (!_.isEmpty(updateQuery)) {
      finalUserData = await updateUserById(existingUser._id, updateQuery);
    } else {
      //when no update is required token will be generated from existing user data
      finalUserData = existingUser;
    }
  } else {
    let profileImage = '';
    if (tokenPayload?.picture) {
      profileImage = await uploadGooglePictureToS3Bucket(tokenPayload.picture);
    }

    finalUserData = await createUserWithoutPassword({
      name: tokenPayload.name ?? '',
      email: tokenPayload.email ?? '',
      role: UserRole.Customer,
      profileImage,
      googleId: tokenPayload.sub,
    });
  }

  //generate access and refresh token from finalUserData

  const tokenData: TokenCreationData = {
    email: finalUserData?.email as string,
    role: finalUserData?.role as UserRole,
    userId: finalUserData?._id as mongoose.Types.ObjectId,
  };

  const token = generateAccessToken(tokenData, { expiresIn: '15m' });
  await generateRefreshToken(tokenData, { expiresIn: '7d' }, res);

  let profileImageSignedUrl;
  if (finalUserData?.profileImage) {
    profileImageSignedUrl = await generateSignedUrl(finalUserData.profileImage);
  }

  const userResponse: Partial<User> = _.cloneDeep(finalUserData ?? {});
  if (userResponse?.password) {
    requiresPasswordCreation = false;
    delete userResponse.password;
  }
  return handleResponse(res, 200, 'User created successfully', {
    user: { ...userResponse, profileImage: profileImageSignedUrl, requiresPasswordCreation },
    token,
  });
};

export const handleCreatePassword = async (req: RequestWithUser, res: Response) => {
  const updatedUser = await updateUserPassword(
    (req.user?._id ?? '') as string,
    req?.body?.password,
  );

  if (!updatedUser) {
    throw new BadRequestError('User with this email does not exist!');
  }
  return handleResponse(res, 200, 'Password created successfully', {});
};

export const handleGetAdminHomeData = async (req: RequestWithUser, res: Response) => {
  const data = await getAdminHomeData();
  return handleResponse(res, 200, '', { data });
};
