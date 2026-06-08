import { BadRequestError } from '@/middlewares/handleError';
import { AuctionStatusEnum } from '@/models/auction.model';
import { GetAllQuery } from '@/types/common';
import { handleResponse } from '@/utils/handleResponse';
import { Request, Response } from 'express';
import _ from 'lodash';
import { getProductById } from '../product/service';
import {
  createAuctionTransaction,
  editAuction,
  getAllAuctions,
  getSingleAuctionData,
} from './service';

interface IGetAllAuctionsQuery extends GetAllQuery {
  status?: AuctionStatusEnum;
}

export const handleGetAllAuctions = async (req: Request, res: Response) => {
  const queryStrings: IGetAllAuctionsQuery = req.query;
  const paginatedResponse = await getAllAuctions(
    Number(queryStrings?.page || 1),
    Number(queryStrings?.limit || 10),
    queryStrings?.category || '',
    queryStrings?.search || '',
    queryStrings?.status || '',
  );

  return handleResponse(res, 200, '', paginatedResponse);
};

export const handleCreateAuction = async (req: Request, res: Response) => {
  const payload = req.body;

  const product = await getProductById(req.body?.product).lean();

  if (_.isEmpty(product)) {
    throw new BadRequestError('Product does not exist!');
  }

  if (product.availableStock <= 0) {
    throw new BadRequestError('Product stock does not exist!');
  }

  const data = await createAuctionTransaction(payload, req.body?.product);

  return handleResponse(res, 200, 'Auction listed successfully!', {
    data,
  });
};

export const handleEditAuction = async (req: Request, res: Response) => {
  const payload = req.body;
  const auctionId = req.params?.auctionId as string;

  if (!auctionId) {
    throw new BadRequestError('Auction id missing!');
  }

  const auction = await editAuction(auctionId, payload);

  return handleResponse(res, 200, 'Auction edited successfully!', {
    data: auction,
  });
};

export const handleGetSingleAuction = async (req: Request, res: Response) => {
  const auctionId = req.params?.auctionId as string;

  if (!auctionId) {
    throw new BadRequestError('Auction id missing!');
  }

  const auction = await getSingleAuctionData(auctionId);

  return handleResponse(res, 200, '', {
    data: auction,
  });
};
