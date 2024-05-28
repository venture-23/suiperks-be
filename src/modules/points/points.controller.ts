import { NextFunction, Request, Response } from 'express';
import { PointModel } from './points.model';
import PointsService from './points.service';
import { HttpStatus } from '@nestjs/common';
import { AppConfig } from '@/config';

export class PointController {
  static instance: null | PointController;

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
      await this.pointservice.adminAction(Boolean(pause as string));
      return res.status(HttpStatus.OK).send({ message: 'Success' });
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
}

export default PointController.getInstance();
