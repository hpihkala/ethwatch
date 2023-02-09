import { ethers } from 'ethers'
import TypedEmitter from 'typed-emitter'
import { EthereumAddress } from 'streamr-client'
import { Event } from './Event'
import { RawEvent } from './RawEvent'
import EventEmitter from 'events'
import { ParsedEvent } from './ParsedEvent'

type Events = {
	confirmation: (event: Event, publisherId: string) => void,
	event: (event: Event) => void,
	timeout: (event: Event) => void,
	error: (err: any) => void,
}

export class WatchedContract extends ((EventEmitter as unknown) as new () => TypedEmitter<Events>) {
	private readonly address: string
	private readonly abi: string
	private readonly requiredConfirmations: number
	private readonly totalSeedNodes: number
	private readonly eventByKey: Map<string, Event>
	private timeout: number

	constructor(address: string, abi: string, requiredConfirmations: number, totalSeedNodes: number, timeout: number = 60*1000) {
		super()
		this.address = address.toLowerCase()
		this.abi = abi
		this.requiredConfirmations = requiredConfirmations
		this.totalSeedNodes = totalSeedNodes
		this.timeout = timeout
		this.eventByKey = new Map()
	}

	public handleEvent(rawEvent: RawEvent, publisherId: EthereumAddress) {
		// Sanity check
		if (rawEvent.address.toLowerCase() !== this.address) {
			throw new Error(`Event with address ${rawEvent.address} got passed to WatchedContract with address ${this.address}, this is definitely a bug`)
		}

		const key = this.getKey(rawEvent)
		let event = this.eventByKey.get(key)
		try {
			if (!event) {
				event = {
					raw: rawEvent,
					parsed: this.parseRawEvent(rawEvent),
					confirmations: new Set(),
					accepted: false,
					requiredConfirmations: this.requiredConfirmations,
					totalSeedNodes: this.totalSeedNodes,
				}
				// Cleared after timeout
				this.eventByKey.set(key, event)
				setTimeout(() => this.timeoutEvent(key), this.timeout)
			}

			event.confirmations.add(publisherId)
			if (event.confirmations.size >= this.requiredConfirmations && !event.accepted) {
				this.acceptEvent(event)
			}
			this.emit('confirmation', event, publisherId)
		} catch (err) {
			console.error(err)
			this.emit('error', err)
		}
	}
	

	private getKey(logEvent: ethers.providers.Log): string {
		// transactionHash and logIndex uniquely identify the event
		// address, topics, and data are included to guard against dishonest LogWatch nodes
		return `${logEvent.transactionHash}-${logEvent.logIndex}-${logEvent.address.toLowerCase()}-${JSON.stringify(logEvent.topics)}-${logEvent.data}`
	}

	private acceptEvent(event: Event) {
		event.accepted = true
		this.emit('event', event)
		
		// @ts-ignore
		this.emit(event.parsed.name, event)
	}

	private timeoutEvent(key: string) {
		let event = this.eventByKey.get(key)
		this.eventByKey.delete(key)

		if (!event) {
			console.error(`Timed out ${key} but the event object is already gone - this is a bug!`)
		} else if (!event.accepted) {
			this.emit('timeout', event)
			console.error(`Timed out ${key} after ${this.timeout} ms with only ${event.confirmations.size}/${this.requiredConfirmations} confirmations`)
		}
	}

	private parseRawEvent(logEvent: ethers.providers.Log): ParsedEvent {
		let iface = new ethers.utils.Interface(this.abi)
		const logDescription = iface.parseLog(logEvent)
		return {
			name: logDescription.name,
			signature: logDescription.signature,
			args: this.getNamedArgs(logDescription),
			argsArray: this.getArgsArray(logDescription),
		}
	}

	private getNamedArgs(logEvent: ethers.utils.LogDescription) {
		const logArgsCopy = { ...logEvent.args }
		const args: any = {}
		for (let i=0;i<logEvent.args.length;i++) {
			delete logArgsCopy[i]
		}
		Object.keys(logArgsCopy).forEach((key) => {
			args[key] = logArgsCopy[key]
		})
		return args
	}

	private getArgsArray(logEvent: ethers.utils.LogDescription) {
		const logArgsCopy = [ ...logEvent.args ]
		return logArgsCopy
	}
	
}