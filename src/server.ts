import App from '@/app';
import ProposalRoute from './modules/proposal/proposal.route';
import AuctionRoute from './modules/auction/auction.route';
import validateEnv from '@/utils/validateEnv';

validateEnv();

const app = new App([new AuctionRoute(), new ProposalRoute()]);

app.listen();
