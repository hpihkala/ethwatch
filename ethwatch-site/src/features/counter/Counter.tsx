import React, { useState } from 'react'
import EthWatch from 'ethwatch-client'

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  confirmation,
  selectEvents,
} from './counterSlice';
import styles from './Counter.module.css';

export function Counter() {
  const state = useAppSelector(selectEvents);
  const dispatch = useAppDispatch();

  const ethWatch = new EthWatch()
  ethWatch.watch(state.contract, state.abi)
  	.then((contract) => {
		contract.on('event', (event) => dispatch(confirmation(event)))  
	})

const eventItems = state.list.map((event) => <div>{event.name}</div>)

  return (
    <div>
	  {eventItems}
    </div>
  );
}
