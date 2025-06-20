import guestRoutes from "./routes/guests.js";
import express from "express";
import { handleLobbySockets } from "./sockets/lobbyHandlers.js";
import { Server as SocketServer } from "socket.io";
import { createServer } from "http";

const app = express();
const server = createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.json());

app.use("/api/rooms", guestRoutes);

io.on("connection", (socket) => {
  console.log("User has connected", socket.id);
  handleLobbySockets(io, socket);
});

export { server, app };
