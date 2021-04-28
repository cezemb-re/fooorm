import React, { useCallback, useState } from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.css';
import Sign from './sign';
import Profile from './profile';

function App(): React.ReactElement {
  return (
    <div className="App">
      <Switch>
        <Route path="/" exact component={Sign} />
        <Route path="/profile" component={Profile} />
      </Switch>
    </div>
  );
}

export default App;
