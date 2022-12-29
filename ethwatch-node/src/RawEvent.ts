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
export type RawEvent = {
	blockNumber: number
	blockHash: string
	transactionIndex: number
	removed: boolean
	address: string
	data: string
	topics: string[],
	transactionHash: string
	logIndex: number
}