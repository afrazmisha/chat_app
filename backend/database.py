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
    cur = con.cursor()

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