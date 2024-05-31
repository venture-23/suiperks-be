# SUI Perks DAO Backend

This is a decentralized autonomous organization (DAO) backend built using Node.js, Express, and MongoDB. The backend is structured in a modular design with three main modules: Auction, Proposal, and Points. The system uses `queryEvent` from SUI to listen to events related to auction creation, bidding, and settlement, as well as proposal creation, voting, and execution. Each day, an NFT is listed for auction, and users can bid on it. The auction winner's bid amount is transferred to the treasury. To create a proposal, users must hold an NFT. Once a proposal is submitted, other NFT holders can vote on it, and their points increase based on their participation. The top three users on the leaderboard receive an OxCoin airdrop each season.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Modules](#modules)
  - [Auction](#auction)
  - [Proposal](#proposal)
  - [Points](#points)
- [Events](#events)
  - [queryEvent](#queryevent)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- Daily NFT auctions
- User bidding system
- Proposal creation and voting
- Points system for participation
- Leaderboard with seasonal rewards in OxCoin
- Event-driven architecture on SUI

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **SUI**: Event-driven framework

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/venture-23/sui-crowdfunddao-be
   cd sui-crowdfunddao-be
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Configuration](#configuration)).

4. Start the server:
   ```bash
   npm start
   ```

## Configuration

Create a `.env` file in the root directory with the following environment variables:

```env
VERSIONING='v1'
NODE_ENV='development'
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dao
LOG_DIR="logs"
CREDENTIALS=1
LOG_FORMAT= "dev"
ORIGIN= "*"
SECRET= 'secret'
PACKAGE_ID=package_id
DAO_TREASURY=treasury_id
AUCTION_DETAIL=contract_address
ADMIN_CAP=_contract_address
DIRECTORY=_contract_address
MNEMONICS='***'
```

## Modules

### Auction

Handles NFT auctions, bidding, and settlement. Each day, an NFT is listed for auction, and users can place their bids. The highest bidder wins the auction, and the bid amount is transferred to the treasury.

### Proposal

Manages proposals creation, voting, and execution. Users must hold an NFT to create a proposal. Other NFT holders can vote on the proposals, and their points increase based on their participation.

### Points

Tracks user points and manages the leaderboard. Users earn points by participating in proposals. The top three users on the leaderboard receive an OxCoin airdrop each season.

## Events

### queryEvent

`queryEvent` from SUI is used to listen to specific events related to auctions and proposals. These events include:

- **Auction Events**:
  - **Auction Creation**: Triggered when a new auction is created.
  - **Bidding**: Triggered when a bid is placed on an auction.
  - **Settlement**: Triggered when an auction is settled.

- **Proposal Events**:
  - **Proposal Creation**: Triggered when a new proposal is created.
  - **Voting**: Triggered when a vote is cast on a proposal.
  - **Execution**: Triggered when a proposal is executed.

These events are essential for managing the lifecycle of auctions and proposals, updating the database, and triggering related business logic.

## Usage

To interact with the API, use tools like Postman or cURL. Ensure you have set up the environment variables correctly and the server is running.

Example request to create a new auction:
```bash
curl -X POST \
  http://localhost:3000/auction/create \
  -H 'Content-Type: application/json' \
  -d '{
        title: 'Auction Day 1',
        description: 'Auction Day 1 description',
        nftName: 'Goblin',
        nftDescription: 'Goblin description',
        nftImage: 'https://goblinsuinft.web.app/assets/img/goblin5.png',
      }'
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.