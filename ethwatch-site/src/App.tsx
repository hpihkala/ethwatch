import React from 'react';
import { EventList } from './features/eventList/EventList';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Look ma, no RPC!</h1>
		<EventList />
      </header>


    </div>
  );
}

export default App;
