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

  public createAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auctionMetadata = req.body;
      const response = await this.auctionService.createAuction(auctionMetadata);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };

  public settleAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settleBidData = req.body;
      const response = await this.auctionService.settleBid(settleBidData);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.auctionService.find({});
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public findActiveAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.auctionService.repository.findOne({ settled: false }).sort({ createdAt: -1 });
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public findAllWinners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.auctionService.repository
        .find({ settled: true })
        .select('nftImage nftName nftDescription title description amount highestBidder')
        .sort({ createdAt: -1 });
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
