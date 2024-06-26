import { NextFunction, Request, Response } from 'express';
import { HttpException, Logger } from '@nestjs/common';

const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status = error.getStatus ? error.getStatus() : 500;
    const message = error.message || 'Something went wrong';

    const logger = new Logger();
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
