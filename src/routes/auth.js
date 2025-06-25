import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/UserSchema.js";
import authenticate from "../middlewares/jwtAuth.js";
import { success } from "zod/v4";

const router = express.Router();

router.post("/sign-up", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    const userexists = await User.findOne({ email });
    if (userexists) {
      return res.status(400).json({
        message: "This Email is already Registered",
      });
    }
    const sameUsername = await User.findOne({ username });
    if (sameUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const pwdHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: pwdHash,
    });
    await newUser.save();
    res.status(200).json({
      success: true,
      message: "User Created!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid emailID or password",
      });
    }

    const userMatched = await bcrypt.compare(password, user.password);
    if (!userMatched) {
      return res.status(401).json({
        message: "Invalid emailID or password",
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });
    const { firstName, lastName, username, avatar, stats } = user;
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        firstName,
        lastName,
        username,
        email: user.email,
        avatar,
        stats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.put("/update-profile", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, username, email, avatar } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({
        message: "User not found",
      });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar;

    await user.save();
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/profile", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
