import React, { useState, useEffect } from "react";
import "../css/profile.css";
import { getUserProfile, updateUserProfile } from "@/context/api/services";
import { User, PlayCircle, Heart, TrendingUp, Edit2, Lock, Save, Camera, Clock, Award } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileForm from "../components/profile/ProfileForm";
import ProfileStats from "../components/profile/ProfileStats";

export default function ProfilePage() {
    const userId = localStorage.getItem("userId");
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            setError("");
            if (!userId) {
                const raw = localStorage.getItem("user");
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        const fallback = {
                            id: parsed.userId || parsed._id || parsed.id,
                            username: parsed.username,
                            email: parsed.email,
                            displayName: parsed.displayName || parsed.username,
                            avatar: parsed.pfpUrl || parsed.pfpUrl || parsed.avatar || null,
                        };
                        setUser(fallback);
                        setLoading(false);
                        return;
                    } catch (e) {
                    }
                }
                setError("User not logged in.");
                setLoading(false);
                return;
            }
            const { data, error } = await getUserProfile(userId);
            if (error || !data) {
                const raw = localStorage.getItem("user");
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        const fallback = {
                            id: parsed.userId || parsed._id || parsed.id,
                            username: parsed.username,
                            email: parsed.email,
                            displayName: parsed.displayName || parsed.username,
                            avatar: parsed.pfpUrl || parsed.avatar || null,
                        };
                        setUser(fallback);
                        setLoading(false);
                        return;
                    } catch (e) {
                    }
                }
                setError("Failed to load profile.");
            } else {
                const normalized = {
                    id: data.id || data.userId || data._id || null,
                    username: data.username,
                    email: data.email,
                    displayName: data.displayName || data.username,
                    avatar: data.avatar || data.pfpUrl || null,
                };
                setUser(normalized);
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
        const { data, error } = await updateUserProfile(userId, user);
        if (error) setError("Failed to save profile.");
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
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
        <div className="relative min-h-screen bg-black py-12 px-4 overflow-hidden -mt-20">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>

            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>

            <div className="relative max-w-6xl mx-auto mt-16">
                {/* Profile Header Card */}
                <ProfileHeader user={user} />
                {/* Tabs Navigation */}
                <ProfileTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Content Area */}
                <div className="relative">
                    {activeTab === "profile" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <ProfileForm user={user} handleChange={handleChange} handleSave={handleSave} saving={saving} error={error} />
                            <ProfileStats user={user} />
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