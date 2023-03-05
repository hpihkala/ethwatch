import { EthWatch, WatchedBlocks } from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  error,
  updateActiveSubscription,
  updateInputs,
  selectEvents,
  block,
  setSeedNodes,
  SubscriptionArgs,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';
import { SeedNode } from './SeedNode';

import { defaultsByChain } from '../../config/defaultsByChain'

let ethWatch: EthWatch | undefined = undefined

const shallowCompare = (obj1: any, obj2: any) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(key => obj1[key] === obj2[key]);

export function EventList() {
  	const state = useAppSelector(selectEvents);
  	const dispatch = useAppDispatch();

	const syncWatcherWithState = async (oldArgs: SubscriptionArgs | undefined, args: SubscriptionArgs) => {
		console.log(`syncWatcherWithState`)

		if (oldArgs && oldArgs.chain !== args.chain) {
			console.log(`Chain changed! Old ${oldArgs?.chain}, New: ${args.chain}`)
			await ethWatch?.stop()
			ethWatch = undefined
		}

		if (!ethWatch) {
			console.log(`Initializing EthWatch`)
			ethWatch = new EthWatch({
				chain: args.chain,
				quorum: parseFloat(args.quorum),
			})
			ethWatch.getSeedNodes().then((seedNodes) => dispatch(setSeedNodes(seedNodes)))
		} else {
			ethWatch.setQuorum(parseFloat(args.quorum))
		}

		if (!ethWatch.isWatchingBlocks()) {
			console.log(`Subscribing to blocks on ${args.chain}`)
			ethWatch.watchBlocks().then((watchedBlocks: WatchedBlocks) => {
				watchedBlocks.on('block', (blockNumber: number, publisherId: string) => {
					dispatch(block({ block: blockNumber, publisherId }))
				})
			})
		}

		// Need to drop old contract?
		if (oldArgs && oldArgs.contract !== args.contract) {
			// Unwatch the previous contract
			if (oldArgs.contract && ethWatch.isWatching(oldArgs.contract)) {
				console.log(`Unwatching ${oldArgs.contract}`)
				await ethWatch.unwatch(oldArgs.contract)
			}
		}

		// Need to watch new contract?
		if (!ethWatch.isWatching(args.contract)) {
			try {
				console.log(`Watching ${args.contract}`)
				const contract = await ethWatch.watch(args.contract, args.abi)
				contract.on('confirmation', (event, publisherId) => {
					dispatch(confirmation({ event, publisherId }))
				})
				contract.on('error', (err: any) => {
					dispatch(error(err))
				})
			} catch (err) {
				console.error(err)
			}
		}
	}

	if (state.activeSubscription === undefined) {
		dispatch(updateActiveSubscription(state.inputs))
		// @ts-ignore
		syncWatcherWithState(undefined, state.inputs) 
	}

	const handleApply = () => {
		const oldSubscription = state.activeSubscription
		dispatch(updateActiveSubscription(state.inputs))
		syncWatcherWithState(oldSubscription, state.inputs)
	}

	const handleChainChange = (chain: string) => {
		const inputs: SubscriptionArgs = {
			...defaultsByChain[chain],
			chain,
			quorum: state.inputs.quorum,
		}

		dispatch(updateInputs({ name: 'chain', value: chain }))
		dispatch(updateInputs({ name: 'contract', value: inputs.contract }))
		dispatch(updateInputs({ name: 'abi', value: inputs.abi }))
	}

  	return (
	<div className={styles.eventListWidget}>
		<table className={styles.settings}>
			<tbody>
				<tr>
					<td>Chain</td>
					<td>
						<select value={state.inputs.chain} onChange={(e) => handleChainChange(e.target.value)}>
							<option value="ethereum">Ethereum</option>
							{/* <option value="polygon">Polygon</option> */}
						</select>
					</td>
				</tr>
				<tr>
					<td>Contract</td>
					<td>
						<input type="text" value={state.inputs.contract} onChange={(e) => dispatch(updateInputs({ name: 'contract', value: e.target.value }))}/>
					</td>
				</tr>
				<tr>
					<td>ABI</td>
					<td>
						<textarea value={state.inputs.abi} onChange={(e) => dispatch(updateInputs({ name: 'abi', value: e.target.value }))}/>
					</td>
				</tr>
				<tr>
					<td>Quorum</td>
					<td>
						<input type="text" value={state.inputs.quorum} onChange={(e) => dispatch(updateInputs({ name: 'quorum', value: e.target.value }))}/>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						<button className={shallowCompare(state.inputs, state.activeSubscription) ? styles.inactive : styles.active} onClick={handleApply}>Apply</button>
					</td>
				</tr>
			</tbody>
		</table>

		<ul className={styles.errorList}>
			{state.errors.map((err) => <li id={err}>{err}</li>)}
		</ul>

		{state.idList.length ?
			<ul className={styles.eventList}>
				{state.idList.map((id) => <EventItem key={id} id={id} />)}
			</ul>
			:
			<div>Waiting for magic to happen (peer connections)...</div>
		}

		<h2>Seed node status</h2>

		{state.latestBlock && <p>Block <strong>#{state.latestBlock}</strong> has been seen by <strong>{Object.values(state.latestBlockSeen).filter((value) => value === state.latestBlock).length}/{state.seedNodes.length || 1}</strong> seed nodes.</p>}

		<div className={styles.seedNodes}>
			{state.seedNodes.map((id) => <SeedNode key={id} id={id} />)}
		</div>
	</div>
  );
}
