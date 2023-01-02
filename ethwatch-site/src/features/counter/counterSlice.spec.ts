import { Event } from 'ethwatch-client'
import counterReducer, {
  confirmation,
  initialState,
} from './counterSlice';

describe('counter reducer', () => {
  it('should handle initial state', () => {
    expect(counterReducer(undefined, { type: 'unknown' })).toDeepEqual(initialState);
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
			name: '',
			signature: '',
			args: new Map(),
			argsArray: []
		},
		confirmations: new Set(),
		accepted: false
	}
    const actual = counterReducer(initialState, confirmation(event))
    expect(actual.list.length).toEqual(1)
  });

});
