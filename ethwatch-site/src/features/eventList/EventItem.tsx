import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'
import styles from './EventItem.module.css'
import externalLinkImg from '../../images/external-link.svg'

const blockExplorerUrl = 'https://etherscan.io/tx/'

export function EventItem({ id }: { id: string }) {
	const state = useAppSelector(selectEvents);
	const event = state.eventById[id]

	const openBlockExplorer = (transactionHash: string) => {
		window.open(blockExplorerUrl + transactionHash, '_blank')
	}

  return (
		<li className={`${styles.eventItem} ${event.accepted ? styles.accepted : styles.notAccepted}`} key={id} onClick={() => openBlockExplorer(event.transactionHash)}>
			<div className={styles.blockNumber}>#{event.block}</div>
			<div className={styles.eventName}>{event.name} <img src={externalLinkImg} className={styles.externalLinkIcon} alt=""/></div>
			<div className={styles.confirmations}>{Math.round(event.confirmations/event.requiredConfirmations*100)}% confirmed</div>
			<table className={styles.args}>
				<tbody>
				{Object.keys(event.args).map((argName) => 
					<tr key={id + argName}>
						<td>{argName}</td>
						<td>{event.args[argName]}</td>
					</tr>
				)}
				</tbody>
			</table>
		</li>
  )
}
