import { useState } from "react";

function PrivateChat({ globalUsers, currentUsername, privateMessages, sendPrivateMessage }) {
    const [selectedUser, setSelectedUser] = useState(null)
    const [text, setText] = useState("")

    const otherUsers = globalUsers.filter(
        (username) => username !== currentUsername
    );

    const messages = selectedUser 
    ? privateMessages[selectedUser] || [] : [];

    function handleSend() {
        if (!selectedUser) return;

        sendPrivateMessage(selectedUser, text);
        setText("");
    }

    return(
        <div>
            <h3>Private Chat</h3>
            
            <h4>Online Users</h4>

            {otherUsers.map((username) => (
                <button key={username} onClick={() => setSelectedUser(username)}>
                    {username}
                </button>
            ))}

            <hr />

            {selectedUser ? (
                <>
                    <h4>Chat with {selectedUser}</h4>

                    <div style={{
                        border: "1px solid black",
                        height: "250px",
                        overflowY: "auto",
                        marginBottom: "10px"
                    }}>
                        {messages.map((message, index) => (
                            <p key={index}>
                                <strong>{message.from}</strong>: {message.text}
                            </p>
                        ))}
                    </div>

                    <input 
                        placeholder="Type private message"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                    />

                    <button onClick={handleSend}>
                        Send
                    </button>
                </>
            ) : (
                <p>Select a user to start private chat.</p>
            )}
        </div>
    )
}

export default PrivateChat;