import AuctionService from '@/modules/auction/auction.service';

// export const createAuctionScript = async () => {
//   return new Promise(resolve => resolve(AuctionService.createAuction()));
// };

export const createAuction = () =>
  AuctionService.createAuction()
    .then(() => console.log('Auction created'))
    .catch(err => console.log('auction creation err:', err));

export const settleAuction = () =>
  AuctionService.settleBid()
    .then(() => console.log('Auction settled'))
    .catch(err => console.log('auction settlement err:', err));

// createAuctionScript();
// settleAuction();
