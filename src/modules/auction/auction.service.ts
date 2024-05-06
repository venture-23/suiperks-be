import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import AuctionModel from './auction.modal';
import { IAuctionBidEvent, IAuctionDocument } from './auction.interface';
import SuiClientService from '@/services/sui.client.service';
import { AppConfig } from '@/config';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';

export class AuctionService extends BaseService<IAuctionDocument> {
  static instance: null | AuctionService;
  private SuiClient = new SuiClientService();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = AuctionModel) {
    super(repository);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::auction::AuctionInfoEvent`, this.bidAuction), 5000);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AuctionService();
    }
    return this.instance;
  }

  async createAuction() {
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
    });
    console.log(result.digest);
    const digest_ = result.digest;

    const txn = await SuiClient.client.getTransactionBlock({
      digest: String(digest_),
      // only fetch the effects and objects field
      options: {
        showEffects: true,
        showInput: false,
        showEvents: false,
        showObjectChanges: true,
        showBalanceChanges: false,
      },
    });
    const output = txn.objectChanges;
    let AuctionInfo;
    for (let i = 0; i < output.length; i++) {
      const item = output[i];
      if ((await item.type) === 'created') {
        if ((await item.objectType) === `${AppConfig.package_id}::auction::AuctionInfo<0x2::sui::SUI>`) {
          AuctionInfo = String(item.objectId);
        }
      }
    }
    console.log(`AuctionInfo: ${AuctionInfo}`);
  }

  async bidAuction(bidEvent: PaginatedEvents) {
    console.log({ bidEvent });
    return;
  }

  async settleBid() {
    const SuiClient = new SuiClientService();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${AppConfig.package_id}::auction::settle_bid`,
      arguments: [
        tx.pure.string('OxNFT #1'),
        tx.pure.string('random description'),
        tx.pure.string(
          'https://cdn.leonardo.ai/users/84487ea6-407f-45f2-952f-05212bc952a4/generations/0208653b-fdf6-4bec-9c52-1b649f9262df/variations/Default_Japanese_tshirt_designs_like_tattoos_full_of_pictures_2_0208653b-fdf6-4bec-9c52-1b649f9262df_1.jpg?w=512',
        ),
        tx.object(AppConfig.dao_treasury),
        tx.object(AppConfig.auction_info),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: ['0x2::sui::SUI'],
    });
    const result = await SuiClient.client.signAndExecuteTransactionBlock({
      signer: SuiClient.keypair,
      transactionBlock: tx,
    });
    console.log(result.digest);
    const digest_ = result.digest;

    const txn = await SuiClient.client.getTransactionBlock({
      digest: String(digest_),
      // only fetch the effects and objects field
      options: {
        showEffects: true,
        showInput: false,
        showEvents: false,
        showObjectChanges: true,
        showBalanceChanges: false,
      },
    });
    const output = txn.objectChanges;
    let OxNFT;
    for (let i = 0; i < output.length; i++) {
      const item = output[i];
      if ((await item.type) === 'created') {
        if ((await item.objectType) === `${AppConfig.package_id}::oxdao_nft::OxDaoNFT`) {
          OxNFT = String(item.objectId);
        }
      }
    }
    console.log(`OxNFT: ${OxNFT}`);
  }
}

export default AuctionService.getInstance();
