import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

function RoomChat({ user }) {
    const [roomMessages, setRoomMessages] = useState({});
    const messages = roomMessages[user.room] || [];
    const [text, setText] = useState("");
    const [status, setStatus] = useState("Connecting...");
    const [users, setUsers] = useState([])
    const socketRef = useRef(null);

    useEffect(() => {
        const wsUrl = `ws://127.0.0.1:8000/ws/${user.room}/${user.username}`;

        console.log("Connecting to:", wsUrl);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
            setStatus("Connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "users") {
                setUsers(data.users)
                return
            }

            setRoomMessages((prev) => ({
                ...prev,
                [user.room]: [...(prev[user.room] || []), data],
            }))
        };

        socket.onerror = (error) => {
            console.log("WebSocket error:", error);
            setStatus("Error");
        };

        socket.onclose = (event) => {
            console.log("WebSocket closed:", event);
            setStatus("Closed");
        };

        return () => {
            socket.close();
        };
    }, [user.room, user.username]);

    function sendMessage() {
        if (!text.trim()) return;

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            alert(`Chat is not connected. Current status: ${status}`);
            return;
        }

        socketRef.current.send(text);
        setText("");
    }

    return (
        <>
            <div className="room-header">
                <div>
                    <h2>Room: {user.room}</h2>
                    <p>{users.length} member(s) online</p>
                </div>
            </div>
            <div>
                <div>
                    <h3>Online Users</h3>

                    {users.map((onlineUser, index) => (
                        <p key={index}>• {onlineUser}</p>
                    ))}
                </div>

                <p>Status: {status}</p>

                <div style={{ border: "1px solid black", height: "300px", overflowY: "auto" }}>
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={index}
                            message={message}
                            currentUsername={user.username}
                        />
                    ))}
                </div>

                <br />

                <input
                    placeholder="Type message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                    }}
                />

                <button onClick={sendMessage}>Send</button>
            </div>
        </>
    );
}

export default RoomChat