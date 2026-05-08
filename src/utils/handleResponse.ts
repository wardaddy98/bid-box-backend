import { Response } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

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
    message: customMessage || getReasonPhrase(statusCode),
    ...(body !== undefined && {
      body,
    }),
  };

  return res.status(statusCode).json(responseObject);
};
