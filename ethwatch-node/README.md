# Look ma, no RPC!

EthWatch is a decentralized distribution network for EVM smart contract events. It allows apps to listen to events in a scalable and secure way, instead of polling a blockchain node via RPC or other centralized API.

EthWatch is great for oracles, bridges, and other blockchain-adjacent backends, as well as DEXes, DeFi pools, and other dapp frontends that wish to improve UX by displaying chain events in realtime.

EthWatch is currently heavily WIP. It shouldn't be relied on by anything valuable.

# Live playground

Check out a live demo [here](https://ethwatch.live).

# ethwatch-node

This is the program that seed nodes run to bridge smart contract events from an RPC to the EthWatch network.

## Installation

```
npm install -g ethwatch-node
```

Create a `.env` file with the following content:

```
CHAIN=ethereum
RPC=... # The URL to the RPC you use
PRIVATE_KEY=... # The Ethereum private key of your node
```

Then start your node by giving the command `ethwatch-node`

## How to participate?

The default set of seed nodes is run by reputable volunteers in the web3 space. If you'd like to participate in running EthWatch, please [get in touch](https://twitter.com/henripihkala).
