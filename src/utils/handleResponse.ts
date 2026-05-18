import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface ResponseObject<T> {
  status: StatusCodes;
  message: string;
  body?: T;
}

export const handleResponse = <T>(
  res: Response,
  statusCode: StatusCodes,
  customMessage?: string,
  body?: T,
): Response => {
  const responseObject: ResponseObject<T> = {
    status: statusCode,
    message: customMessage || '',
    ...(body !== undefined && {
      body,
    }),
  };

  return res.status(statusCode).json(responseObject);
};
