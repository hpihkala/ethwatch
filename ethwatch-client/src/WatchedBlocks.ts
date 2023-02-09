import TypedEmitter from 'typed-emitter'
import { EthereumAddress } from 'streamr-client'
import EventEmitter from 'events'

type Events = {
	block: (blockNumber: number, publisherId: string) => void,
}

export class WatchedBlocks extends ((EventEmitter as unknown) as new () => TypedEmitter<Events>) {
	constructor() {
		super()
	}

	public handleEvent(blockNumber: number, publisherId: EthereumAddress) {
		this.emit('block', blockNumber, publisherId)
	}		
}