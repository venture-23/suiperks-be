import { NextFunction, Request, Response } from 'express';
import PointsService from './points.service';
import { HttpStatus } from '@nestjs/common';
import TransactionModel from '../transaction/transaction.modal';

export class PointController {
  static instance: null | PointController;
  private mintPaused = true;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(private pointservice = PointsService) {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new PointController();
    }
    return this.instance;
  }

  public airdropToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.pointservice.airdropToken();
      return res.status(HttpStatus.OK).send({ message: 'token Airdropped' });
    } catch (error) {
      console.error('Error in getting:', error);
      return next(error);
    }
  };

  public adminAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pause } = req.query;
      const shouldPause = Boolean(Number(pause as string));
      await this.pointservice.adminAction(shouldPause);
      this.mintPaused = shouldPause;
      return res
        .status(HttpStatus.OK)
        .send({ message: `Success, Airdrop mint is now ${shouldPause ? 'Paused' : 'Resumed'}`, status: this.mintPaused });
    } catch (error) {
      console.error('Error:', error);
      return next(error);
    }
  };

  // Route: GET: /point/leaderboard
  public getTopPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { size = 10 } = req.query;
      const result = await this.pointservice.getTopPoints(size as number);

      return res.status(HttpStatus.OK).send(result);
    } catch (error) {
      console.error('Error in getting:', error);
      return next(error);
    }
  };
  // Route: GET: /point/leaderboard
  public getPointsForAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.params;
      const result = await this.pointservice.findOne({ walletAddress });

      return res.status(HttpStatus.OK).send(result);
    } catch (error) {
      console.error('Error in getting:', error);
      return next(error);
    }
  };

  public getClaimableTokenStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(HttpStatus.OK).send({
        status: this.mintPaused,
        messsage: this.mintPaused ? 'Airdrop mint is Paused' : 'Airdrop mint is Resumed',
      });
    } catch (error) {
      console.error('Error:', error);
      return next(error);
    }
  };

  public nftActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nftId } = req.params;

      const activity = await TransactionModel.find({ nftId });
      return res.status(HttpStatus.OK).send(activity);
    } catch (error) {
      console.error('Error:', error);
      return next(error);
    }
  };
}

export default PointController.getInstance();
