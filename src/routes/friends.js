import express from "express";
import authenticate from "../middlewares/jwtAuth.js";
// Controller functions will be implemented in a separate file
import {
  sendRequest,
  acceptRequest,
  removeFriend,
  getFriendsList,
  rejectRequest,
  searchUsers,
} from "../controllers/friendsController.js";

const router = express.Router();

router.post("/request", authenticate, sendRequest);
router.post("/accept", authenticate, acceptRequest);
router.post("/reject", authenticate, rejectRequest);
router.delete("/remove/:friendUserId", authenticate, removeFriend);
router.get("/list", authenticate, getFriendsList);
router.get("/search", authenticate, searchUsers);

export default router;
