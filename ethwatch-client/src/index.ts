import { EthWatch } from './EthWatch'

if (window) {
	// @ts-ignore
	window.EthWatch = EthWatch
}

export * from './EthWatch'
export * from './Event'
export * from './WatchedContract'
export * from './ParsedEvent'
export * from './RawEvent'
