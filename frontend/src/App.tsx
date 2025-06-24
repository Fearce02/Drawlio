import GuestLogin from "./components/GuestLogin.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Guest.tsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<GuestLogin />} />
          <Route path="/guest-lobby" element={<Lobby />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
