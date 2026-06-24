import { useEffect, useState } from "react"

function ProfilePanel() {
    const [profile, setProfile] = useState(null);
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        async function loadProfile() {
            const token = localStorage.getItem("chat_token");

            const response = await fetch("http://127.0.0.1:8000/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            setProfile(data);
            setBio(data.bio || "");
            setAvatarUrl(data.avatar_url || "");
        }

        loadProfile();
    }, []);

    async function saveProfile() {
        const token = localStorage.getItem("chat_token");

        const response = await fetch("http://127.0.0.1:8000/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                bio,
                avatar_url: avatarUrl,
            }),
        });

        const data = await response.json();
        setProfile(data);
        alert("Profile updated");
    }
    
    if (!profile) {
        return <p>Loading profile....</p>
    }

    return (
        <div>
            <h3>Profile</h3>

            <p><strong>{profile.username}</strong></p>
            <p>{profile.email}</p>

            <input 
                placeholder="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
            />

            <textarea
                placeholder="Bio..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
            />

            <button onClick={saveProfile}>
                Save Profile
            </button>
        </div>
    )
}

export default ProfilePanel;