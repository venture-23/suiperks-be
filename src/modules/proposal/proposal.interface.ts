import { Document } from 'mongoose';

export interface IProposal {
  uid: string;
  proposer: string;
  startTime: Date;
  endTime: Date;
  forVotes: number;
  againstVotes: number;
  forVoterList: string[];
  againstVoterList: string[];
  eta: number;
  actionDelay: number;
  quorumVotes: number;
  votingQuorumRate: number;
  hash: String;
  seekAmount: number;
  executable: boolean;
  createdAt?: Date;
}

export interface IProposalDocument extends IProposal, Document {}
