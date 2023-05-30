import { ethers } from 'ethers'
require('dotenv').config()
import { StreamrClient } from 'streamr-client'
import { keyToArrayIndex } from '@streamr/utils'
import sleep from 'sleep-promise'
import { RawEvent } from './RawEvent'
import { WebSocketProvider } from './WebSocketProvider'
import { RawEventList } from './RawEventList'
const config = require('./config')
const log = require('./log')

const requiredEnvs = ['PRIVATE_KEY', 'CHAIN', 'RPC']
requiredEnvs.forEach((key) => {
	if (!process.env[key]) {
		throw new Error(`Required env variable not provided: ${key}`)
	}
})

const eventStreamId = `eth-watch.eth/${process.env.CHAIN}/events`
const blockStreamId = `eth-watch.eth/${process.env.CHAIN}/blocks`

const rpc: string = process.env.RPC || ''
const provider: ethers.providers.Provider = (rpc.startsWith('ws') ? new WebSocketProvider(rpc) : new ethers.providers.JsonRpcProvider(rpc))
const streamr: StreamrClient = new StreamrClient({
	auth: {
		privateKey: process.env.PRIVATE_KEY || '',
	},
	network: {
		// These don't actually control the buffer size, just the thresholds
        webrtcDatachannelBufferThresholdLow: 2 ** 21,
        webrtcDatachannelBufferThresholdHigh: 2 ** 25,

		// Streamr message queue size. If too small, produces "Message queue full, dropping message" errors
		webrtcSendBufferMaxMessageCount: 10000,
	}
})

const main = async () => {
	const eventStream = await streamr.getStream(eventStreamId)
	const blockStream = await streamr.getStream(blockStreamId)

	log(`Listening to ${process.env.CHAIN} via RPC ${process.env.RPC}`)
	log(`My seed node id is ${await streamr.getAddress()}`)

	let bytesSentPerMinute = 0

	setInterval(() => {
		log(`Total bytes sent per minute: ${bytesSentPerMinute}`)
		bytesSentPerMinute = 0
	}, 60 * 1000)

	provider.on('block', async (block: number) => {
		log(`Block ${block} observed`)
		const blockPayload = { block }

		// @ts-ignore
		const blockPayloadSize = Buffer.from(JSON.stringify(blockPayload, 'utf-8')).length
		bytesSentPerMinute += blockPayloadSize

		// Publish to block stream
		try {
			await streamr.publish(blockStream, blockPayload)
		} catch (err) {
			log(`ERROR: ${err}`)
		}

		// It's unlikely that a block wouldn't have any logs in it. However, sometimes the RPC returns
		// an empty array of logs when called soon after the block happened. Defend against that with
		// retry logic.
		let retry = 0
		let logs: ethers.providers.Log[] = []
		while (!logs.length && retry < 10) {
			try {
				logs = await provider.getLogs({
					fromBlock: block,
					toBlock: block,
				})
			} catch (err) {
				log(`ERROR: Error while getting logs for block ${block}: ${err}`)
			}
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
			logsByPartition[partition].events.push([
				logEvent.blockNumber, 							// 0
				logEvent.blockHash,								// 1
				logEvent.transactionIndex,						// 2
				logEvent.removed,								// 3
				logEvent.address,								// 4
				logEvent.data,									// 5
				logEvent.topics,								// 6
				logEvent.transactionHash,						// 7
				logEvent.logIndex,								// 8
			])
		})

		let payloadSizePerBlock = 0

		await Promise.all(Object.keys(logsByPartition).map(async (partition) => {
			const { events, partitionKey } = logsByPartition[partition]
			const eventsPayload: RawEventList = { e: events }

			// @ts-ignore
			const payloadSizeForPartition = Buffer.from(JSON.stringify(eventsPayload, 'utf-8')).length

			log(`Partition ${partition}: Observed ${events.length} events, payload bytes: ${payloadSizeForPartition}`)

			bytesSentPerMinute += payloadSizeForPartition
			payloadSizePerBlock += payloadSizeForPartition

			try {
				const message = await streamr.publish(eventStream, eventsPayload, { partitionKey })
				if (message.streamPartition.toString() !== partition) {
					log(`ERROR: precomputed stream partition (${partition}) doesn't match the partition computed by StreamrClient (${message.streamPartition})`)
				}
			} catch (err) {
				log(`ERROR: ${err}`)
			}
		}))

		log(`Total payload size for block ${block}: ${payloadSizePerBlock}`)
	})
}

main()
