import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { Event, RawEvent } from 'ethwatch-client'

export interface ShownEvent {
	name: string
	address: string
	block: number
	args: { [name: string]: string }
	confirmations: number
	requiredConfirmations: number
	accepted: boolean
	transactionHash: string
}

export interface ConfirmationArgs {
	event: Event
	publisherId: string
}

export interface SubscriptionArgs {
	chain: string
	contract: string
	abi: string
}

export interface EventListState extends SubscriptionArgs {
	idList: string[]
	eventById: { [id: string]: ShownEvent }
	latestBlock?: number
	latestBlockSeenBy: { [id: string]: boolean }
	totalSeedNodes?: number
}

export const initialState: EventListState = {
	chain: 'ethereum',
	contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
	abi: '[{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]',
	idList: [],
	eventById: {},
	latestBlockSeenBy: {},
}

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
/*
export const incrementAsync = createAsyncThunk(
  'counter/fetchCount',
  async (amount: number) => {
	const response = await fetchCount(amount);
	// The value we return becomes the `fulfilled` action payload
	return response.data;
  }
);
*/

export const eventListSlice = createSlice({
	name: 'eventList',
	initialState,
	// The `reducers` field lets us define reducers and generate associated actions
	reducers: {
		confirmation: (state, action: PayloadAction<ConfirmationArgs>) => {
			// Redux Toolkit allows us to write "mutating" logic in reducers. It
			// doesn't actually mutate the state because it uses the Immer library,
			// which detects changes to a "draft state" and produces a brand new
			// immutable state based off those changes
			const event = action.payload.event

			// toString all the args from the original event to avoid non-serializable types like BigNumber
			const args: { [name: string]: string } = {}
			Object.keys(event.parsed.args).forEach((key) => {
				args[key] = event.parsed.args[key].toString()
			})

			const id = getKey(event.raw)

			// Event seen for the first time
			if (!state.eventById[id]) {
				state.idList.unshift(id)
				state.eventById[id] = {
					name: event.parsed.name,
					address: event.raw.address,
					block: event.raw.blockNumber,
					confirmations: event.confirmations.size,
					accepted: event.accepted,
					requiredConfirmations: event.requiredConfirmations,
					args,
					transactionHash: event.raw.transactionHash,
				}
			} else {
				state.eventById[id].confirmations = event.confirmations.size
				state.eventById[id].accepted = event.accepted
			}

			while (state.idList.length > 20) {
				const removedId = state.idList.pop()
				// @ts-ignore
				delete state.eventById[removedId]
			}

			// Update latest block counter
			if (!state.latestBlock || state.latestBlock < event.raw.blockNumber) {
				state.latestBlock = event.raw.blockNumber
				state.totalSeedNodes = event.totalSeedNodes
				state.latestBlockSeenBy = {}
			}

			state.latestBlockSeenBy[action.payload.publisherId] = true
		},
		updateSubscription: (state, action: PayloadAction<SubscriptionArgs>) => {
			state.chain = action.payload.chain
			state.contract = action.payload.contract
			state.abi = action.payload.abi
		},
	},
});

function getKey(logEvent: RawEvent): string {
	// transactionHash and logIndex uniquely identify the event
	// address, topics, and data are included to guard against dishonest LogWatch nodes
	return `${logEvent.transactionHash}-${logEvent.logIndex}-${logEvent.address.toLowerCase()}-${JSON.stringify(logEvent.topics)}-${logEvent.data}`
}

export const { confirmation, updateSubscription } = eventListSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectEvents = (state: RootState) => state.events;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
/*
export const incrementIfOdd =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
	const currentValue = selectCount(getState());
	if (currentValue % 2 === 1) {
	  dispatch(incrementByAmount(amount));
	}
  };
*/

export default eventListSlice.reducer;
