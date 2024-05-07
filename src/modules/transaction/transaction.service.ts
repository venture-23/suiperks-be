import { BaseService } from '../base/base.service';
import { ITransactionDocument } from './transaction.interface';
import TransactionModel from './transaction.modal';

export class TransactionService extends BaseService<ITransactionDocument> {
  static instance: null | TransactionService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = TransactionModel) {
    super(repository);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new TransactionService();
    }
    return this.instance;
  }
}

export default TransactionService.getInstance();
