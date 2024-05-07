import { ITransactionDocument } from './transaction.interface';
import { model, Schema } from 'mongoose';

const TransactionSchema: Schema<ITransactionDocument> = new Schema({
  type: { type: String },
  txDigest: { type: String },
  eventSeq: { type: String },
  sender: { type: String },
  timestampMs: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const TransactionModel = model<ITransactionDocument>('transaction', TransactionSchema);

export default TransactionModel;
