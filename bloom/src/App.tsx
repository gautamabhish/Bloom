//@ts-nocheck
import { Routes, Route } from "react-router";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import GenerateProfile from "./Components/GenerateProfile";
import { useAuth } from "./contexts/AuthContext";
import LoginMe from "./Components/LoginMe";
// ProtectedRoute.tsx (or inline)
import { Navigate } from "react-router";
import './App.css'; 
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // or loader
  return user ? children : <Navigate to="/login" />;
};


const App = () => {
  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
        from-[#923b42]
        via-[#e8afa8]
        to-[#d38f8c]
        text-[#4a2c2a]
      "
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/login/me"
          element={<LoginMe />}
        />
        <Route
          path="/generate-profile"
          element={
            <ProtectedRoute>
              <GenerateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
