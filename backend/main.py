import bcrypt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from database import (
    save_user, 
    save_room_message, 
    save_private_message,
    get_room_messages,
    get_private_messages,
    get_user_rooms,
    save_room_member,
    get_private_conversations,
    get_user_by_email,
)
from pydantic import BaseModel
from database import create_user
from jose import jwt, JWTError

SECRET_KEY = "change-this-secret-key-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def home():
    return {"message": "Chat backend is running"}

@app.post("/signup")
def signup(user: SignupRequest):
    try:
        password_hash = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        new_user = create_user(
            user.username,
            user.email,
            password_hash
        )

        if not new_user:
            return {"error": "Username or email already exists"}

        return {
            "message": "User created successfully",
            "user": new_user
        }

    except Exception:
        return {
            "error": "Username or email already exists"
        }

@app.post("/login")
def login(user: LoginRequest):
    db_user = get_user_by_email(user.email)

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = bcrypt.checkpw(
        user.password.encode("utf-8"),
        db_user["password_hash"].encode("utf-8")
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": db_user["email"],
        "username": db_user["username"]
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user["email"]
        }
    }

@app.get("/rooms/{room_name}/messages")
def room_message_history(
    room_name: str,
    current_user: dict = Depends(get_current_user)
):
    return get_room_messages(room_name)

@app.get("/private/{user1}/{user2}/messages")
def private_message_history(
    user1: str, 
    user2: str,
    current_user: dict = Depends(get_current_user)
):
    return get_private_messages(user1, user2)

@app.get("/users/{username}/rooms")
def user_rooms(username: str):
    return get_user_rooms(username)

@app.get("/users/{username}/private-conversations")
def user_private_conversations(username: str):
    return get_private_conversations(username)

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
    save_room_member(username, room)
    
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

