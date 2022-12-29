# EthWatch client

## Usage:

```
import { EthWatch } from 'ethwatch-client'
const ethWatch = new EthWatch()

ethWatch.watch(contractAddress, abi, ['EventName'], (event) => {
	// Do something with the parsed and validated event
})
```

TODO: required confirmations
TODO: fix usage example above
TODO: partition computation
TODO: tests
TODO: better interface contract.on('Transfer')