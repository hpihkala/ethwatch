import EthWatch from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  error,
  updateSubscription,
  selectEvents,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';
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
		syncWatcherWithState(state.contract, state.abi)
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
							<option value="ethereum">ethereum</option>
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

		{state.latestBlock && <p>Block <strong>#{state.latestBlock}</strong> seen by <strong>{Object.keys(state.latestBlockSeenBy).length}/{state.totalSeedNodes}</strong> seed nodes</p>}

		<ul className={styles.errorList}>
			{state.errors.map((err) => <li id={err}>{err}</li>)}
		</ul>

		{state.idList.length ?
			<ul className={styles.eventList}>
				{state.idList.map((id) => <EventItem key={id} id={id} />)}
			</ul>
			:
			<div>Waiting for events...</div>
		}
	</div>
  );
}
