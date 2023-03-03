import { EthereumAddress, PermissionAssignment, Stream, StreamPermission, StreamrClient, StreamrClientConfig, Subscription, UserPermissionAssignment } from 'streamr-client'
import { keyToArrayIndex } from '@streamr/utils'
import memoize from 'memoizee'
import { WatchedContract } from './WatchedContract'
import { RawEventList } from './RawEventList'
import { WatchedBlocks } from './WatchedBlocks'
import { BlockEvent } from './BlockEvent'

type EthWatchOptions = {
	chain?: string,
	confidence?: number,
	streamr?: StreamrClient,
	streamrClientConfig?: StreamrClientConfig
}

const streamrClientDefaultConfig: StreamrClientConfig = {
	logLevel: 'warn',
	network: {
		webrtcDatachannelBufferThresholdLow: 2 ** 17,
		webrtcDatachannelBufferThresholdHigh: 2 ** 19,
		webrtcSendBufferMaxMessageCount: 10000,
	}
}

export class EthWatch {
	private streamr: StreamrClient
	private chain: string
	private confidence: number
	private partitionState: Array<{ subscriptionPromise: Promise<Subscription>, watchedContractsByAddress: { [address: string]: WatchedContract }}>
	private watchedContracts: { [address: string]: WatchedContract }
	private getBlockStream: () => Promise<Stream>
	private getEventStream: () => Promise<Stream>
	private getEventStreamPermissions: () => Promise<PermissionAssignment[]>
	private eventStreamId: string
	private blockStreamId: string
	private watchedBlocks: WatchedBlocks | undefined

	constructor({ chain='ethereum', confidence=0.5, streamr=undefined, streamrClientConfig=streamrClientDefaultConfig }: EthWatchOptions = {}) {
		this.streamr = streamr || new StreamrClient(streamrClientConfig)
		this.chain = chain
		this.confidence = confidence
		this.partitionState = []
		this.watchedContracts = {}
		this.eventStreamId = `eth-watch.eth/${this.chain}/events`
		this.blockStreamId = `eth-watch.eth/${this.chain}/blocks`
		this.getEventStream = memoize(async () => {
			return await this.streamr.getStream(this.eventStreamId)
		})
		this.getEventStreamPermissions = memoize(async () => {
			const stream = await this.getEventStream()
			return stream.getPermissions()
		})
		this.getBlockStream = memoize(async () => {
			return await this.streamr.getStream(this.blockStreamId)
		})
	}

	private async getPartition(contractAddress: string) {
		const lowerCasedAddress = contractAddress.toLowerCase()
		return keyToArrayIndex((await this.getEventStream()).getMetadata().partitions, lowerCasedAddress)
	}

	public async watchBlocks(): Promise<WatchedBlocks> {
		if (!this.watchedBlocks) {
			this.watchedBlocks = new WatchedBlocks()

			await this.streamr.subscribe({
				streamId: this.blockStreamId
			}, (content, metadata) => {
				this.watchedBlocks?.handleEvent((content as BlockEvent).block, metadata.publisherId)
			})
			return this.watchedBlocks
		} else {
			throw new Error('Already watching blocks!')
		}
	}

	public isWatchingBlocks(): boolean {
		return this.watchedBlocks !== undefined
	}

	public async unwatchBlocks(): Promise<void> {
		if (this.watchedBlocks) {
			this.watchedBlocks = undefined
			await this.streamr.unsubscribe(this.blockStreamId)
		} else {
			throw new Error('Not watching blocks!')
		}
	}

	public async watch(contractAddress: string, abi: string): Promise<WatchedContract> {
		const lowerCasedAddress = contractAddress.toLowerCase()

		// Using the same deterministic function used by the data publisher, compute
		// which partition number contains the event data for this contract address
		const partition = await this.getPartition(lowerCasedAddress)
		
		// Count how many addresses have publish permission on this stream
		const seedNodes = await this.getSeedNodes()

		// Don't subscribe to the same partition twice
		if (!this.partitionState[partition]) {
			console.log(`Subscribing to partition ${partition}`)
			const subscriptionPromise = this.streamr.subscribe({
				streamId: this.eventStreamId,
				partition,
			}, (rawEventList, metadata) => {
				if ((rawEventList as RawEventList).events) {
					this.handleEvents(rawEventList as RawEventList, metadata.publisherId)
				} else {
					console.log(`WARN: received message with no 'events' field: ${JSON.stringify(rawEventList)}`)
				}
			})

			this.partitionState[partition] = {
				subscriptionPromise,
				watchedContractsByAddress: {}
			}
		}

		// Don't subscribe to the same contract twice
		if (this.partitionState[partition].watchedContractsByAddress[lowerCasedAddress]) {
			throw new Error(`Already watching: ${lowerCasedAddress}`)
		} else {
			console.log(`Creating WatchedContract for ${lowerCasedAddress}`)
			const requiredConfirmations = Math.ceil(seedNodes.length * this.confidence)
			const contract = new WatchedContract(lowerCasedAddress, abi, requiredConfirmations, seedNodes.length)
			this.partitionState[partition].watchedContractsByAddress[lowerCasedAddress] = contract
			this.watchedContracts[lowerCasedAddress] = contract

			// Wait for the subscription to succeed before resolving
			await this.partitionState[partition].subscriptionPromise
			return contract
		}
	}

	public isWatching(contractAddress: string): boolean {
		return this.watchedContracts[contractAddress.toLowerCase()] !== undefined
	}

	public async unwatch(contractAddress: string) {
		const lowerCasedAddress = contractAddress.toLowerCase()
		console.log(`Unwatching ${lowerCasedAddress}`)

		const partition = await this.getPartition(lowerCasedAddress)

		if (!this.partitionState[partition].watchedContractsByAddress[lowerCasedAddress]) {
			throw new Error(`Tried to unwatch a contract you're not watching: ${lowerCasedAddress}`)
		} else {
			const contract = this.partitionState[partition].watchedContractsByAddress[lowerCasedAddress]
			delete this.partitionState[partition].watchedContractsByAddress[lowerCasedAddress]
			delete this.watchedContracts[lowerCasedAddress]
		}

		// Clean up the partition subscription if no more subscribed contracts in that partition
		if (Object.keys(this.partitionState[partition].watchedContractsByAddress).length === 0) {
			console.log(`No more contracts listening for events in partition ${partition}, unsubscribing`)
			const subscription = await this.partitionState[partition].subscriptionPromise
			await this.streamr.unsubscribe(subscription)
			delete this.partitionState[partition]
		}
	}

	private handleEvents(events: RawEventList, publisherId: EthereumAddress) {
		events.events.forEach((event) => {
			const contract = this.watchedContracts[event.address.toLowerCase()]
			if (contract) {
				contract.handleEvent(event, publisherId)
			} else {
				// Ignore events for contracts not watched
			}
		})
	}

	private isUserPermission(permission: PermissionAssignment): permission is UserPermissionAssignment {
		return 'user' in permission
	}

	public async getSeedNodes(): Promise<string[]> {
		const permissions = await this.getEventStreamPermissions()
		const nodesWithPublishPermission: string[] = []
		permissions.forEach(permission => {
			if (this.isUserPermission(permission) && permission.permissions.indexOf(StreamPermission.PUBLISH) >= 0) {
				nodesWithPublishPermission.push(permission.user)
			}
		})
		return nodesWithPublishPermission
	}

}