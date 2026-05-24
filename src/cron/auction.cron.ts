import { AuctionModel, AuctionStatusEnum } from '@/models/auction.model';
import cron from 'node-cron';

export const initializeAuctionStatusCron = () => {
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
  });

  //if successfull emit all live auctions to all subscribers
};
