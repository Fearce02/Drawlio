import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import AuthPage from "./components/AuthPage.tsx";
import Dashboard from "./sections/Dashboard.tsx";
import Lobby from "./sections/Lobby.tsx";
import { GameRoom } from "./sections/GameRoom/GameRoom.tsx";
import ManageFriends from "./sections/FriendsSection/MangaeFriends";
import FriendsLobby from "./sections/FriendsSection/FriendsLobby";

function FriendsWithNav() {
  const navigate = useNavigate();
  return <ManageFriends onBack={() => navigate("/dashboard")} />;
}

function FriendsLobbyWithNav() {
  const navigate = useNavigate();
  return <FriendsLobby onBack={() => navigate("/dashboard")} />;
}

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="/guest-lobby"
            element={<Lobby friends={[]} onBack={() => {}} />}
          />
          <Route path="/game" element={<GameRoom />} />
          <Route path="/friends" element={<FriendsWithNav />} />
          <Route path="/friends-lobby" element={<FriendsLobbyWithNav />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
