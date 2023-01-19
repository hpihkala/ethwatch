import EthWatch from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  selectEvents,
} from './eventListSlice';
import styles from './EventList.module.css'
import { EventItem } from './EventItem';

const ethWatch = new EthWatch()
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
			contract.on('event', (event) => dispatch(confirmation(event)))  
		}).catch((err) => {
			console.error(err)
		})
	}

  return (
	<>
		Chain: 
		<select>
			<option value="ethereum">ethereum</option>
		</select><br/>
        
		Contract:
		<input type="text" defaultValue={state.contract}/>

		ABI:
		<textarea defaultValue={state.abi}/>

		<ul className={styles.eventList}>
			{state.idList.map((id) => <EventItem key={id} id={id} />)}
		</ul>
	</>
  );
}
