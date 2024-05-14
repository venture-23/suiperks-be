import { Document } from "mongoose";

export interface IPoint {
  walletAddress: string;
  point: number;
}

export interface IPointDocument extends IPoint, Document {}