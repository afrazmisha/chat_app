import { useState } from "react";

function PrivateChat({ globalUsers, currentUsername, privateMessages, sendPrivateMessage, selectedPrivateUser, openPrivateChat, privateUnread, privateConversations, }) {
    const [text, setText] = useState("")

    const otherUsers = globalUsers.filter(
        (username) => username !== currentUsername
    );

    const allCoversations = Array.from(
        new Set([...privateConversations, ...otherUsers])
    );

    const messages = selectedPrivateUser
        ? privateMessages[selectedPrivateUser] || [] : [];


    function handleSend() {
        if (!selectedPrivateUser) return;

        sendPrivateMessage(selectedPrivateUser, text);
        setText("");
    }

    return (
        <div>
            <h3>Private Chat</h3>

            <h4>Conversations</h4>

            {allCoversations.map((username) => {
                const isOnline = globalUsers.includes(username);

                return (
                    <button
                        key={username}
                        onClick={() => openPrivateChat(username)}
                        className={username === selectedPrivateUser ? "active-private" : "private-user"}
                    >
                        {username} {isOnline ? "🟢" : "⚪"}
                        {privateUnread[username] > 0 && ` (${privateUnread[username]})`}
                    </button>
                )
            })}

            <hr />

            {selectedPrivateUser ? (
                <>
                    <h4>Chat with {selectedPrivateUser}</h4>

                    <div style={{
                        border: "1px solid black",
                        height: "250px",
                        overflowY: "auto"
                    }}>
                        {messages.map((message, index) => (
                            <p key={index}>
                                <strong>{message.from}</strong>: {message.text}
                                <br />
                                <small>{message.time}</small>
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