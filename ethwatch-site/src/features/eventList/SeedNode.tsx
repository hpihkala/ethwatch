import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'

import styles from './SeedNode.module.css'
import * as seedNodeMetadata from '../../config/seedNodeMetadata.json'

export function SeedNode({ id, blocksToShow }: { id: string, blocksToShow: number[] }) {
	const state = useAppSelector(selectEvents)

	const latestBlockInfo = state.latestBlockSeen[id]
	// @ts-ignore
	const metadata = seedNodeMetadata[state.activeSubscription.chain]?.[id]

	let indicatorStyle: string
	if (state.latestBlock && latestBlockInfo === state.latestBlock) {
		indicatorStyle = `${styles.indicator} ${styles.healthy} ${styles.pulsating}`
	} else if (state.latestBlock && state.latestBlock - latestBlockInfo <= 1) {
		indicatorStyle = `${styles.indicator} ${styles.healthy}`
	} else {
		indicatorStyle = `${styles.indicator}`
	}

	return (
		<tr key={`seedNode_${id}`}>
			<td className={styles.indicatorColumn}>
				<div className={indicatorStyle}>&nbsp;</div>
			</td>
			<td>
				<a href={metadata?.link}>{metadata?.name || id}</a><br/>
			</td>
			<td>
				{metadata?.rpc}
			</td>
			{blocksToShow.map(block => <td className={latestBlockInfo >= block ? styles.seen : styles.unseen}></td>)}
		</tr>
	)
}
