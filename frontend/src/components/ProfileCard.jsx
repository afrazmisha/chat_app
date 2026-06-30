import { useEffect, useState } from "react"
import "./ProfileCard.css"
import ProfileEditor from "./ProfileEditor";

function ProfileCard() {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            const token = localStorage.getItem("chat_token");

            const response = await fetch(
                "http://127.0.0.1:8000/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setProfile(data);;
        }

        loadProfile();
    }, []);

    if (!profile) {
        return <div>Loading profile...</div>
    }

    return (
        <div className="profile-card">
            <div className="profile-avatar">
                {profile.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        width="90"
                        height="90"
                        style={{
                            borderRadius: "50%",
                            objectFit: "cover"
                        }}
                    />
                ) : (
                    "👤"
                )}
            </div>

            <h3>{profile.username}</h3>

            <p className="profile-email">
                {profile.email}
            </p>

            <p className="profile-bio">
                {profile.bio || "No bio added yet."}
            </p>

            <p className="profile-date">
                Member since{" "} 
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                })}
            </p>

            {profile.is_online ? (
                <p className="profile-status online">
                    🟢 Online
                </p>
            ) : (
                <p className="profile-status offline">
                    ⚫ Last seen{" "}
                    {profile.last_seen
                        ? new Date(profile.last_seen).toLocaleString()
                        : "Unknown"
                    }
                </p>
            )}

            <button onClick={() => setIsEditing(true)}>
                Edit Profile
            </button>

            {isEditing && (
                <ProfileEditor
                    profile={profile}
                    onClose={() => setIsEditing(false)}
                    onProfileUpdated={setProfile}
                />
            )}
        </div>
    )
}

export default ProfileCard;