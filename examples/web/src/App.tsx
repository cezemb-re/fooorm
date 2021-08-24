import { ReactElement } from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.css';
import Sign from './sign';
import Profile from './profile';

export default function App(): ReactElement {
  return (
    <div className="App">
      <Switch>
        <Route path="/" exact component={Sign} />
        <Route path="/profile" component={Profile} />
      </Switch>
    </div>
  );
}
