import { EthereumAddress, PermissionAssignment, Stream, StreamPermission, StreamrClient, Subscription, UserPermissionAssignment } from 'streamr-client'
import { keyToArrayIndex } from '@streamr/utils'
import * as memoize from 'memoizee'
import { WatchedContract } from './WatchedContract'
import { RawEvent } from './RawEvent'

type EthWatchOptions = {
	chain?: string,
	confidence?: number,
	streamr?: StreamrClient,
}

export class EthWatch {
	private streamr: StreamrClient
	private chain: string
	private confidence: number
	private subPromisesByPartition: Promise<Subscription>[]
	private watchedContracts: Map<string, WatchedContract>
	private getStream: () => Promise<Stream>
	private getPermissions: () => Promise<PermissionAssignment[]>
	private streamId: string

	constructor({ chain='ethereum', confidence=0.5, streamr=undefined }: EthWatchOptions = {}) {
		this.streamr = streamr || new StreamrClient({
			logLevel: 'warn',
		})
		this.chain = chain
		this.confidence = confidence
		this.subPromisesByPartition = []
		this.streamId = `0x5b9f84566496425b5c6075f171a3d0fb87238df7/ethwatch/${this.chain}/events`
		this.getStream = memoize(async () => {
			return await this.streamr.getStream(this.streamId)
		})
		this.getPermissions = memoize(async () => {
			const stream = await this.getStream()
			return stream.getPermissions()
		})
		this.watchedContracts = new Map<string, WatchedContract>()
	}

	public async watch(contractAddress: string, abi: string): Promise<WatchedContract> {
		// Using the same deterministic function used by the data publisher, compute
		// which partition number contains the event data for this contract address
		const partition = keyToArrayIndex((await this.getStream()).getMetadata().partitions, contractAddress.toLowerCase())

		// Don't subscribe to the same partition twice
		if (!this.subPromisesByPartition[partition]) {
			this.subPromisesByPartition[partition] = this.streamr.subscribe({
				streamId: this.streamId,
				partition,
			}, (rawEvent, metadata) => {
				this.handleEvent(rawEvent as RawEvent, metadata.publisherId)
			})
		}
		await this.subPromisesByPartition[partition]

		if (this.watchedContracts.has(contractAddress.toLowerCase())) {
			throw new Error(`Already watching: ${contractAddress.toLowerCase()}`)
		} else {
			// Count how many addresses have publish permission on this stream
			const permissions = await this.getPermissions()
			const nodesWithPublishPermission = permissions.filter((permission) => {
				return this.isUserPermission(permission) && permission.permissions.indexOf(StreamPermission.PUBLISH) >= 0
			})
			const requiredConfirmations = Math.ceil(nodesWithPublishPermission.length * this.confidence)
			const contract = new WatchedContract(contractAddress.toLowerCase(), abi, requiredConfirmations)
			this.watchedContracts.set(contractAddress.toLowerCase(), contract)
			return contract
		}
	}

	private handleEvent(event: RawEvent, publisherId: EthereumAddress) {
		const contract = this.watchedContracts.get(event.address.toLowerCase())
		if (contract) {
			contract.handleEvent(event, publisherId)
		} else {
			// Ignore events for contracts not watched
		}
	}

	private isUserPermission(permission: PermissionAssignment): permission is UserPermissionAssignment {
		return 'user' in permission
	}

}