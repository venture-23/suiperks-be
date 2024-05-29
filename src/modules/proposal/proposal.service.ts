import { BaseService } from '../base/base.service';
import ProposalModel from './proposal.modal';
import { IProposalDocument, Status } from './proposal.interface';
import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';
import SuiClientService from '@/services/sui.client.service';
import { AppConfig } from '@/config';
import PointService from '@/modules/points/points.service';
import TransactionModel from '../transaction/transaction.modal';

export class ProposalService extends BaseService<IProposalDocument> {
  static instance: null | ProposalService;
  private SuiClient: SuiClientService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = ProposalModel) {
    super(repository);
    this.SuiClient = new SuiClientService();
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::NewProposal`, this.addProposal), 5000);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::CastVote`, this.castVote), 5000);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::ChangeVote`, this.changeVote), 5000);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::RevokeVote`, this.revokeVote), 5000);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::QueuedProposal`, this.queueProposal), 5000);
    setInterval(() => this.SuiClient.fetchEvents(`${AppConfig.package_id}::ethena_dao::ExecuteProposal`, this.executeProposal), 5000);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ProposalService();
    }
    return this.instance;
  }
  async addProposal(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Proposal Already Added, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;
      const proposalExist = await ProposalModel.findOne({ hash: proposal.hash });
      if (!proposalExist) throw new Error('Proposal Not found');

      await ProposalModel.updateOne(
        { hash: proposal.hash },
        {
          $set: {
            objectId: proposal.proposal_id,
            proposer: proposal.proposer,
            startTime: new Date(Number(proposal.start_time)),
            endTime: new Date(Number(proposal.end_time)),
            actionDelay: Number(proposal.action_delay),
            quorumVotes: Number(proposal.quorum_votes),
            votingQuorumRate: Number(proposal.voting_quorum_rate),
            seekAmount: Number(proposal.seek_amount),
          },
        },
      );
      await PointService.addPoints(proposal.proposer, 10);
      await TransactionModel.create({
        type: 'ethena_dao::NewProposal',
        txDigest,
        sender: proposalEvent.data[0].sender,
        nftId: proposalExist.nftId,
        message: `Proposal ${proposal.proposal_id.slice(0, 5)} was proposed by ${proposal.proposer}`,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });

      setTimeout(async () => await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.ACTIVE } }), 60 * 1000);
      setTimeout(
        async () => await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.WAITING } }),
        new Date(Number(proposal.end_time)).getTime() - Date.now(),
      );
    } catch (error) {
      console.log('[Proposal/create]:', error);
    }
  }

  async castVote(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Vote Already Casted, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;

      if (proposal.agree)
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $push: {
              forVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { forVotes: 1 },
          },
        );
      else
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $push: {
              againstVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { againstVotes: 1 },
          },
        );

      await PointService.addPoints(proposal.voter, 5);
      await TransactionModel.create({
        type: 'ethena_dao::CastVote',
        txDigest,
        sender: proposalEvent.data[0].sender,
        nftId: proposal.nft,
        message: `Proposal ${proposal.proposal_id.slice(0, 5)} was voted ${proposal.agree ? 'in favour.' : 'against.'}`,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Proposal/CastVote]:', error);
    }
  }
  async changeVote(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Vote Already Changed, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;

      /** If the vote has changed from favour to against */
      if (!proposal.agree) {
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $pull: {
              forVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: { $exists: true } },
            },
            $inc: { forVotes: -1 },
          },
        );
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $push: {
              againstVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { againstVotes: 1 },
          },
        );
      } else {
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $pull: {
              againstVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: { $exists: true } },
            },
            $inc: { againstVotes: -1 },
          },
        );
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $push: {
              forVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { forVotes: 1 },
          },
        );
      }

      await TransactionModel.create({
        type: 'ethena_dao::ChangeVote',
        txDigest,
        sender: proposalEvent.data[0].sender,
        nftId: proposal.nft,
        message: `Vote changed ${!proposal.agree ? 'from favour to against' : 'from against to favour '} for Proposal ${proposal.proposal_id.slice(
          0,
          5,
        )}.`,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Proposal/ChangeVote]:', error);
    }
  }
  async revokeVote(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Proposal Already Revoked, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;
      const hasPreviouslyAggreed = await ProposalModel.findOne({
        objectId: proposal.proposal_id,
        forVoterList: { $elemMatch: { address: proposal.voter, nftId: proposal.nft } },
      });
      if (!!hasPreviouslyAggreed)
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $pull: {
              forVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: { $exists: true } },
            },
            $push: {
              refrainVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { forVotes: -1, refrainVotes: 1 },
          },
        );
      else
        await ProposalModel.updateOne(
          { objectId: proposal.proposal_id },
          {
            $pull: {
              againstVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: { $exists: true } },
            },
            $push: {
              refrainVoterList: { address: proposal.voter, nftId: proposal.nft, votedAt: new Date(Number(proposal.vote_period)) },
            },
            $inc: { againstVotes: -1, refrainVotes: 1 },
          },
        );

      await PointService.addPoints(proposal.voter, -5);
      await TransactionModel.create({
        type: 'ethena_dao::RevokeVote',
        txDigest,
        sender: proposalEvent.data[0].sender,
        nftId: proposal.nft,
        message: `Vote revoked for Proposal ${proposal.proposal_id.slice(0, 5)}.`,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Proposal/RevokeVote]:', error);
    }
  }
  async queueProposal(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Proposal Previously Queued, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;
      await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.QUEUE } });
      await TransactionModel.create({
        type: 'ethena_dao::QueuedProposal',
        txDigest,
        sender: proposalEvent.data[0].sender,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Proposal/QueueProposal]:', error);
    }
  }
  async executeProposal(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txDigest = proposalEvent.data[0].id.txDigest;
      const hasSynced = await TransactionModel.findOne({ txDigest });
      if (hasSynced) throw new Error('Proposal Already Executed, skipping...');

      const proposal = proposalEvent.data[0].parsedJson as any;
      await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.EXECUTED, executedHash: txDigest } });
      await TransactionModel.create({
        type: 'ethena_dao::ExecuteProposal',
        txDigest,
        sender: proposalEvent.data[0].sender,
        createdAt: new Date(Number(proposalEvent.data[0].timestampMs)),
      });
    } catch (error) {
      console.log('[Proposal/ExecuteProposal]:', error);
    }
  }
}

export default ProposalService.getInstance();
