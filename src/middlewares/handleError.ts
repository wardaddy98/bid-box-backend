import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handleResponse } from '../utils/handleResponse';
import logger from '../utils/logger';

class ApiError extends Error {
  statusCode: StatusCodes;

  constructor(message: string, statusCode: StatusCodes) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class UnAuthorizedError extends ApiError {
  constructor(message: string) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string) {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export function handleError(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ApiError) {
    handleResponse(res, error.statusCode, error.message);
  } else {
    logger.error('Internal Server Error', error);
    handleResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'AN Unexpected error has occurred!');
  }
}
