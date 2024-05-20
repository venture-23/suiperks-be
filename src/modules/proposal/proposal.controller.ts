import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '@nestjs/common';
import ProposalService from './proposal.service';
import { IProposal, IVote, Status } from './proposal.interface';
import { sha224 } from 'js-sha256';
import AuctionService from '../auction/auction.service';

export class ProposalController {
  static instance: null | ProposalController;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(private proposalService = ProposalService) {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new ProposalController();
    }
    return this.instance;
  }
  public createProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auctionMetadata: Partial<IProposal> = req.body;
      const hash = sha224(auctionMetadata.title + auctionMetadata.details);
      const response = await this.proposalService.create({ ...auctionMetadata, hash });
      return res.status(HttpStatus.OK).send({ ...response.toObject(), hash });
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.proposalService.find({ objectId: { $exists: true } });
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public failProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { proposalId } = req.body;
      const response = await this.proposalService.updateOne({ objectId: proposalId }, { $set: { status: Status.FAILED } });
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in updating:', error);
      return next(error);
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const response = await this.proposalService.findById(id);
      const refrainVoterList = await Promise.all(
        response.refrainVoterList.map(async ({ nftId, address, votedAt }: IVote) => {
          const nftDetails = await AuctionService.repository.findOne({ nftId }).select('nftImage nftName nftDescription nftId -_id');
          return { ...nftDetails.toObject(), address, votedAt };
        }),
      );
      const forVoterList = await Promise.all(
        response.forVoterList.map(async ({ nftId, address, votedAt }: IVote) => {
          const nftDetails = await AuctionService.repository.findOne({ nftId }).select('nftImage nftName nftDescription nftId -_id');
          return { ...nftDetails.toObject(), address, votedAt };
        }),
      );
      const againstVoterList = await Promise.all(
        response.againstVoterList.map(async ({ nftId, address, votedAt }: IVote) => {
          const nftDetails = await AuctionService.repository.findOne({ nftId }).select('nftImage nftName nftDescription nftId -_id');
          return { ...nftDetails.toObject(), address, votedAt };
        }),
      );

      return res.status(HttpStatus.OK).send({ ...response.toObject(), refrainVoterList, forVoterList, againstVoterList });
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };
}

export default ProposalController.getInstance();
