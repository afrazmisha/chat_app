import { useEffect, useRef, useState } from "react"
import RoomChat from "../components/RoomChat"
import PrivateChat from "../components/PrivateChat"

function Dashboard({ user, setUser }) {
    const [currentRoom, setCurrentRoom] = useState(user.room);
    const [joinedRooms, setJoinedRooms] = useState([user.room]);
    const [messages, setMessages] = useState({});
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("Connecting...");
    const [text, setText] = useState("");
    const [globalUsers, setGlobalUsers] = useState([]);
    const [privateMessages, setPrivateMessages] = useState({});
    const [selectedPrivateUser, setSelectedPrivateUser] = useState(null);
    const [privateUnread, setPrivateUnread] = useState({});

    const socketRef = useRef(null);

    //Load room history useEffect
    useEffect(() => {
        async function loadRoomHistory() {
            const response = await fetch(
                `http://127.0.0.1:8000/rooms/${currentRoom}/messages`
            );

            const history = await response.json();

            setMessages((prev) => ({
                ...prev,
                [currentRoom]: history,
            }));
        }

        loadRoomHistory();
    }, [currentRoom]);

    //WebSocket useEffect
    useEffect(() => {
        const wsUrl = `ws://127.0.0.1:8000/ws/${currentRoom}/${user.username}`;

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            setStatus("Connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "users") {
                setUsers(data.users);
                return;
            }

            if (data.type === "global_users") {
                setGlobalUsers(data.users);
                return;
            }

            if (data.type === "private_message") {
                const otherUser = 
                    data.from === user.username ? data.to : data.from;

                setPrivateMessages((prev) => ({
                    ...prev,
                    [otherUser]: [...(prev[otherUser] || []), data],
                }));

                if (data.from !== user.username && selectedPrivateUser !== otherUser) {
                    setPrivateUnread((prev) => ({
                        ...prev,
                        [otherUser]: (prev[otherUser] || 0) + 1,
                    }));
                }

                return;
            }

            setMessages((prev) => ({
                ...prev,
                [currentRoom]: [...(prev[currentRoom] || []), data],
            }));
        };

        socket.onerror = () => {
            setStatus("Error");
        }

        socket.onclose = () => {
            setStatus("Closed");
        }

        return () => {
            socket.close();
        };
    }, [currentRoom, user.username]);

    function switchRoom(roomName) {
        const cleanRoom = roomName.trim();

        if (!cleanRoom) return;

        setCurrentRoom(cleanRoom);

        if (!joinedRooms.includes(cleanRoom)) {
            setJoinedRooms([...joinedRooms, cleanRoom]);
        }
    }

    function sendMessage() {
        if (!text.trim()) return;

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            alert(`Chat is not connected. Current status: ${status}`);
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                type: "room_message",
                text: text,
            })
        );

        setText("");
    }

    function sendPrivateMessage(to, privateText) {
        if (!privateText.trim()) return;

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            alert(`Chat is not connected. Current status: ${status}`);
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                type: "private_message",
                to: to,
                text: privateText
            })
        )
    }

    function openPrivateChat(username){
        setSelectedPrivateUser(username);

        setPrivateUnread((prev) => ({
            ...prev,
            [username]: 0,
        }));
    }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <h2>Chat App</h2>

                <div className="user-card">
                    <strong>{user.username}</strong>
                    <p>Current Room: {currentRoom}</p>
                </div>

                <input
                    placeholder="Room Name"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            switchRoom(e.target.value);
                            e.target.value = "";
                        }
                    }}
                />

                <h3>Joined Rooms</h3>

                {joinedRooms.map((room) => (
                    <button
                        key={room}
                        onClick={() => switchRoom(room)}
                        className={room === currentRoom ? "active-room" : "room-button"}
                    >
                        {room}
                    </button>
                ))}

                <button onClick={() => setUser(null)}>
                    Logout
                </button>
            </aside>

            <main className="main-chat">
                <RoomChat
                    user={user}
                    currentRoom={currentRoom}
                    messages={messages[currentRoom] || []}
                    sendMessage={sendMessage}
                    text={text}
                    setText={setText}
                    users={users}
                    status={status}
                />
            </main>

            <aside className="private-panel">
                <PrivateChat 
                    globalUsers={globalUsers} 
                    currentUsername={user.username} 
                    privateMessages={privateMessages}
                    sendPrivateMessage={sendPrivateMessage}
                    selectedPrivateUser={selectedPrivateUser}
                    openPrivateChat={openPrivateChat}
                    privateUnread={privateUnread}
                />
            </aside>
        </div>
    )
}

export default Dashboard;