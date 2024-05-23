import { Document } from 'mongoose';

export interface ITransaction {
  type: string;
  txDigest: string;
  sender: string;
  createdAt?: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}
