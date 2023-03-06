import { useAppSelector } from '../../app/hooks';
import {
  selectEvents,
} from './eventListSlice'

import styles from './SeedNodes.module.css'
import { SeedNode } from './SeedNode';

export function SeedNodes() {
	const state = useAppSelector(selectEvents)

	const blocksToShow: number[] = []
	if (state.latestBlock) {
		for (let block=state.latestBlock-4; block<= state.latestBlock; block++) {
			blocksToShow.push(block)
		}
	}

	return (
		<table className={styles.seedNodes}>
			<thead>
				<tr>
					<th></th>
					<th>Node</th>
					<th>RPC</th>
					{blocksToShow.map(block => <th className={styles.block}>{block}</th>)}
				</tr>
			</thead>
			<tbody>
				{state.seedNodes.map((id) => <SeedNode key={id} id={id} blocksToShow={blocksToShow}/>)}
			</tbody>
		</table>
	)
}
