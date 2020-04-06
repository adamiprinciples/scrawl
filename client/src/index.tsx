import * as React from "react";
import * as ReactDOM from "react-dom";
import { routeFactory } from "./routes";

import "./theme/theme.scss";
import { BrowserRouter } from 'react-router-dom';

async function render() {
  ReactDOM.render(
      <BrowserRouter>
        {routeFactory()}
      </BrowserRouter>
    , document.getElementById("host"));
}

render()
