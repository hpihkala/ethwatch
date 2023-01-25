import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'
import styles from './EventItem.module.css'

export function EventItem({ id }: { id: string }) {
	const state = useAppSelector(selectEvents);
	const event = state.eventById[id]

  return (
    <li className={`${styles.eventItem} ${event.accepted ? styles.accepted : styles.notAccepted}`} key={id}>
		<div className={styles.blockNumber}>#{event.block}</div>
		<div className={styles.eventName}>{event.name}</div>
		<div className={styles.confirmations}>{Math.round(event.confirmations/event.requiredConfirmations*100)}% confirmed</div>
		<table className={styles.args}>
			<tbody>
			{Object.keys(event.args).map((argName) => 
				<tr className={styles.arg} key={id + argName}>
					<td className={styles.argName}>{argName}</td>
					<td className={styles.argValue}>{event.args[argName]}</td>
				</tr>
			)}
			</tbody>
		</table>
    </li>
  );
}
