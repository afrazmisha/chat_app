import psycopg2

DB_CONFIG = {
    "dbname": "chat_app",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def save_user(username):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO users (username)
        VALUES (%s)
        ON CONFLICT (username) DO NOTHING
        """,
        (username,)
    )

    conn.commit()
    cur.close()
    conn.close()

def save_room_message(room_name, username, message):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO room_messages (room_name, username, message)
        VALUES (%s, %s, %s)
        """,
        (room_name, username, message)
    )

    conn.commit()
    cur.close()
    conn.close()

def get_room_messages(room_name):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT username, message, created_at
        FROM room_messages
        WHERE room_name = %s
        ORDER BY created_at ASC
        """,
        (room_name,)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    messages = []

    for row in rows:
        messages.append({
            "type": "room_message",
            "username": row[0],
            "text": row[1],
            "time": row[2].strftime("%H:%M"),
            "room": room_name
        })

    return messages

def save_private_message(sender, receiver, message):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO private_messages (sender, receiver, message)
        VALUES (%s, %s, %s)
        """,
        (sender, receiver, message)
    )

    conn.commit()
    cur.close()
    conn.close()

def get_private_messages(user1, user2):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT sender, receiver, message, created_at
        FROM private_messages
        WHERE
            (sender = %s AND receiver = %s)
            OR
            (sender = %s AND receiver = %s)
        ORDER BY created_at ASC
        """,
        (user1, user2, user2, user1)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    messages = []

    for row in rows:
        messages.append({
            "type": "private_message",
            "from": row[0],
            "to": row[1],
            "text": row[2],
            "time": row[3].strftime("%H:%M")
        })

    return messages

def get_user_rooms(username):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT room_name
        FROM room_messages
        WHERE username = %s
        ORDER BY room_name ASC
        """,
        (username,)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [row[0] for row in rows]

def save_room_member(username, room_name):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO room_members (username, room_name)
        VALUES (%s, %s)
        ON CONFLICT (username, room_name) DO NOTHING 
        """,
        (username, room_name)
    )

    conn.commit()
    cur.close()
    conn.close()

def get_private_conversations(username):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT DISTINCT
            CASE
                WHEN sender = %s THEN receiver
                ELSE sender
            END AS other_user
        FROM private_messages
        WHERE sender = %s OR receiver = %s
        ORDER BY other_user ASC
        """,
        (username, username, username)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [row[0] for row in rows]

def create_user(username, email, password_hash):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO users (username, email, password_hash)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
        RETURNING id, username, email
        """,
        (username, email, password_hash)
    )

    user = cur.fetchone()

    if not user:
        conn.commit()
        cur.close()
        conn.close()
        return None

    return {
        "id": user[0],
        "username": user[1],
        "email": user[2]
    }

def get_user_by_email(email):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, username, email, password_hash
            FROM users
            WHERE email = %s
        """,
        (email,)
    )

    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return None

    return {
        "id": user[0],
        "username": user[1],
        "email": user[2],
        "password_hash": user[3]
    }