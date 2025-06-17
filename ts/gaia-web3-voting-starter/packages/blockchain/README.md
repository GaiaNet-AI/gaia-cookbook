# Voting Smart Contract

A decentralized voting system implemented using smart contracts on the Linea blockchain.

## Prerequisites

- Node.js installed
- Hardhat development environment
- A wallet with some test ETH on Linea Testnet
- Alchemy API key (get it from [Alchemy](https://www.alchemy.com/))
- Wallet private key

## Setup

1. Configure environment variables:
```bash
cp .env.example .env
```
Then edit `.env` file with:
- `ALCHEMY_API_KEY`: Your Alchemy API key (create one at [alchemy.com](https://www.alchemy.com/))
- `ACCOUNT_PRIVATE_KEY`: Your wallet private key (without 0x prefix)

2. Compile the contracts:
```bash
npx hardhat compile
```

## Deployment

To deploy the voting factory contract to Linea Testnet: (You can configure for any of your choice L2)

```bash
npx hardhat ignition deploy ignition/modules/votingFactory.ts --network linea-testnet
```

## Contract Architecture

- `VotingFactory`: Main factory contract that deploys individual voting instances
- `VotingBase`: Base contract for each voting instance

## Development

For local development and testing:

1. Start local hardhat node:
```bash
npx hardhat node
```

2. Run tests:
```bash
npx hardhat test
```

## Networks

- **Linea Testnet**

  - Explorer: https://sepolia.lineascan.build/

