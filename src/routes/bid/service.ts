import { BadRequestError } from '@/middlewares/handleError';
import { AuctionModel, AuctionStatusEnum } from '@/models/auction.model';
import { BidModel } from '@/models/bid.model';
import { BidPack, BidPackModel } from '@/models/bidPacks.model';
import { UserModel } from '@/models/user.model';
import handleTransaction from '@/utils/handleTransaction';
import mongoose, { ClientSession } from 'mongoose';
import { updateAuction } from '../auction/service';
import { ICreateBidData } from './controller';

export const createBid = async (data: ICreateBidData) => {
  const bid = await BidModel.create(data);
  return bid.toObject();
};

export const getHighestBid = (auction: mongoose.Types.ObjectId, session: ClientSession) => {
  return BidModel.findOne({ auction }).session(session).sort({ amount: -1 }).lean();
};

export const getPreviousBidByUser = (
  auction: mongoose.Types.ObjectId,
  user: mongoose.Types.ObjectId,
  session: ClientSession,
) => {
  return BidModel.findOne({ auction, user }).session(session).sort({ amount: -1 }).lean();
};

export const createBidTransaction = (
  bidAmount: number,
  userObjectId: mongoose.Types.ObjectId,
  auctionId: string,
) => {
  //   create bid
  //   update user model- deduct bidsUsedInThisRequest from user model - bidsBalance and update bidsBalance
  //   update auction model- expiresAt - current time +60 seconds and winningBid - currentBid from this transaction

  const result = handleTransaction(async session => {
    const auction = await AuctionModel.findOne({ auctionId }).session(session).lean();

    if (!auction) {
      throw new BadRequestError('Auction does not exist!');
    }

    if (auction.status !== AuctionStatusEnum.Live) {
      throw new BadRequestError('Auction is not live!');
    }
    const highestBid = await getHighestBid(auction._id, session);

    if (bidAmount <= Number(highestBid?.amount || 0)) {
      throw new BadRequestError('Bid amount should be greater than last highest bid');
    }

    const now = new Date();

    //only place bid api sets expiresAt
    if (highestBid) {
      //first bid has already been placed
      if (auction?.expiresAt && now >= new Date(auction.expiresAt))
        throw new BadRequestError('Auction has been completed!');
    } else {
      //first bid has not been placed yet
      if (now > new Date(new Date(auction.liveOn).getTime() + 60 * 1000 * 10)) {
        await updateAuction(
          { _id: auction._id },
          { $set: { status: AuctionStatusEnum.Cancelled } },
        );
        throw new BadRequestError('Auction has been cancelled due to no activity for 10 mins!');
      }
    }

    const user = await UserModel.findOne({ _id: userObjectId }).session(session).lean();
    const userBidBalance = Number(user?.bidsBalance || 0);

    const previousBidByUser = await getPreviousBidByUser(auction._id, userObjectId, session);

    //if user has placed a bid before base bid amount should be deducted from the highest bid
    const bidsUsedInThisRequest = previousBidByUser
      ? bidAmount - Number(highestBid?.amount || 0)
      : bidAmount;

    if (userBidBalance < bidsUsedInThisRequest) {
      throw new BadRequestError('Insufficient Bid Wallet balance!');
    }

    const [bid] = await BidModel.create(
      [
        {
          amount: bidAmount,
          auction: auction._id,
          user: userObjectId,
        },
      ],
      { session },
    );

    const updatedUser = await UserModel.findByIdAndUpdate(
      userObjectId,
      {
        $inc: {
          bidsBalance: -bidsUsedInThisRequest,
        },
      },
      { session, returnDocument: 'after', lean: true },
    );

    const updatedAuction = await AuctionModel.findByIdAndUpdate(
      auction._id,
      {
        $set: {
          expiresAt: new Date(Date.now() + 60 * 1000),
          winningBid: bid._id,
        },
      },
      {
        session,
        returnDocument: 'after',
        lean: true,
      },
    );

    return {
      bid: bid.toObject(),
      updatedUser,
      updatedAuction,
    };
  });
  return result;
};

export const createBidPack = async (payload: BidPack) => {
  return (await BidPackModel.create(payload)).toObject();
};

export const getBidPacks = async () => {
  return BidPackModel.find({}).lean();
};

export const getBidPackById = async (_id: string) => {
  return BidPackModel.findOne({ _id }).lean();
};
