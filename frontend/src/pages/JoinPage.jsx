import { useState } from "react";

function JoinPage({ setUser }) {
    const [username, setUsername] = useState("")
    const [room, setRoom] = useState("")

    function handleJoin() {
        if (!username.trim() || !room.trim()) {
            alert("Enter username and room")
            return
        }

        setUser({
            username: username.trim(),
            room: room.trim()
        })
    }

    return (
        <div>
            <h1>Join the Chat Room</h1>

            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <br />
            <br />
            <input placeholder="Room" value={room} value ={room} onChange={(e) => setRoom(e.target.value)} />
            <br />
            <br />
            <button onClick={handleJoin}>Join Room</button>
        </div>
    )
}

export default JoinPage