import { ethers } from 'ethers'
import TypedEmitter from 'typed-emitter'
import { EthereumAddress } from 'streamr-client'
import { EventState } from './EventState'
import { RawEvent } from './RawEvent'
import * as EventEmitter from 'events'

type Events = {
	confirmation: (state: EventState, publisherId: string) => void,
	event: (state: EventState) => void,
	timeout: (state: EventState) => void,
}

export default class WatchedContract extends (EventEmitter as unknown as new () => TypedEmitter<Events>) {
	private readonly address: string
	private readonly abi: string
	private readonly requiredConfirmations: number
	private readonly eventStateByKey: Map<string, EventState>
	private timeout: number

	constructor(address: string, abi: string, requiredConfirmations: number, timeout: number = 60*1000) {
		super()
		this.address = address.toLowerCase()
		this.abi = abi
		this.requiredConfirmations = requiredConfirmations
		this.timeout = timeout
		this.eventStateByKey = new Map()
	}

	public handleEvent(event: RawEvent, publisherId: EthereumAddress) {
		// Sanity check
		if (event.address.toLowerCase() !== this.address) {
			throw new Error(`Event with address ${event.address} got passed to WatchedContract with address ${this.address}, this is definitely a bug`)
		}

		const key = this.getKey(event)
		let state = this.eventStateByKey.get(key)
		if (!state) {
			state = {
				raw: event,
				parsed: this.parseRawEvent(event),
				confirmations: new Set(),
				timeout: setTimeout(() => this.timeoutEvent(key), this.timeout),
			}
			// Cleared in either timeoutEvent or acceptEvent
			this.eventStateByKey.set(key, state)
		}

		state.confirmations.add(publisherId)
		this.emit('confirmation', state, publisherId)

		if (state.confirmations.size >= this.requiredConfirmations) {
			this.acceptEvent(key, state)
		}
	}

	private getKey(logEvent: ethers.providers.Log): string {
		// transactionHash and logIndex uniquely identify the event
		// address, topics, and data are included to guard against dishonest LogWatch nodes
		return `${logEvent.transactionHash}-${logEvent.logIndex}-${logEvent.address.toLowerCase()}-${JSON.stringify(logEvent.topics)}-${logEvent.data}`
	}

	private acceptEvent(key: string, state: EventState) {
		this.eventStateByKey.delete(key)
		clearTimeout(state.timeout)
		this.emit('event', state)
		
		// @ts-ignore
		this.emit(state.parsed.name, state)
	}

	private timeoutEvent(key: string) {
		let state = this.eventStateByKey.get(key)
		if (state) {
			this.eventStateByKey.delete(key)
			this.emit('timeout', state)
			console.error(`Timed out ${key} after ${this.timeout} ms with only ${state.confirmations.size}/${this.requiredConfirmations} confirmations`)
		} else {
			console.error(`Timed out ${key} but the state object is already gone - this is probably a bug`)
		}
	}

	private parseRawEvent(logEvent: ethers.providers.Log): ethers.utils.LogDescription {
		let iface = new ethers.utils.Interface(this.abi)
		return iface.parseLog(logEvent)
	}	
	
}