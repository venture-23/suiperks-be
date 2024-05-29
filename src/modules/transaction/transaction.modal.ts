import { ITransactionDocument } from './transaction.interface';
import { model, Schema } from 'mongoose';

const TransactionSchema: Schema<ITransactionDocument> = new Schema({
  type: { type: String, required: true },
  txDigest: { type: String, required: true },
  sender: { type: String, required: true },
  nftId: { type: String },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const TransactionModel = model<ITransactionDocument>('transaction', TransactionSchema);

export default TransactionModel;
