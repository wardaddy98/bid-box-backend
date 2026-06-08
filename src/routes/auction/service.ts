import { BadRequestError } from '@/middlewares/handleError';
import { Auction, AuctionModel } from '@/models/auction.model';
import { Bid } from '@/models/bid.model';
import { Product, ProductCategoryEnum, ProductModel } from '@/models/product.model';
import { User } from '@/models/user.model';
import { IPagination } from '@/utils/handlePagination';
import handleTransaction from '@/utils/handleTransaction';
import { generateSignedUrl } from '@/utils/s3Utils';
import stringToObjectId from '@/utils/stringToObjectId';
import mongoose, { QueryFilter, UpdateQuery } from 'mongoose';

interface ICreateAuctionPayload {
  product: mongoose.Types.ObjectId;
  liveOn: Date;
  startingBid: number;
}

interface IGetAllAuctionsServiceResponse {
  data: Auction[];
  pagination: IPagination;
}

export interface IAuctionWithProduct extends Omit<Auction, 'product'> {
  product: Product;
}

interface IBidWithUser extends Omit<Bid, 'user'> {
  user: User;
}
interface IAuctionWithProductAndBids extends IAuctionWithProduct {
  bids: IBidWithUser[];
}

export const getAllAuctions = async (
  page: number,
  limit: number,
  category: string,
  search: string,
  status: string,
): Promise<IGetAllAuctionsServiceResponse> => {
  const skip = (page - 1) * limit;
  const output = await AuctionModel.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $unwind: {
        path: '$product',
      },
    },

    {
      $match: {
        ...(status ? { status } : {}),
        ...(category && Object.values(ProductCategoryEnum).includes(category as ProductCategoryEnum)
          ? { 'product.category': category }
          : {}),

        ...(search
          ? {
              $or: [
                {
                  auctionId: {
                    $regex: search,
                    $options: 'i',
                  },
                },
                {
                  'product.title': {
                    $regex: search,
                    $options: 'i',
                  },
                },
                {
                  'product.productId': {
                    $regex: search,
                    $options: 'i',
                  },
                },
              ],
            }
          : {}),
      },
    },
    {
      $lookup: {
        from: 'bids',
        localField: 'winningBid',
        foreignField: '_id',
        as: 'winningBid',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
            },
          },
          {
            $project: {
              'user.password': 0,
              'user.role': 0,
              'user.bidsBalance': 0,
              'user.createdAt': 0,
              'user.updatedAt': 0,
              'user.favoriteProducts': 0,
              'user.googleId': 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$winningBid',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
        countPipeline: [
          {
            $count: 'count',
          },
        ],
      },
    },

    {
      $addFields: {
        totalCount: {
          $ifNull: [
            {
              $arrayElemAt: ['$countPipeline.count', 0],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        data: 1,
        pagination: {
          totalCount: '$totalCount',
          currentPage: {
            $literal: page,
          },
          totalPages: {
            $ceil: {
              $divide: ['$totalCount', limit],
            },
          },
        },
      },
    },
  ]).exec();

  const auctions = await Promise.all(
    (output[0]?.data ?? []).map(async (auction: IAuctionWithProduct) => {
      const productImages = await Promise.all(
        auction.product.productImages.map(async objectKey => {
          return {
            objectKey,
            signedUrl: await generateSignedUrl(objectKey),
          };
        }),
      );

      return { ...auction, product: { ...auction.product, productImages } };
    }),
  );

  return {
    data: auctions,
    pagination: output[0]?.pagination,
  };
};

export const createAuction = (payload: ICreateAuctionPayload) => {
  return AuctionModel.create(payload);
};

export const editAuction = async (auctionId: string, payload: Record<string, unknown>) => {
  const updated = await AuctionModel.findOneAndUpdate(
    { auctionId },
    { startingBid: payload?.startingBid },
    {
      returnDocument: 'after',
    },
  );
  if (!updated) {
    throw new BadRequestError('Auction not found!');
  }
  return updated;
};

export const getAuctionById = (id: string) => {
  return AuctionModel.findById(stringToObjectId(id));
};

export const getAuctionByAuctionId = (auctionId: string) => {
  return AuctionModel.findOne({ auctionId }).lean();
};

export const getSingleAuctionData = async (auctionId: string) => {
  const data = await AuctionModel.aggregate([
    {
      $match: {
        auctionId,
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },

    {
      $unwind: {
        path: '$product',
      },
    },
    {
      $lookup: {
        from: 'bids',
        localField: 'winningBid',
        foreignField: '_id',
        as: 'winningBid',
      },
    },
    {
      $unwind: {
        path: '$winningBid',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'bids',
        localField: '_id',
        foreignField: 'auction',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: '$user',
          },

          {
            $project: {
              'user.password': 0,
              'user.bidsBalance': 0,
              'user.favoriteAuctions': 0,
              'user.role': 0,
              'user.googleId': 0,
              'user.createdAt': 0,
              'user.updatedAt': 0,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],

        as: 'bids',
      },
    },
  ]).exec();

  const auction: IAuctionWithProductAndBids = data?.[0] ?? {};
  const productImages = await Promise.all(
    (auction?.product?.productImages ?? []).map(async (objectKey: string) => {
      return {
        objectKey,
        signedUrl: await generateSignedUrl(objectKey),
      };
    }),
  );

  const bids = await Promise.all(
    (auction?.bids ?? []).map(async bid => {
      if (bid?.user?.profileImage) {
        bid.user.profileImage = await generateSignedUrl(bid.user.profileImage);
      }
      return bid;
    }),
  );

  auction.bids = bids;

  return {
    ...auction,
    product: {
      ...(auction.product ?? {}),
      productImages,
    },
  };
};

export const updateAuction = (find: QueryFilter<Auction>, update: UpdateQuery<Auction>) => {
  return AuctionModel.updateOne(find, update);
};

export const createAuctionTransaction = async (
  payload: ICreateAuctionPayload,
  productObjectId: string,
) => {
  return handleTransaction(async session => {
    const [auction] = await AuctionModel.create([payload], { session });

    const product = await ProductModel.findByIdAndUpdate(
      productObjectId,
      {
        $inc: {
          availableStock: -1,
        },
      },
      {
        session,
        returnDocument: 'after',
        lean: true,
      },
    );

    return {
      auction: auction.toObject(),
      product,
    };
  });
};
