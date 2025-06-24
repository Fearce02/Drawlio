import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../sockets/socket";

const GuestLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    if (!username.trim()) return;

    localStorage.setItem("guestUsername", username);
    socket.emit("joinGuestLobby", { username });
    console.log("joining lobby");

    navigate("/guest-lobby");
  };
  return (
    <>
      <div className="flex flex-col items-center gap-4 mt-10">
        <h1 className="text-2xl font-bold">Guest Login</h1>
        <br />
        <input
          type="text"
          className=" border-2 px-4 rounded"
          placeholder="enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          className=" bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 border-4 "
          onClick={handleGuestLogin}
        >
          Guest Login
        </button>
      </div>
    </>
  );
};

export default GuestLogin;
