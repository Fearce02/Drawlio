import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Guest.tsx";
import AuthPage from "./components/AuthPage.tsx";
import Dashboard from "./sections/Dashboard.tsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/guest-lobby" element={<Lobby />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
