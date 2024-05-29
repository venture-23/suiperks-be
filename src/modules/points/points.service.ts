import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';
import SuiClientService from '@/services/sui.client.service';
import { BaseService } from '../base/base.service';
import { IPointDocument } from './points.interface';
import { PointModel } from './points.model';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { AppConfig } from '@/config';
import TransactionModel from '../transaction/transaction.modal';

class PointService extends BaseService<IPointDocument> {
  static instance: null | PointService;
  private SuiClient: SuiClientService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = PointModel) {
    super(repository);
    this.SuiClient = new SuiClientService();
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::oxcoin::RewardClaimed`, this.rewardClaimed), 5000);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new PointService();
    }
    return this.instance;
  }

  async airdropToken() {
    try {
      const SuiClient = new SuiClientService();
      const tx = new TransactionBlock();

      const top3Addresses = await this.repository.aggregate([
        {
          $project: {
            difference: { $subtract: ['$point', '$consumedPoint'] },
            point: '$point',
            walletAddress: '$walletAddress',
          },
        },
        {
          $sort: { difference: -1 },
        },
        { $limit: 3 },
      ]);

      console.log(top3Addresses);

      for (const user of top3Addresses) {
        tx.moveCall({
          target: `${AppConfig.package_id}::oxcoin::add_top_three_voter_list`,
          arguments: [
            tx.object(AppConfig.admin_cap),
            tx.object(AppConfig.directory),
            tx.pure.address(user.walletAddress),
            tx.pure.u64(user.point * 1000000000),
          ],
        });
      }

      const result = await SuiClient.client.signAndExecuteTransactionBlock({
        signer: SuiClient.keypair,
        transactionBlock: tx,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      });

      for (const user of top3Addresses) {
        await this.repository.findOneAndUpdate({ walletAddress: user.walletAddress }, { $set: { claimable: user.point * 1000000000 } });
      }
      await TransactionModel.create({
        type: 'oxcoin::add_voter_list',
        txDigest: result.digest,
        sender: SuiClient.keypair.toSuiAddress(),
      });
    } catch (error) {
      console.log('[Token/Airdrop]:', error);
      throw new Error(error);
    }
  }

  async rewardClaimed(rewardEvent: PaginatedEvents) {
    try {
      if (rewardEvent.data.length === 0) return;
      const reward = rewardEvent.data[0].parsedJson as any;
      const txDigest = rewardEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });

      if (hasSynced) throw new Error('Reward Already Claimed, skipping...');
      const userPoint = await PointModel.findOne({ walletAddress: reward.claimed_id });
      userPoint.consumedPoint = userPoint.point;
      userPoint.claimable = 0;
      await userPoint.save();
      await TransactionModel.create({
        type: 'oxcoin::RewardClaimed',
        txDigest,
        sender: rewardEvent.data[0].sender,
        createdAt: new Date(Number(rewardEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Token/Claimed]:', error);
    }
  }
  async adminAction(pause: boolean) {
    try {
      const tx = new TransactionBlock();

      tx.moveCall({
        target: `${AppConfig.package_id}::oxcoin::${pause ? 'admin_pause' : 'admin_resume'}`,
        arguments: [
          tx.object(AppConfig.directory), // Proposal<DaoWitness>
          tx.object(AppConfig.admin_cap),
        ],
      });
      const result = await this.SuiClient.client.signAndExecuteTransactionBlock({
        signer: this.SuiClient.keypair,
        transactionBlock: tx,
      });
      await TransactionModel.create({
        type: pause ? 'oxcoin::admin_pause' : 'oxcoin::admin_resume',
        txDigest: result.digest,
        sender: this.SuiClient.keypair.toSuiAddress(),
      });
    } catch (error) {
      console.log('[Token/Action]:', error);
    }
  }

  async addPoints(walletAddress: string, point: number) {
    return await this.repository.updateOne({ walletAddress }, { $inc: { point } }, { new: true, upsert: true });
  }
  async getPoints(walletAddress: string) {
    return await this.repository.findOne({ walletAddress });
  }

  async getTopPoints(size = 10) {
    return await this.repository.find({}).sort({ point: -1 }).limit(size);
  }
}

export default PointService.getInstance();
