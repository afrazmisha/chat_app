import { useState } from "react";

function LoginPage({ setUser, setAuthMode }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password
            }),
        });
        
        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Login failed");
            return;
        }

        localStorage.setItem("chat_token", data.access_token);
        setUser(data.user);
    }

    return(
        
        <div>
            <h1>Login</h1>

            <input 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <br />
            <br />

            <input 
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <br />
            <br />

            <button onClick={handleLogin}>
                Login
            </button>

            <p>
                Don&apos;t have an account?{" "}
                <button onClick={() => setAuthMode("signup")}>
                    Signup
                </button>
            </p>
        </div>
    )
}

export default LoginPage;