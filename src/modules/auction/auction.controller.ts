import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import AuctionService from './auction.service';
import ProposalService from '../proposal/proposal.service';
import { Status } from '../proposal/proposal.interface';

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

  public getTreasuryBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const completedAuction = await this.auctionService.find({ settled: true });
      const executedProposal = await ProposalService.find({ status: Status.EXECUTED });

      const accumulated = completedAuction.reduce((sum, auction) => sum + auction.funds.at(-1).balance, 0);
      const distributed = executedProposal.reduce((sum, proposal) => sum + proposal.seekAmount, 0);
      return res.status(HttpStatus.OK).send({ balance: accumulated - distributed });
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public getOwnedNFT = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.params;

      const ownedNFT = await this.auctionService.repository
        .find({ settled: true, highestBidder: walletAddress })
        .select('nftImage nftName nftDescription nftId nftOwner');
      if (ownedNFT.length === 0) throw new HttpException('No NFT found', HttpStatus.NOT_FOUND);

      return res.status(HttpStatus.OK).send({
        type: 'success',
        statusCode: 200,
        message: 'NFT List',
        ownedNFT,
      });
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public findActiveAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.auctionService.repository.findOne({ settled: false }).sort({ createdAt: -1 });
      if (!response) throw new HttpException('No active auction found', HttpStatus.NOT_FOUND);

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
        .select('nftImage nftId nftOwner nftName nftDescription title description amount highestBidder')
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
