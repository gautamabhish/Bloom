import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

const LoginMe = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/generate-profile");
      } else {
        navigate("/login");
      }
    }
  }, [user, loading]);

  return <p>Igniting your spark… ✨</p>;
};

export default LoginMe;
