import { Document } from 'mongoose';

export interface ITransaction {
  type: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: number;
  createdAt?: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}
