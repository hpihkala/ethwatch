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
export type ParsedEvent = {
	name: string
	signature: string
	args: { [name: string]: any }
	argsArray: Array<any>

	blockNumber: number
	blockHash: string
	transactionIndex: number
	removed: boolean
	address: string
	data: string
	topics: string[]
	transactionHash: string
	logIndex: number
}