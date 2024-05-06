import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '@nestjs/common';
import AuctionService from './auction.service';

export class AuctionController {
  static instance: null | AuctionController;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(private auctionService = AuctionService) {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new AuctionController();
    }
    return this.instance;
  }

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.auctionService.find({});
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const response = await this.auctionService.findById(id);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };
}

export default AuctionController.getInstance();
