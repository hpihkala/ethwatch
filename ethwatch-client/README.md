# Look ma, no RPC!

EthWatch is a decentralized distribution network for EVM smart contract events. It allows apps to listen to events in a scalable and secure way, instead of polling a blockchain node via RPC or other centralized API.

EthWatch is great for oracles, bridges, and other blockchain-adjacent backends, as well as DEXes, DeFi pools, and other dapp frontends that wish to improve UX by displaying chain events in realtime.

EthWatch is currently heavily WIP. It shouldn't be relied on by anything valuable.

# Live playground

Check out a live demo [here](https://hpihkala.github.io/ethwatch/).

# Client

This is the JS library that web and node.js-based apps can use to subscribe to smart contract events via EthWatch.

## Installation

```
npm install ethwatch-client
```

## Usage

```
import { EthWatch } from 'ethwatch-client'

const ethWatch = new EthWatch({
	chain: 'ethereum'
})

ethWatch.watch(contractAddress, abi).then((contract) => {
	contract.on('event', (event) => {
		console.log(event.parsed)
	})
})
```

## Options

The `EthWatch` constructor options and their default values:

```
const ethWatch = new EthWatch({
	chain: 'ethereum',	// Name of the chain to connect to
	quorum: 0.5, 	// Between 0 and 1, this is the ratio of seed nodes that must report an event before it's passed to the application
})
```

## Future development
TODO: tests
TODO: handle changes in seed node set
TODO: ability to wait N block confirmations on top of events
TODO: optimize web package size (by only bringing in relevant modules of ethers?)
