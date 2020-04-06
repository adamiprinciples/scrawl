import * as React from "react";
import "./shell.scss";

interface IAppContext {
  data?: string;
  setData?: (value: string) => void;
}

export const AppContext = React.createContext<IAppContext>({})

export const Shell: React.FunctionComponent<{}> = props => {

  const [data, setData] = React.useState("hello world");

  return (
    <AppContext.Provider value={{ data, setData }}>
    <div className="shell">
      <header>
        <div className="fixed-width">
          <img src={require('../assets/images/scrawl.svg')}/>
        </div>
      </header>
      <main className="fixed-width">{props.children}</main>
    </div>
    </AppContext.Provider>
  );
}