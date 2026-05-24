import { handleResponse } from '@/utils/handleResponse';
import { RequestWithUser } from '@/utils/token';
import { Response } from 'express';
import mongoose from 'mongoose';
import { createBidTransaction } from './service';

interface IPlaceBidPayload {
  amount: number;
  auctionId: string;
}

interface IPlaceBidReq extends RequestWithUser {
  body: IPlaceBidPayload;
}

export interface ICreateBidData {
  user: mongoose.Types.ObjectId;
  auction: mongoose.Types.ObjectId;
  amount: number;
}

export const handlePlaceBid = async (req: IPlaceBidReq, res: Response) => {
  const { amount, auctionId } = req.body;

  const bidAmount = Number(amount || 0);

  const { bid, updatedUser, updatedAuction } = await createBidTransaction(
    bidAmount,
    req?.user?._id as mongoose.Types.ObjectId,
    auctionId,
  );

  //bid and expiresAt should be emitted to all users

  return handleResponse(res, 200, 'Bid placed', {
    data: {
      ...(bid ?? {}),
      user: {
        email: updatedUser?.email,
        name: updatedUser?.name,
        profileImage: updatedUser?.profileImage,
        bidsBalance: updatedUser?.bidsBalance,
      },
    },
  });
};

// const allBidsByUser = await BidModel.find({ auction: auction._id, user: req?.user?._id })
//   .sort({ createdAt: 1 })
//   .lean();

// const totalBidsUsedByUser = allBidsByUser.reduce((acc, currentBid, idx) => {
//   if (idx === 0) {
//     return acc + Number(currentBid?.amount || 0);
//   } else {
//     return acc + Number(currentBid?.amount || 0) - Number(allBidsByUser?.[idx-1]?.amount || 0);
//   }
// }, 0);
