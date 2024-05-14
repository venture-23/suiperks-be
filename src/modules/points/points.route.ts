import { Router } from 'express';
import PointController from './points.controller';

class PointRoute {
  public path = '/point';

  constructor(private router: Router) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/leaderboard`, PointController.getTopPoints);
    this.router.get(`${this.path}/:walletAddress`, PointController.getPointsForAddress);
  }
}

export default PointRoute;
