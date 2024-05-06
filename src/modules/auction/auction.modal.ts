import { IAuctionDocument } from './auction.interface';
import { model, Schema } from 'mongoose';

const AuctionSchema: Schema<IAuctionDocument> = new Schema({
  uid: { type: String, required: true },
  nftImage: { type: String, required: true },
  nftName: { type: String, required: true },
  nftDescription: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  reservePrice: { type: Number, required: true },
  duration: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  minBidIncrementPercentage: { type: Number, required: true },
  funds: { type: [{ address: { type: String }, balance: { type: Number } }], default: [] },
  highestBidder: { type: String },
  settled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const AuctionModel = model<IAuctionDocument>('auction', AuctionSchema);

export default AuctionModel;
