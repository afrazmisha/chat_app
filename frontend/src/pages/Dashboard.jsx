
import { useState } from "react"
import OnlineUsers from "../components/OnlineUsers"
import PrivateChat from "../components/PrivateChat"
import RoomChat from "../components/PrivateChat"

function Dashboard({ user, setUser }) {
    const [currentRoom, setCurrentRoom] = useState(user.room)
    const [roomInput, setRoomInput] = useState("")
    const [joinedRooms, setJoinedRooms] = useState([user.room])

    function joinNewRoom() {
        const newRoom = roomInput.trim();

        if (!newRoom) return;

        setCurrentRoom(newRoom)

        if (!joinedRooms.includes(newRoom)) {
            setJoinedRooms([...joinedRooms, newRoom]);
        }

        setRoomInput("")
    }

    const activeUser = {
        ...user,
        room: currentRoom,
    }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <h2>Chat App</h2>

                <div className="user-card">
                    <strong>{user.username}</strong>
                    <p>Current Room: {currentRoom}</p>
                </div>

                <h3>Join Room</h3>

                <input
                    placeholder="Room Name"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') joinNewRoom
                    }}
                />

                <button onClick={joinNewRoom}>Join</button>

                <h3>Joined Rooms</h3>

                {joinedRooms.map((room) => {
                    <button
                        key={room}
                        onClick={() => setCurrentRoom(room)}
                    >
                        {room}
                    </button>
                })}

                <OnlineUsers />

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