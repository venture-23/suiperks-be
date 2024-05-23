import { BaseService } from '../base/base.service';
import AuctionModel from './auction.modal';
import { IAuctionDocument, IAuctionMetadata, IAuctionSettleData } from './auction.interface';
import SuiClientService from '@/services/sui.client.service';
import { AppConfig } from '@/config';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import TransactionModel from '../transaction/transaction.modal';

export class AuctionService extends BaseService<IAuctionDocument> {
  static instance: null | AuctionService;
  private SuiClient: SuiClientService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = AuctionModel) {
    super(repository);
    this.SuiClient = new SuiClientService();
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::auction::AuctionEvent`, this.bidAuction), 5000);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AuctionService();
    }
    return this.instance;
  }

  async createAuction({ nftDescription, nftImage, nftName, title, description }: IAuctionMetadata) {
    try {
      const SuiClient = new SuiClientService();
      const tx = new TransactionBlock();

      tx.moveCall({
        target: `${AppConfig.package_id}::auction::create_auction`,
        arguments: [tx.pure.u64('100000000'), tx.object(SUI_CLOCK_OBJECT_ID)],
        typeArguments: ['0x2::sui::SUI'],
      });
      const result = await SuiClient.client.signAndExecuteTransactionBlock({
        signer: SuiClient.keypair,
        transactionBlock: tx,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const txResponse = result.events[0].parsedJson as any;
      await this.repository.create({
        uid: txResponse?.auction_id,
        nftImage,
        nftName,
        nftDescription,
        title,
        description,
        amount: Number(txResponse?.amount),
        reservePrice: Number(txResponse?.reserve_price),
        duration: Number(txResponse?.duration),
        startTime: new Date(Number(txResponse?.start_time)),
        endTime: new Date(Number(txResponse?.end_time)),
        minBidIncrementPercentage: Number(txResponse?.min_bid_increment_percentage),
      });
      await TransactionModel.create({
        type: 'auction::create_auction',
        txDigest: result.digest,
        sender: result.transaction.data.sender,
        createdAt: new Date(Number(result.timestampMs)),
      });
    } catch (error) {
      console.log('[Auction/create]:', error);
      throw new Error(error);
    }
  }

  async bidAuction(bidEvent: PaginatedEvents) {
    try {
      if (bidEvent.data.length === 0) return;
      const bid = bidEvent.data[0].parsedJson as any;
      const txDigest = bidEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });

      if (hasSynced) throw new Error('Bid Already Placed, skipping...');
      await AuctionModel.updateOne(
        { uid: bid?.auction_id, settled: false },
        {
          $push: { funds: { address: bid?.highest_bidder, balance: bid?.current_bid_amount } },
          $set: { amount: bid?.next_auction_amount, highestBidder: bid?.highest_bidder },
        },
      );
      await TransactionModel.create({
        type: 'auction::AuctionEvent',
        txDigest,
        sender: bidEvent.data[0].sender,
        createdAt: new Date(Number(bidEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Auction/PlaceBid]:', error);
    }
  }

  async settleBid({ auctionInfo, nftName, nftDescription, nftImage }: IAuctionSettleData) {
    try {
      const SuiClient = new SuiClientService();
      const tx = new TransactionBlock();

      const auctionExist = await this.repository.findOne({ uid: auctionInfo, settled: false });
      if (!auctionExist) throw new HttpException('Auction Not Found', HttpStatus.NOT_FOUND);

      tx.moveCall({
        target: `${AppConfig.package_id}::auction::settle_bid`,
        arguments: [
          tx.pure.string(nftName),
          tx.pure.string(nftDescription),
          tx.pure.string(nftImage),
          tx.object(AppConfig.dao_treasury),
          tx.object(auctionInfo),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
        typeArguments: ['0x2::sui::SUI'],
      });
      const result = await SuiClient.client.signAndExecuteTransactionBlock({
        signer: SuiClient.keypair,
        transactionBlock: tx,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const txResponse = result.events[3].parsedJson as any;

      await this.repository.findOneAndUpdate(
        { uid: auctionInfo, settled: false },
        { $set: { settled: true, nftId: txResponse?.nft_id, nftOwner: txResponse?.nft_owner } },
      );
      await TransactionModel.create({
        type: 'auction::settle_bid',
        txDigest: result.digest,
        sender: result.transaction.data.sender,
        createdAt: new Date(Number(result.timestampMs)),
      });
    } catch (error) {
      console.log('[Auction/SettleBid]:', error);
      throw new Error(error);
    }
  }
}

export default AuctionService.getInstance();
