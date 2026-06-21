import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard"
import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("chat_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  function handleSetUser(userData) {
    setUser(userData);

    if (userData) {
      localStorage.setItem("chat_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("chat_user");
      localStorage.removeItem("chat_token");
    }
  }

  const [authMode, setAuthMode] = useState("login");
  
  if (!user && authMode === "login") {
    return <LoginPage setUser={handleSetUser} setAuthMode={setAuthMode} />
  }

  if (!user && authMode === "signup") {
    return<SignupPage setAuthMode={setAuthMode} />;
  }

  return <Dashboard user={user} setUser={handleSetUser}/>
}

export default App;