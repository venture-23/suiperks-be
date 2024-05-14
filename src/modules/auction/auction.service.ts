import { BaseService } from '../base/base.service';
import AuctionModel from './auction.modal';
import { IAuctionDocument, IAuctionMetadata, IAuctionSettleData } from './auction.interface';
import SuiClientService from '@/services/sui.client.service';
import { AppConfig } from '@/config';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';

export class AuctionService extends BaseService<IAuctionDocument> {
  static instance: null | AuctionService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = AuctionModel) {
    super(repository);
    setInterval(() => new SuiClientService().fetchEvents(`${AppConfig.package_id}::auction::AuctionEvent`, this.bidAuction), 5000);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AuctionService();
    }
    return this.instance;
  }

  async createAuction({ nftDescription, nftImage, nftName, title, description }: IAuctionMetadata) {
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
  }

  async bidAuction(bidEvent: PaginatedEvents) {
    if (bidEvent.data.length === 0) return;
    const bid = bidEvent.data[0].parsedJson as any;
    console.log(bid);
    const previousBid = await AuctionModel.findOne({ uid: bid?.auction_id, settled: false });

    if (!previousBid || previousBid.amount > bid?.current_amount) return; //Since this record is already added
    await AuctionModel.updateOne(
      { uid: bid?.auction_id, settled: false },
      {
        $push: { funds: { address: bid?.highest_bidder, balance: bid?.current_amount } },
        $set: { amount: bid?.next_auction_amount, highestBidder: bid?.highest_bidder },
      },
    );
  }

  async settleBid({ auctionInfo, nftName, nftDescription, nftImage }: IAuctionSettleData) {
    const SuiClient = new SuiClientService();
    const tx = new TransactionBlock();

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
    console.log(result.events);
    const txResponse = result.events[0].parsedJson as any;
    const treasury = txResponse?.total_amount;

    const response = await this.repository.findOneAndUpdate({ uid: auctionInfo, settled: false }, { $set: { settled: true } });
    if (!response) throw new Error('Auction not found or already setteled');
  }
}

export default AuctionService.getInstance();
