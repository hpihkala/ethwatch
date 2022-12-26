function formatArgs(logArgs) {
	const logArgsCopy = { ...logArgs }
	const args = {}
	for (let i=0;i<logArgs.length;i++) {
		delete logArgsCopy[i]
	}
	Object.keys(logArgsCopy).forEach((key) => {
		const val = logArgsCopy[key]
		args[key] = val.toString()
	})
	return args
}

/**
 {
  blockNumber: 15514490,
  blockHash: '0x68e47a75ec0047f38709981d3dcb781f066b6c004961fb0a41e893a6043d4f8c',
  transactionIndex: 141,
  removed: false,
  address: '0x9862F120da5b92a767Cc981dbbf60126a76d2009',
  data: '0x',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x000000000000000000000000efa9bebe299de7acaeca6876e1e4f5508eeef2db',
    '0x0000000000000000000000000000000000000000000000000000000000000ece'
  ],
  transactionHash: '0xf5e6eaf75a5b72a4dde96c983031fe53a286a83cf4bf383f7fca8cda42518298',
  logIndex: 223
}
 */
async function handleLogEntry(logEvent: ethers.providers.Log) {
	let iface = new ethers.utils.Interface(abi)
	try {
		/**
		 LogDescription {
			eventFragment: {
				name: 'Transfer',
				anonymous: false,
				inputs: [ [ParamType], [ParamType], [ParamType] ],
				type: 'event',
				_isFragment: true,
				constructor: [Function: EventFragment] {
				from: [Function (anonymous)],
				fromObject: [Function (anonymous)],
				fromString: [Function (anonymous)],
				isEventFragment: [Function (anonymous)]
				},
				format: [Function (anonymous)]
			},
			name: 'Transfer',
			signature: 'Transfer(address,address,uint256)',
			topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
			args: [
				'0x00C43AfAb39a2a0A17703AC96bA5aE8Bb5890a49',
				'0x5e172D6e7C0f28347f65F666C90102636589cA3B',
				BigNumber { _hex: '0x3dc2405100', _isBigNumber: true },
				from: '0x00C43AfAb39a2a0A17703AC96bA5aE8Bb5890a49',
				to: '0x5e172D6e7C0f28347f65F666C90102636589cA3B',
				value: BigNumber { _hex: '0x3dc2405100', _isBigNumber: true }
			]
			}
		*/
		let logDescription = iface.parseLog(logEvent)

		const result = {
			blockNumber: logEvent.blockNumber,
			transactionHash: logEvent.transactionHash,
			address: logEvent.address,
			event: {
				name: logDescription.name,
				signature: logDescription.signature,
				args: formatArgs(logDescription.args),
			}
		}
		
		//log(`SUCCESS: ${JSON.stringify(result)}`)
		stats.successes += 1

	} catch (err) {
		//log(`ERROR: Event not found in ABI for address ${logEvent.address} topic ${topics[0]}`)
		stats.eventNotInAbi += 1
	}
}
