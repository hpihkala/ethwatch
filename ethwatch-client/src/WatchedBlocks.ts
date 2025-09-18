import TypedEmitter from 'typed-emitter'
import { HexString } from '@streamr/utils'
import EventEmitter from 'events'

type Events = {
	block: (blockNumber: number, publisherId: string) => void,
}

export class WatchedBlocks extends ((EventEmitter as unknown) as new () => TypedEmitter<Events>) {
	constructor() {
		super()
	}

	public handleEvent(blockNumber: number, publisherId: HexString) {
		this.emit('block', blockNumber, publisherId)
	}		
}