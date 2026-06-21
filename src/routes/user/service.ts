import { BadRequestError } from '@/middlewares/handleError';
import { AuctionModel, AuctionStatusEnum } from '@/models/auction.model';
import { BidModel } from '@/models/bid.model';
import { OrderModel, OrderPaymentStatusEnum } from '@/models/order.model';
import { RefreshToken, RefreshTokenModel } from '@/models/refreshToken.model';
import { User, UserModel, UserRole } from '@/models/user.model';
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
export const getAdminHomeData = async () => {
  const orderDetails =
    (
      await OrderModel.aggregate([
        {
          $facet: {
            failedOrders: [
              {
                $match: {
                  paymentStatus: OrderPaymentStatusEnum.Failed,
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                },
              },
            ],

            totalRevenue: [
              {
                $match: {
                  paymentStatus: OrderPaymentStatusEnum.Success,
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: '$amount',
                  },
                  ordersCompleted: {
                    $sum: 1,
                  },
                },
              },
            ],
            todayRevenue: [
              {
                $match: {
                  paymentStatus: OrderPaymentStatusEnum.Success,
                  createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999)),
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: '$amount',
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            totalRevenue: {
              $ifNull: [
                {
                  $arrayElemAt: ['$totalRevenue.total', 0],
                },
                0,
              ],
            },
            todayRevenue: {
              $ifNull: [
                {
                  $arrayElemAt: ['$todayRevenue.total', 0],
                },

                0,
              ],
            },

            ordersCompleted: {
              $ifNull: [
                {
                  $arrayElemAt: ['$totalRevenue.ordersCompleted', 0],
                },

                0,
              ],
            },
            failedOrders: {
              $ifNull: [
                {
                  $arrayElemAt: ['$failedOrders.total', 0],
                },

                0,
              ],
            },
          },
        },
      ]).exec()
    )?.[0] ?? {};

  const auctionDetails =
    (
      await AuctionModel.aggregate([
        {
          $facet: {
            live: [
              {
                $match: {
                  status: AuctionStatusEnum.Live,
                },
              },

              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                },
              },
            ],

            upcoming: [
              {
                $match: {
                  status: AuctionStatusEnum.Pending,
                },
              },

              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                },
              },
            ],

            cancelled: [
              {
                $match: {
                  status: AuctionStatusEnum.Cancelled,
                },
              },

              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                },
              },
            ],

            completed: [
              {
                $match: {
                  status: AuctionStatusEnum.Completed,
                },
              },

              {
                $group: {
                  _id: null,
                  total: {
                    $sum: 1,
                  },
                },
              },
            ],
          },
        },

        {
          $project: {
            liveAuctions: {
              $ifNull: [{ $arrayElemAt: ['$live.total', 0] }, 0],
            },
            upcomingAuctions: {
              $ifNull: [
                {
                  $arrayElemAt: ['$upcoming.total', 0],
                },
                0,
              ],
            },

            cancelledAuctions: {
              $ifNull: [
                {
                  $arrayElemAt: ['$cancelled.total', 0],
                },
                0,
              ],
            },

            completedAuctions: {
              $ifNull: [
                {
                  $arrayElemAt: ['$completed.total', 0],
                },
                0,
              ],
            },
          },
        },
      ]).exec()
    )?.[0] ?? {};

  const bidsDetails =
    (
      await BidModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            bidsPlacedToday: '$total',
          },
        },
      ]).exec()
    )?.[0] ?? {};

  const userDetails =
    (
      await UserModel.aggregate([
        {
          $match: {
            role: UserRole.Customer,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            totalCustomers: '$total',
          },
        },
      ]).exec()
    )?.[0] ?? {};

  return { ...orderDetails, ...auctionDetails, ...bidsDetails, ...userDetails };
};
