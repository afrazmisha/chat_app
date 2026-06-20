function MessageBubble({ message, currentUsername }) {
  if (message.type === "message" || message.type === "room_message") {
    return (
      <p style={{ textAlign: "center", color: "gray" }}>
        {message.text}
      </p>
    );
  }

  const isMine = message.username === currentUsername;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          border: "1px solid black",
          borderRadius: "10px",
          padding: "8px",
          maxWidth: "60%",
        }}
      >
        {!isMine && <strong>{message.username}</strong>}

        <p>{message.text}</p>

        <small>{message.time}</small>
      </div>
    </div>
  );
}

export default MessageBubble;