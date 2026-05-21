import { BadRequestError } from '@/middlewares/handleError';
import { GetAllQuery } from '@/types/common';
import { handleResponse } from '@/utils/handleResponse';
import { Request, Response } from 'express';
import _ from 'lodash';
import { getProductById } from '../product/service';
import { createAuction, editAuction, getAllAuctions } from './service';

export const handleGetAllAuctions = async (req: Request, res: Response) => {
  const queryStrings: GetAllQuery = req.query;

  const paginatedResponse = await getAllAuctions(
    Number(queryStrings?.page || 1),
    Number(queryStrings?.limit || 10),
    queryStrings.category || '',
    queryStrings.search || '',
  );

  return handleResponse(res, 200, '', paginatedResponse);
};

export const handleCreateAuction = async (req: Request, res: Response) => {
  const payload = req.body;

  const product = await getProductById(req.body?.product);

  if (_.isEmpty(product)) {
    throw new BadRequestError('Product does not exist!');
  }

  const auction = await createAuction(payload);

  return handleResponse(res, 200, 'Auction listed successfully!', {
    data: { ...auction.toObject(), product },
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
