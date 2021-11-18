import { ReactElement } from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.scss';
import Article from './articles/page';

export default function App(): ReactElement {
  return (
    <div className="App">
      <Switch>
        <Route path="/" exact component={Article} />
      </Switch>
    </div>
  );
}
