import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '@nestjs/common';
import ProposalService from './proposal.service';

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

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await this.proposalService.find({});
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding:', error);
      return next(error);
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const response = await this.proposalService.findById(id);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in finding by id:', error);
      return next(error);
    }
  };

  public updateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const response = await this.proposalService.updateById(id, data);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in updating by id:', error);
      return next(error);
    }
  };

  public deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const response = await this.proposalService.deleteOne({ _id: id });
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      console.error('Error in deleting:', error);
      return next(error);
    }
  };
}

export default ProposalController.getInstance();
