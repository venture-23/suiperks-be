import { Router } from 'express';
import ProposalController from './proposal.controller';
import { AppConfig } from '@/config';
import { Routes } from '@/interfaces/routes.interface';

class ProposalRoute implements Routes {
  public path = `/${AppConfig.versioning}/proposal`;
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, ProposalController.createProposal);
    this.router.get(`${this.path}/all`, ProposalController.findAll);
    this.router.post(`${this.path}/failed`, ProposalController.failProposal);
    this.router.route(`${this.path}/:id`).get(ProposalController.findById);
  }
}

export default ProposalRoute;
