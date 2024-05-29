import { Router } from 'express';
import PointController from './points.controller';
import { AppConfig } from '@/config';

class PointRoute {
  public path = `/${AppConfig.versioning}/point`;
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/leaderboard`, PointController.getTopPoints);
    this.router.get(`${this.path}/:walletAddress`, PointController.getPointsForAddress);
    this.router.get(`/v1/token/airdrop`, PointController.airdropToken);
    this.router.get(`/v1/token/claimable/status`, PointController.getClaimableTokenStatus);
    this.router.get(`/v1/token/action`, PointController.adminAction);
    this.router.get(`/v1/activity/:nftId`, PointController.nftActivity);
  }
}

export default PointRoute;
