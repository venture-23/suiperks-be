import { IProposalDocument } from './proposal.interface';
import { model, Schema } from 'mongoose';

const ProposalSchema: Schema<IProposalDocument> = new Schema({
  uid: { type: String, required: true },
  proposer: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  forVotes: { type: Number, default: 0 },
  againstVotes: { type: Number, default: 0 },
  forVoterList: { type: [String], default: [] },
  againstVoterList: { type: [String], default: [] },
  eta: { type: Number, required: true },
  actionDelay: { type: Number, default: 0 },
  quorumVotes: { type: Number, required: true },
  votingQuorumRate: { type: Number, required: true },
  hash: { type: String, required: true },
  seekAmount: { type: Number, default: 0 },
  executable: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProposalModel = model<IProposalDocument>('proposal', ProposalSchema);

export default ProposalModel;
