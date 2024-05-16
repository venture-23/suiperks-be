import { IProposalDocument, Status } from './proposal.interface';
import { model, Schema } from 'mongoose';

const ProposalSchema: Schema<IProposalDocument> = new Schema({
  objectId: { type: String },
  title: { type: String, required: true },
  details: { type: String, required: true },
  proposer: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  forVotes: { type: Number, default: 0 },
  againstVotes: { type: Number, default: 0 },
  refrainVotes: { type: Number, default: 0 },
  forVoterList: {
    type: [
      {
        address: { type: String },
        nftId: { type: String },
        votedAt: { type: Date },
      },
    ],
    default: [],
  },
  againstVoterList: {
    type: [
      {
        address: { type: String },
        nftId: { type: String },
        votedAt: { type: Date },
      },
    ],
    default: [],
  },
  eta: { type: Number, default: 0 },
  actionDelay: { type: Number, default: 0 },
  quorumVotes: { type: Number },
  votingQuorumRate: { type: Number },
  hash: { type: String },
  seekAmount: { type: Number, default: 0 },
  executable: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(Status), default: Status.WAITING },
  createdAt: { type: Date, default: Date.now },
});

const ProposalModel = model<IProposalDocument>('proposal', ProposalSchema);
Status;
export default ProposalModel;
