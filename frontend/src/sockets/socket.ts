import { io, Socket } from "socket.io-client";

// type GuestPlayer = {
//   username: string;
// };

type ServerToClientEvents = {
  PlayerJoined: (players: { username: string; isHost: boolean }[]) => void;
  HostAssigned: (data: { host: string }) => void;
  lobbySettingsUpdated: (settings: any) => void;
  GameStarted: (data: { message: string }) => void;

  NewTurn: (data: {
    drawer: string;
    maskedWord: string;
    round: number;
    totalRounds: number;
    time: number;
  }) => void;

  WordToDraw: (word: string) => void;

  CorrectGuess: (data: { username: string; message: string }) => void;

  GameOver: (data: { players: { username: string; score: number }[] }) => void;
};

type ClientToServerEvents = {
  join_lobby: (data: { username: string; roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  updateSettings: (data: { roomCode: string; settings: object }) => void;

  sendGuess: (data: { roomCode: string; message: string }) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.BACKEND_URL || "http://localhost:8000",
  {
    transports: ["websocket"],
  },
);

export default socket;
