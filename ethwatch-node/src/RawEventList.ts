import { RawEvent } from './RawEvent'

export type RawEventList = {
	partitionKey: string
	events: RawEvent[]
}