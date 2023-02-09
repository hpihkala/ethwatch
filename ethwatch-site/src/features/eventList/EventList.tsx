import EthWatch from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  updateSubscription,
  selectEvents,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';
import { useRef } from 'react'

const ethWatch = new EthWatch({
	confidence: 1,
})
let watchCalledFor: string | undefined

export function EventList() {
  	const state = useAppSelector(selectEvents);
  	const dispatch = useAppDispatch();

	const chainRef = useRef<HTMLSelectElement>(null)
	const contractRef = useRef<HTMLInputElement>(null)
	const abiRef = useRef<HTMLTextAreaElement>(null)

	const syncWatcherWithState = async () => {
		if (!watchCalledFor || watchCalledFor !== state.contract) {
			// TODO: unwatch previous one

			watchCalledFor = state.contract
			console.log(`Calling ethWatch.watch(${state.contract})`)
			try {
				const contract = await ethWatch.watch(state.contract, state.abi)
				console.log('Calling contract.on()')
				contract.on('confirmation', (event, publisherId) => dispatch(confirmation({ event, publisherId })))  
			} catch (err) {
				console.error(err)
			}
		}
	}
	// Execute immediately on load
	syncWatcherWithState()

	const handleClick = () => {
		dispatch(updateSubscription({ 
			chain: chainRef.current?.value || '',
			contract: contractRef.current?.value || '',
			abi: abiRef.current?.value || '',
		}))
		syncWatcherWithState()
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
						<button onClick={handleClick}>Look ma, no RPC!</button>
					</td>
				</tr>
			</tbody>
		</table>

		{state.latestBlock && <p>Block <strong>#{state.latestBlock}</strong> seen by <strong>{Object.keys(state.latestBlockSeenBy).length}/{state.totalSeedNodes}</strong> seed nodes</p>}

		<ul className={styles.eventList}>
			{state.idList.map((id) => <EventItem key={id} id={id} />)}
		</ul>
	</div>
  );
}
