import express from "express";
import { GameRoom } from "../models/GameRoom.js";
import { nanoid } from "nanoid";

const router = express.Router();

router.post("join-game", async (req, res) => {
  const { username, roomCode } = req.body;

  if (!username) return res.status(400).json({ error: "Username is required" });

  let room;

  if (roomCode) {
    room = await GameRoom.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ error: "Room not found" });
  } else {
    const newRoomCode = nanoid(6).toUpperCase();
    room = new GameRoom({
      code: newRoomCode,
      host: username,
      players: [
        {
          userId: null,
          username,
          score: 0,
          isHost: true,
        },
      ],
    });
    await room.save();
  }

  if (roomCode) {
    room.players.push({ userId: null, username, score: 0, isHost: false });
    await room.save();
  }
  res
    .status(200)
    .json({ roomCode: room.code, host: room.host, players: room.players });
});

export default router;
