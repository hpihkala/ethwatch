import { ethers } from 'ethers'
require('dotenv').config()
import { StreamrClient } from 'streamr-client'
const config = require('./config')
const log = require('./log')

const requiredEnvs = ['PRIVATE_KEY', 'CHAIN', 'RPC']
requiredEnvs.forEach((key) => {
	if (!process.env[key]) {
		throw new Error(`Required env variable not provided: ${key}`)
	}
})

const eventStreamId = `0x5b9f84566496425b5c6075f171a3d0fb87238df7/ethwatch/${process.env.CHAIN}/events`
const blockStreamId = `0x5b9f84566496425b5c6075f171a3d0fb87238df7/ethwatch/${process.env.CHAIN}/blocks`

const provider: ethers.providers.Provider = new ethers.providers.JsonRpcProvider(process.env.RPC || '')
const streamr: StreamrClient = new StreamrClient({
	auth: {
		privateKey: process.env.PRIVATE_KEY || '',
	}
})

const main = async () => {
	const eventStream = await streamr.getStream(eventStreamId)
	const blockStream = await streamr.getStream(blockStreamId)

	log(`Listening to ${process.env.CHAIN} via RPC ${process.env.RPC}`)

	provider.on('block', async (block: number) => {
		log(`Block ${block} observed`)
		try {
			await streamr.publish(blockStream, {
				block,
			})
		} catch (err) {
			log(`ERROR: ${err}`)
		}
	})

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
	provider.on({}, async (logEvent: ethers.providers.Log) => {
		log(`Observed event in contract ${logEvent.address.toLowerCase()}, block ${logEvent.blockNumber}, index ${logEvent.transactionIndex}`)
		try {
			await streamr.publish(eventStream, logEvent, {
				// Select stream partition based on contract address
				partitionKey: logEvent.address.toLowerCase(),
			})
		} catch (err) {
			log(`ERROR: ${err}`)
		}
	})
}

main()
