import { Document } from 'mongoose';

export interface IPoint {
  walletAddress: string;
  point: number;
  claimable: number;
  totalClaimed: number;
  consumedPoint: number;
}

export interface IPointDocument extends IPoint, Document {}
