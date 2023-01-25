import { ethers } from 'ethers'
require('dotenv').config()
import { StreamrClient } from 'streamr-client'
import { keyToArrayIndex } from '@streamr/utils'
import sleep from 'sleep-promise'
import { RawEvent } from './RawEvent'
import { RawEventList } from './RawEventList'
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

const rpc: string = process.env.RPC || ''
const provider: ethers.providers.Provider = (rpc.startsWith('ws') ? new ethers.providers.WebSocketProvider(rpc) : new ethers.providers.JsonRpcProvider(rpc))
const streamr: StreamrClient = new StreamrClient({
	auth: {
		privateKey: process.env.PRIVATE_KEY || '',
	},
	network: {
        webrtcDatachannelBufferThresholdLow: 2 ** 17,
        webrtcDatachannelBufferThresholdHigh: 2 ** 19,
		webrtcSendBufferMaxMessageCount: 10000,
	}
})

const main = async () => {
	const eventStream = await streamr.getStream(eventStreamId)
	const blockStream = await streamr.getStream(blockStreamId)

	log(`Listening to ${process.env.CHAIN} via RPC ${process.env.RPC}`)
	log(`My seed node id is ${await streamr.getAddress()}`)

	provider.on('block', async (block: number) => {
		log(`Block ${block} observed`)

		// Publish to block stream
		try {
			await streamr.publish(blockStream, {
				block,
			})
		} catch (err) {
			log(`ERROR: ${err}`)
		}


		// It's unlikely that a block wouldn't have any logs in it. However, sometimes the RPC returns
		// an empty array of logs when called soon after the block happened. Defend against that with
		// retry logic.
		let retry = 0
		let logs: ethers.providers.Log[] = []
		while (!logs.length && retry < 10) {
			logs = await provider.getLogs({
				fromBlock: block,
				toBlock: block,
			})
			if (!logs.length) {
				retry++
				log(`Failed to get any logs for block ${block}. Attempt ${retry}`)
				await sleep(1 * 1000)
			}
		}

		// Split the long list of log events into bundles per stream partition
		const logsByPartition: { [partition: string]: { partitionKey: string, events: RawEvent[] } } = {}

		logs.forEach(logEvent => {
			const partitionKey = logEvent.address.toLowerCase()
			const partition = keyToArrayIndex(eventStream.getMetadata().partitions, partitionKey).toString()
			if (!logsByPartition[partition]) {
				logsByPartition[partition] = {
					partitionKey,
					events: []
				}
			}
			logsByPartition[partition].events.push({
				blockNumber: logEvent.blockNumber,
				blockHash: logEvent.blockHash,
				transactionIndex: logEvent.transactionIndex,
				removed: logEvent.removed,
				address: logEvent.address,
				data: logEvent.data,
				topics: logEvent.topics,
				transactionHash: logEvent.transactionHash,
				logIndex: logEvent.logIndex,
			})
		})

		await Promise.all(Object.keys(logsByPartition).map(async (partition) => {
			const { events, partitionKey } = logsByPartition[partition]
			log(`Partition ${partition}: Observed ${events.length} events`)

			try {
				const message = await streamr.publish(eventStream, {
					events,
				}, {
					partitionKey,
				})
				if (message.streamPartition.toString() !== partition) {
					log(`ERROR: precomputed stream partition (${partition}) doesn't match the partition computed by StreamrClient (${message.streamPartition})`)
				}
			} catch (err) {
				log(`ERROR: ${err}`)
			}
		}))
	})
}

main()
