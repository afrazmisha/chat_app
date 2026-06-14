from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Chat backend is running"}


class ConnectionManager:
    def __init__(self):
        self.rooms = {}
        self.users = {}

    async def connect(self, room: str, username: str, websocket: WebSocket):
        await websocket.accept()

        if room not in self.rooms:
            self.rooms[room] = []
            self.users[room] = []

        self.rooms[room].append(websocket)
        self.users[room].append(username)

    def disconnect(self, room: str, username: str, websocket: WebSocket):
        if room in self.rooms:
            if websocket in self.rooms[room]:
                self.rooms[room].remove(websocket)

            if username in self.users[room]:
                self.users[room].remove(username)

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


manager = ConnectionManager()


@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    await manager.connect(room, username, websocket)
    
    await manager.broadcast(room, {
        "type": "system",
        "text": f"{username}: joined the room"
        })
    
    await manager.broadcast_users(room)

    try:
        while True:
            message = await websocket.receive_text()
            timestamp = datetime.now().strftime("%H:%M")

            await manager.broadcast(room, {
                "type": "message",
                "username": username,
                "text": message,
                "time": timestamp
            })

    except WebSocketDisconnect:
        manager.disconnect(room, username, websocket)

        await manager.broadcast(room, {
            "type": "system",
            "text": f"System: {username} left the room"
        })

        await manager.broadcast_users(room)