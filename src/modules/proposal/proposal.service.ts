import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import ProposalModel from './proposal.modal';
import { IProposalDocument } from './proposal.interface';

export class ProposalService extends BaseService<IProposalDocument> {
  static instance: null | ProposalService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = ProposalModel) {
    super(repository);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ProposalService();
    }
    return this.instance;
  }

  async approveProposal(uid: string) {
    const proposal = await this.repository.updateOne({ uid });

    if (!proposal) {
      throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
    }

    return proposal;
  }
}

export default ProposalService.getInstance();
