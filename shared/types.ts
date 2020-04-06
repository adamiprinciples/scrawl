export enum SocketChannel{
  JoinLobby = 'join-lobby',
  NewSession = 'new-session',
  JoinSession = 'join-session',
  UpdateSession = 'update-session',
  StartSession = 'start-session',
  SubmitSession = 'submit-session'
}


export interface IJoinLobbyRequest {
  name: string;
}

export interface INewSessionRequest {
  hostPlayerId: string;
}

export interface IJoinSessionRequest {
  playerId: string;
  code: string;
}

export interface ISessionUpdateRequest {
  session: ISession;
}

export interface ISocketResponse {
  error: string;
}

export interface IJoinLobbyResponse extends ISocketResponse {
  player: IPlayer;
}

export interface ISessionResponse extends ISocketResponse {
  session: ISession;
}

export type SessionStatus = 'open' | 'running' | 'complete';

export interface ISession {
  settings: ISessionSettings;
  status: SessionStatus;
  code: string;
  hostPlayerId: string;
  players: IPlayer[];
  stacks: ISessionStack[];
}

export interface ISessionSettings {
  maxTurnLength?: number;
  minPlayers: number;
  maxPlayers: number;
  cardSwitchesAllowed?: number;
}

export interface IPlayer {
  id: string;
  name: string;
  sessionIndex?: number;
}

export type SubmissionType = 'drawing' | 'description';
export type StackStatus = 'waiting' | 'ready';

export interface ISessionStack {
  id: string;
  subject: string;
  startPlayerIndex: number;
  currentPlayerIndex: number;
  status: StackStatus;
  lastType: SubmissionType;
  submissions?: ISubmission[];
  lastSubmission?: ISubmission;
}


export interface ISubmission {
  type: SubmissionType;
  data: any;
}

export interface ISessionSubmission {
  sessionCode: string;
  stackId: string;
  playerId: string;
  submission: ISubmission;
}
