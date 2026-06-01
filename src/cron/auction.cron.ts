import { AuctionModel, AuctionStatusEnum } from '@/models/auction.model';
import { AuctionSocketEvents } from '@/socket/listeners/auction.listeners';
import { getIO } from '@/socket/socket';
import cron from 'node-cron';

export const initializeAuctionCron = () => {
  //to check if any auction has become live every 15 min
  cron.schedule('*/15 * * * *', async () => {
    const now = new Date();
    await AuctionModel.updateMany(
      {
        status: AuctionStatusEnum.Pending,
        liveOn: {
          $lte: now,
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

      io.emit(AuctionSocketEvents.UPDATE_LIVE_AUCTIONS, { data });
    }
  });

  // to check if any live event has reached expiredAt every 1 sec
  cron.schedule('* * * * * *', async () => {
    const io = getIO();
    if (!io) return;

    const expiredAuctions = await AuctionModel.find({
      status: AuctionStatusEnum.Live,
      expiresAt: {
        $ne: null,
        $lte: new Date(),
      },
    }).lean();

    if (!expiredAuctions?.length) return;

    await AuctionModel.updateMany(
      {
        _id: {
          $in: expiredAuctions?.map(e => e._id),
        },
      },
      {
        $set: {
          expiresAt: null,
          status: AuctionStatusEnum.Completed,
        },
      },
    );

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

    io.emit(AuctionSocketEvents.UPDATE_CANCELLED_AUCTIONS, {
      data: cancelledAuctions,
    });
  });
};
