import { AuctionSocketEvents } from '@/socket/listeners/auction.listeners';
import { getIO } from '@/socket/socket';
import { handleResponse } from '@/utils/handleResponse';
import { generateSignedUrl } from '@/utils/s3Utils';
import { RequestWithUser } from '@/utils/token';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createBidPack, createBidTransaction, getBidPacks } from './service';

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
  const bidAmount = Number(req?.body?.amount || 0);
  const auctionId = req?.body?.auctionId || '';

  const { bid, updatedUser, updatedAuction } = await createBidTransaction(
    bidAmount,
    req?.user?._id as mongoose.Types.ObjectId,
    auctionId,
  );

  const bidderUserData = {
    _id: updatedUser?._id,
    email: updatedUser?.email,
    name: updatedUser?.name,
    profileImage: updatedUser?.profileImage
      ? await generateSignedUrl(updatedUser?.profileImage)
      : '',
  };

  //new bid and updated expiresAt and bidder user is emitted to all users in the room of current auction
  const io = getIO();
  if (io) {
    io.to(auctionId).emit(AuctionSocketEvents.BID_PLACED, {
      data: {
        bid,
        user: bidderUserData,
        auctionExpiresAt: updatedAuction?.expiresAt,
      },
    });
  }

  return handleResponse(res, 200, 'Bid placed', {
    data: {
      ...(bid ?? {}),
      user: {
        ...bidderUserData,
        bidsBalance: updatedUser?.bidsBalance,
      },
    },
  });
};

export const handleCreateBidPack = async (req: Request, res: Response) => {
  const bidPack = await createBidPack(req.body);

  return handleResponse(res, 200, 'Bid pack created', {
    data: bidPack,
  });
};

export const handleGetBidPacks = async (req: Request, res: Response) => {
  const bidPacks = await getBidPacks();

  return handleResponse(res, 200, '', {
    data: bidPacks,
  });
};
