import { BadRequestError } from '@/middlewares/handleError';
import { handleResponse } from '@/utils/handleResponse';
import { generateSignedUrl, uploadFile } from '@/utils/s3Utils';
import { Request, Response } from 'express';
import 'multer';
import { nanoid } from 'nanoid';

export const handleUpload = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files?.length) {
    throw new BadRequestError('Files missing!');
  }

  const type: 'profile' | 'products' = req.body?.type;
  const objectKeys: string[] = [];

  await Promise.all(
    files.map(file => {
      const objectKey = `${type}/${Date.now()}-${nanoid()}`;
      objectKeys.push(objectKey);

      return uploadFile(objectKey, file);
    }),
  );

  return handleResponse(res, 200, '', {
    data: objectKeys,
  });
};

export const handleGetSignedUrls = async (req: Request, res: Response) => {
  const objectKeyArr: string[] = req.body?.objectKeys;

  const signedUrls = await Promise.all(
    objectKeyArr.map(objectKey => {
      return generateSignedUrl(objectKey);
    }),
  );

  return handleResponse(res, 200, '', {
    data: signedUrls,
  });
};
