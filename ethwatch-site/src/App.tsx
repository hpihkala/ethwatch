import React from 'react';
import { EventList } from './features/eventList/EventList';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
		<EventList />
      </header>


    </div>
  );
}

export default App;
