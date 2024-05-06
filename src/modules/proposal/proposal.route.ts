import { Router } from 'express';
import ProposalController from './proposal.controller';
import { AppConfig } from '@/config';
import { Routes } from '@/interfaces/routes.interface';

class ProposalRoute implements Routes {
  public path = `/${AppConfig.versioning}/result`;
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/all`, ProposalController.findAll);
    this.router.route(`${this.path}/:id`).get(ProposalController.findById);
    // .put([authMiddleware, adminOnly()], ProposalController.updateById)
    // .delete([authMiddleware, adminOnly()], ProposalController.deleteById);
  }
}

export default ProposalRoute;
