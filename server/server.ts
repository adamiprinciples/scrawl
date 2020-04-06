import * as express from "express";
import { Server } from "http";
import * as socketio from "socket.io";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';
import { IPlayer, ISession, IJoinLobbyRequest, INewSessionRequest, IJoinSessionRequest, ISessionUpdateRequest, SocketChannel, ISessionSubmission, ISessionStack } from "../shared/types";

function makeid(length: number) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

var subjects = ['apple', 'pear', 'orange', 'strawberry'];
var tempInt = -1;
function getSubject() {
  tempInt++;
  if (tempInt > subjects.length -1){
    tempInt = 0;
  }
  return subjects[tempInt];
}

function incrementIndex(playerCount: number, currentIndex: number){
  if (currentIndex + 1 > playerCount -1){
    // too high!
    console.log('too high, dropping back round to 0');
    return 0;
  } else{
    return currentIndex +1;
  }
}

const app = express();
app.set("port", process.env.PORT || 3000);

var http = new Server(app);
var io = socketio(http);
var lobby: IPlayer[] = [];
var sessions: ISession[] = []

app.get("/", (req: any, res: any) => {
  res.sendFile(path.resolve("./client/index.html"));
});

// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);
  // whenever we receive a 'message' we log it out
  socket.on(SocketChannel.JoinLobby, (message: IJoinLobbyRequest) => {
    if (lobby.find(p => p.name === message.name)) {
      // Player exists
      socket.emit(SocketChannel.JoinLobby, { error: "Player with that name already exists" });
      return;
    }
    const player: IPlayer = { id: socket.id, name: message.name }
    lobby.push(player);
    console.log(`Player ${player.id} (${player.name}) joined the lobby`);
    socket.emit(SocketChannel.JoinLobby, { player });
  });

  socket.on(SocketChannel.NewSession, (message: INewSessionRequest) => {
    const session = createNewSession(message.hostPlayerId);
    sessions.push(session);
    console.log(`New session created : ${session.code}`);
    socket.emit(SocketChannel.NewSession, { session });
    socket.join(session.code);
  });

  socket.on(SocketChannel.JoinSession, (message: IJoinSessionRequest) => {
    const session = sessions.find(g => g.code === message.code.toLowerCase());
    if (session) {
      if (session.status !== 'open') {
        socket.emit(SocketChannel.JoinSession, { error: "That sesion has already started" });
        return;
      }
      session.players.push(lobby.find(p => p.id === message.playerId));
      console.log(`Player ${message.playerId} (${lobby.find(p => p.id === message.playerId).name}) joined session ${session.code}`);
    }
    else {
      socket.emit(SocketChannel.JoinSession, { error: "No session with that code was found" })
      return;
    }
    socket.emit(SocketChannel.JoinSession, { session });
    socket.join(session.code);
    socket.to(session.code).emit(SocketChannel.UpdateSession, { session });
  });

  socket.on(SocketChannel.StartSession, (code: string) => {
    let session = sessions.find(g => g.code === code);
    console.log('Starting session');
    session.status = 'running';

    session.players.forEach((player, index) => {
      player.sessionIndex = index;
      session.stacks.push({
        id: uuidv4(),
        subject: getSubject(),
        startPlayerIndex: index,
        currentPlayerIndex: index,
        status: 'waiting',
        lastType: 'description',
        submissions: []
      })
    })

    io.to(session.code).emit(SocketChannel.UpdateSession, { session });
  });

  socket.on(SocketChannel.SubmitSession, (ss: ISessionSubmission) => {
    let session = sessions.find(g => g.code === ss.sessionCode);
    let stack = session.stacks.find(st => st.id === ss.stackId);
    stack.status = "ready";
    stack.submissions.push(ss.submission);
    stack.lastSubmission = ss.submission;
    stack.lastType = ss.submission.type;
    console.log(`Player ${ss.playerId} submitted`);

    if (session.stacks.filter(st => st.status === 'ready').length === session.stacks.length){
      // Everyones ready. Fire new stacks now!
      console.log('all stacks ready, switching round!');
      // First check to see if we're back at the start. We'll just reuse the most recent submission
      // as they will all pass the same logic test
      if (incrementIndex(session.players.length, stack.currentPlayerIndex) === stack.startPlayerIndex){
        // We're back at the start! Get ready for the grand reveal!
        console.log('round complete!');
        session.status = 'complete';
      }
      else {
        session.stacks.forEach(st => {
          st.status = 'waiting'
          // Increment the player index to match the next player
          st.currentPlayerIndex = incrementIndex(session.players.length, st.currentPlayerIndex);
        });
      }
    }

    io.to(session.code).emit(SocketChannel.UpdateSession, { session }); 
  });

  socket.on("disconnect", () => {
    const playerIndex = lobby.findIndex(p => p.id === socket.id);
    const player = lobby[playerIndex];
    console.log(`Player ${socket.id} disconnected`);

    if (playerIndex !== -1) {
      // remove player from lobby
      lobby.splice(playerIndex, 1);
      console.log(`Player ${player.id} removed from lobby`);

      // remove player from all sessions
      const playerSessions = sessions.filter(s => s.players.includes(player));
      playerSessions.forEach(session => {
        session.players.splice(playerIndex, 1);
        // update players
        io.to(session.code).emit(SocketChannel.UpdateSession, { session });
        console.log(`Player ${player.id} removed from session ${session.code}`)
      });

      // clean up empty sessions
      const deadSessions = playerSessions.filter(ps => ps.players.length === 0);
      deadSessions.forEach(ds => {
        playerSessions.splice(playerSessions.findIndex(ps => ps.code === ds.code), 1);
      })
    }
  });
});

// start our simple server up on localhost:3000
http.listen(3000, function () {
  console.log("listening on *:3000");
});

const createNewSession = (hostPlayerId: string) => {
  return {
    code: makeid(6),
    hostPlayerId,
    players: [lobby.find(p => p.id === hostPlayerId)],
    stacks: [],
    status: 'open',
    settings: {
      minPlayers: 2,
      maxPlayers: 8,
      maxTurnLength: 30,
      cardSwitchesAllowed: 3
    }
  } as ISession;
}