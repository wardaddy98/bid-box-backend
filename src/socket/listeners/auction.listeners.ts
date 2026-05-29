import { Socket } from 'socket.io';

export enum AuctionSocketEvents {
  JOIN_AUCTION = 'join-auction',
  LEAVE_AUCTION = 'leave-auction',
  UPDATE_LIVE_AUCTIONS = 'update-live-auctions',
  UPDATE_EXPIRED_AUCTIONS = 'update-expired-auctions',
  UPDATE_CANCELLED_AUCTIONS = 'update-cancelled-auctions',
  BID_PLACED = 'bid-placed',
}

const auctionListeners = (socket: Socket) => {
  socket.on(AuctionSocketEvents.JOIN_AUCTION, auctionId => {
    socket.join(auctionId);
  });

  socket.on(AuctionSocketEvents.LEAVE_AUCTION, auctionId => {
    socket.leave(auctionId);
  });
};

export default auctionListeners;
