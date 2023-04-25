import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'
import styles from './EventItem.module.css'
import externalLinkImg from '../../images/external-link.svg'

import { blockExplorerByChain } from '../../config/presets'

export function EventItem({ id }: { id: string }) {
	const state = useAppSelector(selectEvents);
	const event = state.eventById[id]

	const openBlockExplorer = (transactionHash: string) => {
		window.open(`${blockExplorerByChain[state.activeSubscription?.chain || 'ethereum']}${transactionHash}`, '_blank')
	}

	const progressBarStyle = `rgba(${event.accepted ? 0 : 46}, ${event.accepted ? 46 : 0}, 0, 0.5)`
	const progressBarWidth = `${Math.round(100 * event.confirmations / state.seedNodes.length)}%`
	const quorumLinePosition = `${Math.round(100 * event.requiredConfirmations / state.seedNodes.length)}%`

  return (
		<li className={`${styles.eventItem} ${event.accepted ? styles.accepted : styles.notAccepted}`} 
			style={{ backgroundImage: `linear-gradient(to right, ${progressBarStyle}, ${progressBarStyle} ${progressBarWidth}, rgba(0,0,0,0) ${progressBarWidth}, rgba(0,0,0,0))` }}
			key={id} 
			onClick={() => openBlockExplorer(event.transactionHash)}>
			<div className={styles.quorumLine} style={{ left: quorumLinePosition}}></div>
			<div className={styles.eventName}>{event.name} (block #{event.block})<img src={externalLinkImg} className={styles.externalLinkIcon} alt=""/></div>
			<div className={styles.confirmations}>{`confirmations: ${event.confirmations}, required: ${event.requiredConfirmations}`}</div>
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
