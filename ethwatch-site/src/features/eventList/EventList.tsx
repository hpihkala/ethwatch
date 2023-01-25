import EthWatch from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  selectEvents,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';

const ethWatch = new EthWatch({
	confidence: 1,
})
let watchCalledFor: string | undefined

export function EventList() {
  const state = useAppSelector(selectEvents);
  const dispatch = useAppDispatch();

  if (!watchCalledFor) {
	watchCalledFor = state.contract
	console.log('Calling ethWatch.watch()')
	ethWatch.watch(state.contract, state.abi)
		.then((contract) => {
			console.log('Calling contract.on()')
			contract.on('confirmation', (event, publisherId) => dispatch(confirmation({ event, publisherId })))  
		}).catch((err) => {
			console.error(err)
		})
	}

  return (
	<div className={styles.eventListWidget}>
		<table className={styles.settings}>
			<tbody>
				<tr>
					<td>Chain</td>
					<td>
						<select>
							<option value="ethereum">ethereum</option>
						</select>
					</td>
				</tr>
				<tr>
					<td>Contract</td>
					<td>
						<input type="text" defaultValue={state.contract}/>
					</td>
				</tr>
				<tr>
					<td>ABI</td>
					<td>
						<textarea defaultValue={state.abi}/>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						<button>Look ma, no RPC!</button>
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
