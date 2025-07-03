import { User } from "../models/UserSchema.js";

// Friends controller stubs
export const sendRequest = async (req, res) => {
  const fromUserId = req.user.id;
  const { toUserId } = req.body;

  if (!toUserId || fromUserId === toUserId) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found." });
    }
    if (
      fromUser.friends.includes(toUserId) ||
      fromUser.sentRequests.includes(toUserId) ||
      fromUser.friendRequests.includes(toUserId)
    ) {
      return res
        .status(400)
        .json({ message: "Already friends or request pending." });
    }
    fromUser.sentRequests.push(toUserId);
    toUser.friendRequests.push(fromUserId);
    await fromUser.save();
    await toUser.save();
    res.status(200).json({ message: "Friend request sent." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const acceptRequest = async (req, res) => {
  const toUserId = req.user.id;
  const { fromUserId } = req.body;

  if (!fromUserId) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const toUser = await User.findById(toUserId);
    const fromUser = await User.findById(fromUserId);
    if (!toUser || !fromUser) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!toUser.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: "No such friend request." });
    }
    // Remove from requests
    toUser.friendRequests = toUser.friendRequests.filter(
      (id) => id.toString() !== fromUserId,
    );
    fromUser.sentRequests = fromUser.sentRequests.filter(
      (id) => id.toString() !== toUserId,
    );
    // Add to friends
    toUser.friends.push(fromUserId);
    fromUser.friends.push(toUserId);
    await toUser.save();
    await fromUser.save();
    res.status(200).json({ message: "Friend request accepted." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const removeFriend = async (req, res) => {
  const userId = req.user.id;
  const { friendUserId } = req.params;

  if (!friendUserId) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendUserId);
    if (!user || !friend) {
      return res.status(404).json({ message: "User not found." });
    }
    user.friends = user.friends.filter((id) => id.toString() !== friendUserId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);
    await user.save();
    await friend.save();
    res.status(200).json({ message: "Unfriended successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const getFriendsList = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId)
      .populate("friends", "_id firstName lastName username avatar status")
      .populate(
        "friendRequests",
        "_id firstName lastName username avatar status",
      )
      .populate(
        "sentRequests",
        "_id firstName lastName username avatar status",
      );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentRequests: user.sentRequests,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const rejectRequest = async (req, res) => {
  const userId = req.user.id;
  const { userId: otherUserId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);
    if (!user || !otherUser) {
      return res.status(404).json({ message: "User not found." });
    }
    // If current user received a request from otherUser, reject it
    if (user.friendRequests.includes(otherUserId)) {
      user.friendRequests = user.friendRequests.filter(
        (id) => id.toString() !== otherUserId,
      );
      otherUser.sentRequests = otherUser.sentRequests.filter(
        (id) => id.toString() !== userId,
      );
      await user.save();
      await otherUser.save();
      return res.status(200).json({ message: "Friend request rejected." });
    }
    // If current user sent a request to otherUser, cancel it
    if (user.sentRequests.includes(otherUserId)) {
      user.sentRequests = user.sentRequests.filter(
        (id) => id.toString() !== otherUserId,
      );
      otherUser.friendRequests = otherUser.friendRequests.filter(
        (id) => id.toString() !== userId,
      );
      await user.save();
      await otherUser.save();
      return res.status(200).json({ message: "Friend request cancelled." });
    }
    return res
      .status(400)
      .json({ message: "No pending friend request found between users." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const searchUsers = async (req, res) => {
  const userId = req.user.id;
  const { query } = req.query;
  if (!query)
    return res.status(400).json({ message: "No search query provided." });

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: userId },
    }).select("_id username firstName lastName avatar");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};
