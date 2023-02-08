# EthWatch client

## Installation

```
npm install --save ethwatch-client
```

## Usage

```
import { EthWatch } from 'ethwatch-client'
const ethWatch = new EthWatch() // see options section

const contract = await ethWatch.watch(contractAddress, abi)

contract.on('event', ({ parsed, raw }}) {
	console.log(`Event fired in ${contractAddress}: ${parsed.name}`)
})
```

You can also listen to events by name (note that this pattern can't be type checked when used in TypeScript):

```
contract.on('Transfer', ({ parsed, raw }}) {
	console.log(`Event fired in ${contractAddress}: ${parsed.name}`)
})
```

## Options

The `EthWatch` constructor options and their default values:

```
const ethWatch = new EthWatch({
	chain: 'ethereum',	// Name of the chain to connect to
	confidence: 0.5, 	// Ratio of nodes that must agree on an event before it's passed to the application
})
```

## Future development
TODO: tolerance for websocket rpc connection failure
TODO: check usage example above
TODO: tests
TODO: handle changes in publisher set
TODO: ability to wait N block confirmations on top of events
TODO: Optimize web package size by only bringing in relevant modules of ethers?
