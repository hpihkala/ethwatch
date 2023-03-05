import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'

import styles from './SeedNode.module.css'
import * as seedNodeMetadata from '../../config/seedNodeMetadata.json'

export function SeedNode({ id }: { id: string }) {
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
		<div className={styles.seedNode} key={id}>
			<table>
				<tbody>
					<tr key={id + 'name'}>
						<td><div className={indicatorStyle}>&nbsp;</div></td>
						<td><a href={metadata?.link}>{metadata?.name || id}</a></td>
					</tr>
					<tr key={id + 'block'}>
						<td>Block</td>
						<td>{latestBlockInfo}</td>
					</tr>
					<tr key={id + 'rpc'}>
						<td>RPC</td>
						<td>{metadata?.rpc}</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
}
