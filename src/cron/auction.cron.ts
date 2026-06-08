import { AuctionModel, AuctionStatusEnum } from '@/models/auction.model';
import { ProductModel } from '@/models/product.model';
import { expireAuctionTransaction, IAuctionWithProduct } from '@/routes/auction/service';
import { AuctionSocketEvents } from '@/socket/listeners/auction.listeners';
import { getIO } from '@/socket/socket';
import { generateSignedUrl } from '@/utils/s3Utils';
import mongoose from 'mongoose';
import cron from 'node-cron';

export const initializeAuctionCron = () => {
  //to check if any auction has become live every 15 min
  cron.schedule('*/15 * * * *', async () => {
    const now = new Date();

    const liveAuctions = await AuctionModel.find({
      status: AuctionStatusEnum.Pending,
      liveOn: {
        $lte: now,
      },
    });

    if (!liveAuctions.length) return;

    await AuctionModel.updateMany(
      {
        _id: {
          $in: liveAuctions?.map(e => e._id),
        },
      },
      {
        $set: {
          status: AuctionStatusEnum.Live,
        },
      },
    );

    const io = getIO();
    if (io) {
      const data = await AuctionModel.aggregate([
        {
          $match: {
            status: AuctionStatusEnum.Live,
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
          $sort: {
            createdAt: -1,
          },
        },
      ]).exec();

      const auctions = await Promise.all(
        (data ?? []).map(async (auction: IAuctionWithProduct) => {
          const productImages = await Promise.all(
            auction.product.productImages.map(async (objectKey: string) => {
              return {
                objectKey,
                signedUrl: await generateSignedUrl(objectKey),
              };
            }),
          );

          return { ...auction, product: { ...auction.product, productImages } };
        }),
      );

      io.emit(AuctionSocketEvents.UPDATE_LIVE_AUCTIONS, { data: auctions });
    }
  });

  // to check if any live event has reached expiredAt every 1 sec
  cron.schedule('* * * * * *', async () => {
    const io = getIO();
    if (!io) return;

    const expiredAuctions = await expireAuctionTransaction();

    if (!expiredAuctions?.length) return;

    io.emit(AuctionSocketEvents.UPDATE_EXPIRED_AUCTIONS, {
      data: expiredAuctions,
    });
  });

  //to check if any live auction has been in active for more than 10 minutes and to cancel it
  cron.schedule('*/10 * * * *', async () => {
    const io = getIO();
    if (!io) return;

    //status live and expiresAt null means no bid has been placed, since place bid sets expiresAt
    const cancelledAuctions = await AuctionModel.find({
      status: AuctionStatusEnum.Live,
      expiresAt: null,
      $expr: {
        $gt: [
          new Date(),
          {
            $dateAdd: {
              startDate: '$liveOn',
              unit: 'minute',
              amount: 10,
            },
          },
        ],
      },
    });

    if (!cancelledAuctions.length) return;

    await AuctionModel.updateMany(
      {
        _id: {
          $in: cancelledAuctions?.map(e => e._id),
        },
      },
      {
        $set: {
          status: AuctionStatusEnum.Cancelled,
        },
      },
    );

    // increment stock by 1 for product if auction is cancelled
    await ProductModel.updateMany(
      {
        _id: {
          $in: cancelledAuctions.map(e => e.product as mongoose.Types.ObjectId),
        },
      },
      {
        $inc: {
          availableStock: 1,
        },
      },
    );

    io.emit(AuctionSocketEvents.UPDATE_CANCELLED_AUCTIONS, {
      data: cancelledAuctions,
    });
  });
};
