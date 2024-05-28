import { Schema, model } from 'mongoose';
import { IPointDocument } from './points.interface';

const PointSchema: Schema<IPointDocument> = new Schema({
  walletAddress: { type: String, required: true },
  point: { type: Number, default: 0 },
  claimable: { type: Number, default: 0 },
  consumedPoint: { type: Number, default: 0 },
  totalClaimed: { type: Number, default: 0 },
});

export const PointModel = model<IPointDocument>('points', PointSchema);
