import * as React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { HomeView } from "./views/home/home";
import { Shell } from "./views/shell";


export function routeFactory(): JSX.Element {
  return (
    <Route path="/" render={r =>
      <Shell>
        <Switch>
          <Route path="/home" component={HomeView} />
          <Redirect path="*" to={`${r.match.url}home`} />
        </Switch>
      </Shell>
    } />
  )
}

