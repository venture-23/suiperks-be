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
    this.router.get(`/${AppConfig.versioning}/treasury-balance`, AuctionController.getTreasuryBalance);
    this.router.get(`/${AppConfig.versioning}/user-nfts/:walletAddress`, AuctionController.getOwnedNFT);
    this.router.get(`${this.path}/all`, AuctionController.findAll);
    this.router.get(`${this.path}/create`, AuctionController.createAuction);
    this.router.get(`${this.path}/settle`, AuctionController.settleAuction);
    this.router.get(`${this.path}/active`, AuctionController.findActiveAuction);
    this.router.get(`${this.path}/winners`, AuctionController.findAllWinners);
    this.router.route(`${this.path}/:id`).get(AuctionController.findById);
  }
}

export default AuctionRoute;
