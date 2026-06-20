import constants from '@/constants';
import logger from '@/utils/logger';
import { instrument } from '@socket.io/admin-ui';
import { Server as HttpServerType } from 'http';
import { Server } from 'socket.io';
import auctionListeners from './listeners/auction.listeners';

let io: Server;

export const initializeSocketInstance = (server: HttpServerType) => {
  //socket instance only attaches to http server and not express server
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:8080',
        'https://admin.socket.io',
        'https://bidbox.suddathgautam.in',
      ],
      credentials: true,
    },
  });

  instrument(io, {
    auth: constants.isProduction
      ? {
          type: 'basic',
          username: 'suddath98',
          //hashed password
          password: constants.SOCKET_ADMIN_PASSWORD,
        }
      : false,
  });

  io.on('connection', socket => {
    logger.info(`Socket connection live with id ${socket.id}`);
    auctionListeners(socket);
    socket.on('disconnect', () => {
      logger.info(`Socket connection destroyed with id ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (io) return io;
};
