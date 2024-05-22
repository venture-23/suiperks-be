import { BaseService } from '../base/base.service';
import ProposalModel from './proposal.modal';
import { IProposalDocument, Status } from './proposal.interface';
import { PaginatedEvents } from '@mysten/sui.js/dist/cjs/client';
import SuiClientService from '@/services/sui.client.service';
import { AppConfig } from '@/config';
import PointService from '@/modules/points/points.service';

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

      const proposal = proposalEvent.data[0].parsedJson as any;
      const previousAddedProposal = await ProposalModel.findOne({ objectId: proposal.proposal_id });
      if (previousAddedProposal) return;
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
        { $upsert: true },
      );
      await PointService.addPoints(proposal.proposer, 10);
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

      const proposal = proposalEvent.data[0].parsedJson as any;
      let previousVotes;
      if (proposal.agree)
        previousVotes = await ProposalModel.findOne({
          objectId: proposal.proposal_id,
          forVoterList: { $elemMatch: { address: proposal.voter, nftId: proposal.nft } },
        });
      else
        previousVotes = await ProposalModel.findOne({
          objectId: proposal.proposal_id,
          againstVoterList: { $elemMatch: { address: proposal.voter, nftId: proposal.nft } },
        });

      if (previousVotes) throw new Error('Vote Already Casted');

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
    } catch (error) {
      console.log('[Proposal/CastVote]:', error);
    }
  }
  async changeVote(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;

      const proposal = proposalEvent.data[0].parsedJson as any;

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

      await PointService.addPoints(proposal.voter, 5);
    } catch (error) {
      console.log('[Proposal/ChangeVote]:', error);
    }
  }
  async revokeVote(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;

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
    } catch (error) {
      console.log('[Proposal/RevokeVote]:', error);
    }
  }
  async queueProposal(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;

      const proposal = proposalEvent.data[0].parsedJson as any;
      await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.QUEUE } });
    } catch (error) {
      console.log('[Proposal/QueueProposal]:', error);
    }
  }
  async executeProposal(proposalEvent: PaginatedEvents) {
    try {
      if (proposalEvent.data.length === 0) return;
      const txHash = proposalEvent.data[0].id.txDigest;

      const proposal = proposalEvent.data[0].parsedJson as any;
      await ProposalModel.updateOne({ objectId: proposal.proposal_id }, { $set: { status: Status.EXECUTED, executedHash: txHash } });
    } catch (error) {
      console.log('[Proposal/ExecuteProposal]:', error);
    }
  }
}

export default ProposalService.getInstance();
