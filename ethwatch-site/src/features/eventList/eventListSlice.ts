import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../app/store'
import { Event, RawEvent } from 'ethwatch-client'

import { presets } from '../../config/presets'

const MAX_SHOWN_EVENTS = 100

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

export interface BlockArgs {
	block: number
	publisherId: string
}

export interface SubscriptionArgs {
	chain: string
	contract: string
	abi: string
	quorum: string
}

export interface SubscriptionArgsPartial {
	name: keyof SubscriptionArgs
	value: string
}

export interface EventListState {
	inputs: SubscriptionArgs
	activeSubscription: SubscriptionArgs | undefined
	idList: string[]
	eventById: { [id: string]: ShownEvent }
	latestBlock?: number
	latestBlockSeen: { [id: string]: number }
	seedNodes: string[]
	errors: string[]
}

export const initialState: EventListState = {
	inputs: {
		chain: presets[0].chain,
		contract: presets[0].contract,
		abi: presets[0].abi,
		quorum: '0.5',
	},
	activeSubscription: undefined,
	idList: [],
	eventById: {},
	latestBlockSeen: {},
	errors: [],
	seedNodes: [],
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
		block: (state, action: PayloadAction<BlockArgs>) => {
			// Update latest block counter
			if (!state.latestBlock || state.latestBlock < action.payload.block) {
				state.latestBlock = action.payload.block
			}

			const latestBlockSeenByPublisher = state.latestBlockSeen[action.payload.publisherId.toLowerCase()]
			if (!latestBlockSeenByPublisher || latestBlockSeenByPublisher < action.payload.block) {
				state.latestBlockSeen[action.payload.publisherId.toLowerCase()] = action.payload.block
			}
		},
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
			const isWatchedContract = event.raw.address.toLowerCase() === state.activeSubscription?.contract.toLowerCase()

			// Event seen for the first time
			if (!state.eventById[id] && isWatchedContract) {
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
			} else if (isWatchedContract) {
				state.eventById[id].confirmations = event.confirmations.size
				state.eventById[id].accepted = event.accepted
			} else {
				console.log(`Got an event for a contract we're not watching: ${event.raw.address}`)
			}

			while (state.idList.length > MAX_SHOWN_EVENTS) {
				const removedId = state.idList.pop()
				// @ts-ignore
				delete state.eventById[removedId]
			}
		},
		error: (state, action: PayloadAction<any>) => {
			state.errors.push(action.payload.toString())
		},
		updateActiveSubscription: (state, action: PayloadAction<SubscriptionArgs>) => {
			state.activeSubscription = { ...state.activeSubscription, ...action.payload }

			// Clear event and seed node lists
			state.eventById = initialState.eventById
			state.idList = initialState.idList
			state.latestBlock = initialState.latestBlock
			state.latestBlockSeen = initialState.latestBlockSeen

			console.log('updateSubscription called')
		},
		updateInputs: (state, action: PayloadAction<SubscriptionArgsPartial>) => {
			state.inputs[action.payload.name] = action.payload.value
			console.log('updateInputs called')
		},
		setSeedNodes: (state, action: PayloadAction<string[]>) => {
			state.seedNodes = action.payload
			console.log(`Seed nodes: ${JSON.stringify(action.payload)}`)
		}
	},
});

function getKey(logEvent: RawEvent): string {
	// transactionHash and logIndex uniquely identify the event
	// address, topics, and data are included to guard against dishonest LogWatch nodes
	return `${logEvent.transactionHash}-${logEvent.logIndex}-${logEvent.address.toLowerCase()}-${JSON.stringify(logEvent.topics)}-${logEvent.data}`
}

export const { block, confirmation, error, updateActiveSubscription, updateInputs, setSeedNodes } = eventListSlice.actions;

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
