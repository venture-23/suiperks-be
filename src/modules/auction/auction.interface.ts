import { Document } from 'mongoose';

export interface IAuction {
  uid: string;
  nftImage: string;
  nftName: string;
  nftDescription: string;
  title: string;
  description: string;
  amount: number;
  reservePrice: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  minBidIncrementPercentage: number; //
  funds: { address: string; balance: number }[];
  highestBidder: string;
  settled: boolean;
  createdAt?: Date;
}

export interface IAuctionDocument extends IAuction, Document {}

export interface IAuctionBidEvent {
  highest_bidder: string;
  next_auction_amount: number;
}

export interface IAuctionMetadata {
  title: string;
  description: string;
  nftName: string;
  nftDescription: string;
  nftImage: string;
}

export interface IAuctionSettleData {
  auctionInfo: string;
  nftName: string;
  nftDescription: string;
  nftImage: string;
}
