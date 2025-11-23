import { Request, Response } from 'express';
import { StatusCodes } from './status-codes';
import { CommonException } from '../errors/common.error';

export const globalErrorHandler = (err: any, _req: Request, res: Response, _next) => {
  // Error handled

  if (err.code) {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    err.statusCode = undefined;
    return res.status(statusCode).send(err);
  }

  let fail;
  if (err instanceof Error) {
    fail = CommonException.UnknownError(err.message);
    fail.message = err.message;
  } else {
    fail = CommonException.UnknownError(err);
  }
  fail.statusCode = undefined;

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(fail);
};
