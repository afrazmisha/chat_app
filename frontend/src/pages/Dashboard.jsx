import { useState } from "react"
import PrivateChat from "../components/PrivateChat"
import RoomChat from "../components/RoomChat"

function Dashboard({ user, setUser }) {
    const [currentRoom, setCurrentRoom] = useState(user.room);

    const activeUser = {
        ...user,
        room: currentRoom
    };

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <h2>Chat App</h2>

                <div className="user-card">
                    <strong>{user.username}</strong>
                    <p>Room: {user.room}</p>
                </div>

                <input 
                    placeholder="Room Name"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                            setCurrentRoom(e.target.value.trim());
                            e.target.value = "";
                        }
                    }}
                />

                <button onClick={() => setUser(null)}>
                    Logout
                </button>
            </aside>

            <main className="main-chat">
                <RoomChat user={activeUser} />
            </main>

            <aside className="private-panel">
                <PrivateChat />
            </aside>
        </div>
    )
}

export default Dashboard