import { useState } from "react";

function ProfileEditor({ profile, onClose, onProfileUpdated}) {
    const [bio, setBio] = useState(profile.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl | "");


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
                avatarUrl: avatarUrl,
            }),
        });

        if (!response.ok) {
            alert("Failed to update profile");
            return;
        }

        const updatedProfile = await response.json();

        onProfileUpdated(updatedProfile);
        onClose();
    }

    return (
        <div className="profile-editor">
            <h3>Edit Profile</h3>

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

            <button onClick={saveProfile}>Save</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}

export default ProfileEditor;