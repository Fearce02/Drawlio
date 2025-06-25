import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Guest.tsx";
import AuthPage from "./components/AuthPage.tsx";
import MainContent from "./sections/MainContent.tsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<MainContent />} />
          <Route path="/guest-lobby" element={<Lobby />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
