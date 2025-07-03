import guestRoutes from "./routes/guests.js";
import express from "express";
import { handleLobbySockets } from "./sockets/lobbyHandlers.js";
import { Server as SocketServer } from "socket.io";
import { createServer } from "http";
import authRoutes from "./routes/auth.js";
import cors from "cors";
import friendsRoutes from "./routes/friends.js";

const app = express();
const server = createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", //Frontend Server
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/rooms", guestRoutes);
app.use("/api/friends", friendsRoutes);

io.on("connection", (socket) => {
  console.log("User has connected", socket.id);
  handleLobbySockets(io, socket);
});

export { server, app };
