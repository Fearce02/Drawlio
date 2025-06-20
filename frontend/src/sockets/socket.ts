import { io, Socket } from "socket.io-client";

type ServerToClientEvents = {
  playerJoined: (players: { username: string; isHost: boolean }[]) => void;
  gameStarted: (data: { message: string }) => void;
};

type ClientToServerEvents = {
  joinRoom: (data: { username: string; roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.BACKEND_URL || "http://localhost:8000",
);

export default socket;
