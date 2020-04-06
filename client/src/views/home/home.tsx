import * as React from "react";
import { TextInput, Button, CodeInput } from "@rocketmakers/armstrong";
import { RouteComponentProps } from 'react-router';
import * as socketio from "socket.io-client";
import { AppContext } from '../shell';
import { SocketChannel, IPlayer, ISession, IJoinLobbyResponse, ISessionResponse, SubmissionType } from "../../../../shared/types";
import SvgSketchCanvas from 'react-sketch-canvas';

import "./home.scss";

export const HomeView: React.FunctionComponent<RouteComponentProps> = props => {
  const canvas = React.useRef<any>();
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [revealIndex, setRevealIndex] = React.useState(0);
  const [joiningSession, setJoiningSession] = React.useState(false);

  const [player, setPlayer] = React.useState<IPlayer>();
  const playerRef = React.useRef<IPlayer>();

  const [session, setSession] = React.useState<ISession>();

  const [description, setDescription] = React.useState("");

  const { data } = React.useContext(AppContext);
  let socket: SocketIO.EngineSocket;

  React.useEffect(() => {
    socket = socketio('http://localhost:3000');
    // Join lobby
    socket.on(SocketChannel.JoinLobby, (response: IJoinLobbyResponse) => {
      if (response.error) {
        alert(response.error);
        return;
      }
      setPlayer(response.player);
      playerRef.current = response.player;
    });
    // Create session
    socket.on(SocketChannel.NewSession, (response: ISessionResponse) => {
      if (response.error) {
        alert(response.error);
        return;
      }
      setSession(response.session);
    });
    // Join session
    socket.on(SocketChannel.JoinSession, (response: ISessionResponse) => {
      if (response.error) {
        alert(response.error);
        return;
      }
      setSession(response.session);
    });
    // Session updated
    socket.on(SocketChannel.UpdateSession, (response: ISessionResponse) => {
      console.log('session updated');
      if (response.error) {
        alert(response.error);
        return;
      }
      const updatedPlayer = response.session.players.find(p => p.id === playerRef.current.id);
      setPlayer(updatedPlayer);
      setSession(response.session);
    });

    console.log('socket ready');
  }, []);

  const sendMessage = React.useCallback((type: SocketChannel, body: object | string) => {
    socket.emit(type, body);
  }, [socket]);

  const submit = async (type: SubmissionType) => {
    if (type === 'drawing' && canvas && canvas.current) {
      let response = await canvas.current.exportImage('png');
      sendMessage(SocketChannel.SubmitSession, {
        sessionCode: session.code,
        playerId: player.id,
        stackId: myCurrentStack.id,
        submission: {
          type: 'drawing',
          data: response
        }
      })
    }
    if (type === 'description') {
      sendMessage(SocketChannel.SubmitSession, {
        sessionCode: session.code,
        playerId: player.id,
        stackId: myCurrentStack.id,
        submission: {
          type: 'description',
          data: description
        }
      })
    }
  }

  if (!player) {
    return (
      <div className="lobby-form">
        <h1>Join the lobby</h1>
        <label>What's your name?</label>
        <TextInput value={name} onChange={e => setName(e.currentTarget.value)} />
        <Button disabled={!name} onClick={() => sendMessage(SocketChannel.JoinLobby, { name })}>Join Lobby</Button>
      </div>
    )
  }

  if (!session && !joiningSession) {
    return (
      <div>
        <div className="lobby-options">
          <div className="slide-in-up" onClick={() => sendMessage(SocketChannel.NewSession, { hostPlayerId: player.id })}>
            <img src={require('../../assets/images/new-game.svg')}/>
            <div className="bottom-bar">New Game</div>
          </div>
          <div className="slide-in-up" style={{ animationDelay: '0.1s'}} onClick={() => setJoiningSession(true)}>
            <img src={require('../../assets/images/join-game.svg')}/>
          <div className="bottom-bar">Join Game</div>
          </div>
        </div>
      </div>
    )
  }

  
  if (!session && joiningSession) {
    return (
      <div>
         <label>Enter game code</label>
            <CodeInput lengthPerBox={[1, 1, 1, 1, 1, 1]} value={code} onCodeChange={e => setCode(e as string)} />
            <Button disabled={code.length !== 6} onClick={() => sendMessage(SocketChannel.JoinSession, { playerId: player.id, code })}>Join game</Button>
      </div>
    )
  }

  const enoughPlayers = session.players.length >= session.settings.minPlayers;
  if (session.status === 'open') {
    return (
      <div className="lobby-form">
        <h1>GAME [{session.code}]</h1>
        <h2>{session.players.length} / {session.settings.maxPlayers} players</h2>
        {session.players.map(p => <h3>{p.name}</h3>)}
        {player.id === session.hostPlayerId &&
          <Button disabled={!enoughPlayers} onClick={() => sendMessage(SocketChannel.StartSession, session.code)}>
            {enoughPlayers ? 'Start game' : `Need ${session.settings.minPlayers} players to start`}
          </Button>
        }
      </div>
    )
  }
  const myOriginalStack = session.stacks.find(s => s.startPlayerIndex === player.sessionIndex);
  const myCurrentStack = session.stacks.find(s => s.currentPlayerIndex === player.sessionIndex);

  if (session.status === 'complete') {
    return (
      <div>
        Session complete
        <h1>Your description was '{myOriginalStack.subject}'</h1>
        <Button disabled={revealIndex === myOriginalStack.submissions.length} onClick={() => setRevealIndex(revealIndex + 1)}>Reveal next</Button>
        {myOriginalStack.submissions.slice(0, revealIndex).map(sub => {
          if (sub.type === 'drawing') {
            return <img src={sub.data} />
          }
          if (sub.type === 'description') {
            return <p>{sub.data}</p>
          }
        })}

      </div>
    )
  }


  if (!myCurrentStack) {
    return null;
  }

  if (myCurrentStack.status === 'ready') {
    return <div className="waiting">
      <img src={require('../../assets/images/waiting.svg')}/>
      <h1>WAITING FOR OTHER PLAYERS ANSWERS</h1>
    </div>;
  }

  return (
    <div className="entry-form">
      {!myCurrentStack.lastSubmission && 
      <>
      <h1>Draw the following</h1>
      <h2>{myCurrentStack.subject}</h2>
      </>
      }
      {myCurrentStack.lastSubmission &&
        <>
          {myCurrentStack.lastSubmission.type === 'drawing' &&
            <>
              <h1>Describe the drawing</h1>
              <div className="sketch-canvas">

              </div>
              <img src={myCurrentStack.lastSubmission.data} />
            </>}
          {myCurrentStack.lastSubmission.type === 'description' &&
          <>
           <h1>Draw the following</h1>
          <h2>{myCurrentStack.lastSubmission.data}</h2>
          </>
          }
        </>
      }
      {myCurrentStack.lastType === 'description' &&
        <SvgSketchCanvas
          className="sketch-canvas"
          ref={canvas}
          allowOnlyPointerType="all"
          width="600"
          height="600"
          strokeWidth={4}
          strokeColor="black"
        />
      }
      {myCurrentStack.lastType === 'drawing' &&
        <TextInput value={description} onChange={e => setDescription(e.currentTarget.value)} />
      }
      <Button onClick={() => submit(myCurrentStack.lastType === 'description' ? 'drawing' : 'description')}>Submit</Button>
    </div>
  )
} 