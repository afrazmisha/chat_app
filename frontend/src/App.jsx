import { useState } from "react";
import JoinPage from "./pages/JoinPage"
import Dashboard from "./pages/Dashboard"
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  
  if (!user) {
    return <JoinPage setUser={setUser} />
  }

  return <Dashboard user={user} setUser={setUser}/>
}

export default App;