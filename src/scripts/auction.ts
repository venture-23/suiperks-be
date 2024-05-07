import AuctionService from '@/modules/auction/auction.service';

const auctionMetadata = {
  title: 'Auction Day 1',
  description: 'Auction Day 1 description',
  nftName: 'Goblin',
  nftDescription: 'Goblin description',
  nftImage: 'https://goblinsuinft.web.app/assets/img/goblin5.png',
};

const settleBidData = {
  auctionInfo: '0x74559e6005939147bb8dfe9fabd5cb5ae31ba12266df5b22f7601ff6f59dbb9e',
  nftName: 'Goblin',
  nftDescription: 'Goblin description',
  nftImage: 'https://goblinsuinft.web.app/assets/img/goblin5.png',
};

export const createAuction = () =>
  AuctionService.createAuction(auctionMetadata)
    .then(() => console.log('Auction created'))
    .catch(err => console.log('auction creation err:', err));

export const settleAuction = () =>
  AuctionService.settleBid(settleBidData)
    .then(() => console.log('Auction settled'))
    .catch(err => console.log('auction settlement err:', err));

// createAuction();
// settleAuction();
