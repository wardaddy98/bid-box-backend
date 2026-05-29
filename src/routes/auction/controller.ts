import { BadRequestError } from '@/middlewares/handleError';
import { AuctionStatusEnum } from '@/models/auction.model';
import { GetAllQuery } from '@/types/common';
import { handleResponse } from '@/utils/handleResponse';
import { generateSignedUrl } from '@/utils/s3Utils';
import { Request, Response } from 'express';
import _ from 'lodash';
import { getProductById } from '../product/service';
import { createAuction, editAuction, getAllAuctions, getSingleAuctionData } from './service';

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

  const productImages = await Promise.all(
    (product?.productImages ?? []).map(async objectKey => {
      return {
        objectKey,
        signedUrl: await generateSignedUrl(objectKey),
      };
    }),
  );

  if (_.isEmpty(product)) {
    throw new BadRequestError('Product does not exist!');
  }

  const auction = await createAuction(payload);

  return handleResponse(res, 200, 'Auction listed successfully!', {
    data: { ...auction.toObject(), product: { ...product, productImages } },
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
