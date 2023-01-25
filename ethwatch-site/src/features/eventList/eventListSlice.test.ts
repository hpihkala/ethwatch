import { Event } from 'ethwatch-client'
import eventListReducer, {
  confirmation,
  initialState,
} from './eventListSlice';

describe('eventList reducer', () => {
  it('should handle initial state', () => {
    expect(eventListReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should add new event', () => {
	const event: Event = {
		raw: {
			blockNumber: 0,
			blockHash: '',
			transactionIndex: 0,
			removed: false,
			address: '',
			data: '',
			topics: [],
			transactionHash: '',
			logIndex: 0
		},
		parsed: {
			name: 'foo',
			signature: '',
			args: new Map(),
			argsArray: []
		},
		confirmations: new Set(),
		accepted: false,
		requiredConfirmations: 5,
		totalSeedNodes: 10,
	}
    const actual = eventListReducer(initialState, confirmation({ event, publisherId: 'testPublisher' }))
    expect(actual.idList.length).toEqual(1)
	expect(actual.eventById[actual.idList[0]]).toEqual('foo')
  });

});
