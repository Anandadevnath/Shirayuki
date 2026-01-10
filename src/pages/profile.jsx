import React, { useState, useEffect } from "react";
import { useToast } from "../components/ui/toast";
import { getUserProfile, updateUserProfile } from "@/context/api/services";
import { User, PlayCircle, Heart, TrendingUp, Edit2, Lock, Save, Camera, Clock, Award } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileForm from "../components/profile/ProfileForm";
import ProfileStats from "../components/profile/ProfileStats";
import "../css/profile.css";

export default function ProfilePage() {
    const userId = localStorage.getItem("userId");
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("profile");
    const { showToast } = useToast();

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            setError("");
            let localUser = null;
            const raw = localStorage.getItem("user");
            if (raw) {
                try {
                    localUser = JSON.parse(raw);
                } catch (e) { }
            }
            if (!userId) {
                if (localUser) {
                    const fallback = {
                        id: localUser.userId || localUser._id || localUser.id,
                        username: localUser.username,
                        email: localUser.email,
                        displayName: localUser.displayName || localUser.username,
                        tagline: localUser.tagline || '',
                        avatar: localUser.pfpUrl || localUser.avatar || null,
                    };
                    setUser(fallback);
                    setLoading(false);
                    return;
                }
                setError("User not logged in.");
                setLoading(false);
                return;
            }
            const { data, error } = await getUserProfile(userId);
            if (error || !data) {
                if (localUser) {
                    const fallback = {
                        id: localUser.userId || localUser._id || localUser.id,
                        username: localUser.username,
                        email: localUser.email,
                        tagline: localUser.tagline || '',
                        avatar: localUser.pfpUrl || localUser.avatar || null,
                    };
                    setUser(fallback);
                    setLoading(false);
                    return;
                }
                setError("Failed to load profile.");
            } else {
                // Prefer avatar from localStorage if available
                let avatar = data.pfpUrl || data.avatar || null;
                if (localUser && (localUser.pfpUrl || localUser.avatar)) {
                    avatar = localUser.pfpUrl || localUser.avatar;
                }
                const normalized = {
                    id: data.id || data.userId || data._id || null,
                    username: data.username,
                    email: data.email,
                    tagline: data.tagline || '',
                    avatar,
                    pfpUrl: avatar,
                };
                setUser(normalized);
                try {
                    if (localUser) {
                        localUser.pfpUrl = avatar;
                        localUser.avatar = avatar;
                        localStorage.setItem("user", JSON.stringify(localUser));
                    }
                } catch { }
            }
            setLoading(false);
        }
        fetchProfile();
    }, [userId]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        // Save avatar and other profile data to backend
        const { avatar, ...profileData } = user;
        const { data, error } = await updateUserProfile(userId, { ...profileData, avatar });
        if (!error) {
            // Update localStorage user object
            try {
                const stored = localStorage.getItem("user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.pfpUrl = avatar;
                    parsed.avatar = avatar;
                    localStorage.setItem("user", JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch { }
            showToast({ title: "Profile updated", description: "Your profile was updated successfully.", duration: 3000 });
        } else {
            setError("Failed to save profile.");
            showToast({ title: "Update failed", description: "Failed to save profile.", duration: 3000 });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden -mt-20">
                <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>
                <div className="relative text-center">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-cyan-500/50 blur-xl rounded-full animate-pulse-glow"></div>
                        <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-cyan-400 mx-auto mb-4"></div>
                    </div>
                    <p className="text-cyan-300 text-lg font-mono uppercase tracking-wider">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>
                <div className="relative bg-black/80 border-l-4 border-red-500 backdrop-blur-xl rounded-lg p-8 max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-red-400 text-lg font-mono uppercase">Error</p>
                    </div>
                    <p className="text-red-300 font-mono text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const tabs = [
        { id: "profile", name: "Profile", icon: User },
        { id: "watching", name: "Watching", icon: PlayCircle },
        { id: "favorites", name: "Favorites", icon: Heart },
        { id: "stats", name: "Stats", icon: TrendingUp },
    ];

    return (
        <div className="relative min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden -mt-20">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>

            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>

            <div className="relative max-w-6xl mx-auto mt-16 w-full">
                {/* Profile Header Card */}
                <ProfileHeader user={user} />
                {/* Tabs Navigation */}
                <ProfileTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Content Area */}
                <div className="relative">
                    {activeTab === "profile" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <ProfileForm user={user} handleChange={handleChange} handleSave={handleSave} saving={saving} error={error} />
                            </div>
                            <div>
                                <ProfileStats user={user} />
                            </div>
                        </div>
                    )}
                    {activeTab !== "profile" && (
                        <div className="relative animate-fade-in-up">
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>
                            <div className="relative bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-lg p-12 shadow-2xl text-center">
                                <div className="text-6xl mb-4 opacity-50">⚠️</div>
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-2 font-mono uppercase">Under Construction</h3>
                                <p className="text-gray-400 font-mono text-sm">This feature is being developed</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}