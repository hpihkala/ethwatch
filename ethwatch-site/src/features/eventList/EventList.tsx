import { EthWatch, WatchedBlocks } from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  error,
  updateSubscription,
  selectEvents,
  block,
  setSeedNodes,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';
import { SeedNode } from './SeedNode';
import { useRef } from 'react'

const ethWatch = new EthWatch({
	confidence: 1,
})
let currentlyWatching: string | undefined = undefined

export function EventList() {
  	const state = useAppSelector(selectEvents);
  	const dispatch = useAppDispatch();

	const chainRef = useRef<HTMLSelectElement>(null)
	const contractRef = useRef<HTMLInputElement>(null)
	const abiRef = useRef<HTMLTextAreaElement>(null)

	const syncWatcherWithState = async (contract: string, abi: string) => {
		console.log(`syncWatcherWithState: currentlyWatching: ${currentlyWatching}, contract: ${contract}`)
		const oldContract = currentlyWatching
		currentlyWatching = contract

		if (oldContract !== currentlyWatching) {
			// Unwatch the previous contract
			if (oldContract && ethWatch.isWatching(oldContract)) {
				await ethWatch.unwatch(oldContract)
			}

			try {
				const contract = await ethWatch.watch(currentlyWatching, abi)
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

	// Only run this upon initialization
	if (!currentlyWatching) {
		ethWatch.getSeedNodes().then((seedNodes) => dispatch(setSeedNodes(seedNodes)))
		syncWatcherWithState(state.contract, state.abi)
	}

	if (!ethWatch.isWatchingBlocks()) {
		ethWatch.watchBlocks().then((watchedBlocks: WatchedBlocks) => {
			watchedBlocks.on('block', (blockNumber: number, publisherId: string) => {
				dispatch(block({ block: blockNumber, publisherId }))
			})
		})
	}

	const handleClick = () => {
		const inputs = { 
			chain: chainRef.current?.value || '',
			contract: contractRef.current?.value || '',
			abi: abiRef.current?.value || '',
		}

		dispatch(updateSubscription(inputs))
		syncWatcherWithState(inputs.contract, inputs.abi)
	}

  return (
	<div className={styles.eventListWidget}>
		<table className={styles.settings}>
			<tbody>
				<tr>
					<td>Chain</td>
					<td>
						<select ref={chainRef} defaultValue={state.chain}>
							<option value="ethereum">Ethereum</option>
						</select>
					</td>
				</tr>
				<tr>
					<td>Contract</td>
					<td>
						<input ref={contractRef} type="text" defaultValue={state.contract}/>
					</td>
				</tr>
				<tr>
					<td>ABI</td>
					<td>
						<textarea ref={abiRef} defaultValue={state.abi}/>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						<button onClick={handleClick}>Apply</button>
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
