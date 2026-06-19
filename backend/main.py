from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
from database import (
    save_user, 
    save_room_message, 
    save_private_message,
    get_room_messages,
)

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Chat backend is running"}

@app.get("/rooms/{room_name}/messages")
def room_message_history(room_name: str):
    return get_room_messages(room_name)

class ConnectionManager:
    def __init__(self):
        self.rooms = {}
        self.users = {}
        self.active_users = {}

    async def connect(self, room: str, username: str, websocket: WebSocket):
        await websocket.accept()

        if room not in self.rooms:
            self.rooms[room] = []
            self.users[room] = []

        self.rooms[room].append(websocket)
        self.users[room].append(username)
        self.active_users[username] = websocket

    def disconnect(self, room: str, username: str, websocket: WebSocket):
        if room in self.rooms:
            if websocket in self.rooms[room]:
                self.rooms[room].remove(websocket)

            if username in self.users[room]:
                self.users[room].remove(username)

                if username in self.active_users:
                    del self.active_users[username]

            if len(self.rooms[room]) == 0:
                del self.rooms[room]
                del self.users[room]

    async def broadcast(self, room: str, data: dict):
        disconnected = []

        for connection in self.rooms.get(room, []):
            try:
                await connection.send_json(data)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except RuntimeError:
                disconnected.append(connection)

        for connection in disconnected:
            if connection in self.rooms.get(room, []):
                self.rooms[room].remove(connection)

    async def broadcast_users(self, room: str):
        await self.broadcast(room, {
            "type": "users",
            "users": self.users.get(room, [])
        })

    async def broadcast_global_users(self):
        global_users = list(self.active_users.keys())
        
        for connection in self.active_users.values():
            await connection.send_json({
                "type": "global_users",
                "users": global_users
                })

    async def send_private_message(self, sender: str, receiver: str, data: dict):
        sender_socket = self.active_users.get(sender)
        receiver_socket = self.active_users.get(receiver)

        if sender_socket:
            await sender_socket.send_json(data)

        if receiver_socket and receiver_socket != sender_socket:
            await receiver_socket.send_json(data)

manager = ConnectionManager()


@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    await manager.connect(room, username, websocket)

    save_user(username)
    
    await manager.broadcast(room, {
        "type": "system",
        "text": f"{username}: joined the room"
        })
    
    await manager.broadcast_users(room)
    await manager.broadcast_global_users()

    try:
        while True:
            raw_message = await websocket.receive_json()
            timestamp = datetime.now().strftime("%H:%M")

            if raw_message["type"] == "room_message":
                save_room_message(
                    room,
                    username,
                    raw_message["text"]
                )
                
                await manager.broadcast(room, {
                    "type": "room_message",
                    "username": username,
                    "text": raw_message["text"],
                    "time": timestamp,
                    "room": room
                })

            elif raw_message["type"] == "private_message":
                receiver = raw_message["to"]

                save_private_message(
                    username,
                    receiver,
                    raw_message["text"]
                )

                await manager.send_private_message(username, receiver, {
                    "type": "private_message",
                    "from": username,
                    "to": receiver,
                    "text": raw_message["text"],
                    "time": timestamp
                })

    except WebSocketDisconnect:
        manager.disconnect(room, username, websocket)

        await manager.broadcast(room, {
            "type": "system",
            "text": f"System: {username} left the room"
        })

        await manager.broadcast_users(room)
        await manager.broadcast_global_users()

