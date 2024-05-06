import { Router } from 'express';
import AuctionController from './auction.controller';
import { AppConfig } from '@/config';
import { Routes } from '@/interfaces/routes.interface';

class AuctionRoute implements Routes {
  public path = `/${AppConfig.versioning}/auction`;
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/all`, AuctionController.findAll);
    this.router.route(`${this.path}/:id`).get(AuctionController.findById);
  }
}

export default AuctionRoute;
