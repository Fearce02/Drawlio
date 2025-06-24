import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Guest.tsx";
import AuthPage from "./components/AuthPage.tsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/guest-lobby" element={<Lobby />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
