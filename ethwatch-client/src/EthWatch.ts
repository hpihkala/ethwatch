import { EthereumAddress, StreamrClient, Subscription } from 'streamr-client'
import WatchedContract from './WatchedContract'
import { RawEvent } from './RawEvent'

export default class EthWatch {
	private streamr: StreamrClient
	private chain: string
	private confidence: number
	private subPromisesByPartition: Promise<Subscription>[]
	private watchedContracts: Map<string, WatchedContract>

	constructor(chain: string, confidence: number = 0.5) {
		this.streamr = new StreamrClient()
		this.chain = chain
		this.confidence = confidence
		this.subPromisesByPartition = []
		this.watchedContracts = new Map<string, WatchedContract>()
	}

	public async watch(contractAddress: string, abi: object): Promise<WatchedContract> {
		const partition = 0 // TODO: compute

		// Don't subscribe to the same partition twice
		if (!this.subPromisesByPartition[partition]) {
			this.subPromisesByPartition[partition] = this.streamr.subscribe({
				streamId: `0x5b9f84566496425b5c6075f171a3d0fb87238df7/ethwatch/${this.chain}/events`,
				partition,
			}, (rawEvent, metadata) => {
				this.handleEvent(rawEvent as RawEvent, metadata.publisherId)
			})
		}
		await this.subPromisesByPartition[partition]

		if (this.watchedContracts.has(contractAddress.toLowerCase())) {
			throw new Error(`Already watching: ${contractAddress.toLowerCase()}`)
		} else {
			const contract = new WatchedContract(contractAddress.toLowerCase(), abi)
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
}