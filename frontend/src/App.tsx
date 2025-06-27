import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./components/AuthPage.tsx";
import Dashboard from "./sections/Dashboard.tsx";
import Lobby from "./sections/Lobby.tsx";
import { GameRoom } from "./sections/GameRoom/GameRoom.tsx";

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
        </Routes>
      </Router>
    </>
  );
}

export default App;
