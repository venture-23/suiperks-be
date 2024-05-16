import { Document } from 'mongoose';

export enum Status {
  WAITING = 'Waiting',
  ACTIVE = 'Active',
  FAILED = 'Failed',
  QUEUE = 'Queue',
  EXECUTED = 'Executed',
}

interface IVote {
  address: string;
  nftId: string;
  votedAt: Date;
}

export interface IProposal {
  objectId: string;
  title: string;
  details: string;
  proposer: string;
  startTime: Date;
  endTime: Date;
  refrainVotes: number;
  forVotes: number;
  againstVotes: number;
  forVoterList: IVote[];
  againstVoterList: IVote[];
  eta: number;
  actionDelay: number;
  quorumVotes: number;
  votingQuorumRate: number;
  hash: String;
  status: Status;
  seekAmount: number;
  executable: boolean;
  createdAt?: Date;
}

export interface IProposalDocument extends IProposal, Document {}
