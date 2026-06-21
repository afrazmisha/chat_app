import { useState } from "react";

function SignupPage({ setAuthMode }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    async function  handleSignup() {
        const response = await fetch("http://127.0.0.1:8000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        alert("Account created successfully");
        setAuthMode("login");
    }

    return (
        <div>
            <h1>Signup</h1>

            <input 
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <br /><br />

            <input 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <button onClick={handleSignup}>
                Create Account
            </button>

            <p>
                Already have an account?{" "}
                <button onClick={() => setAuthMode("login")}>
                    Login
                </button>    
            </p>
        </div>
    );
}

export default SignupPage;