import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "@/context/api/services";
import { User, Mail, Lock, Save, Camera, Edit2, PlayCircle, Heart, Clock, Star, TrendingUp, Award } from "lucide-react";

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
        <div className="relative min-h-screen bg-black py-12 px-4 overflow-hidden">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>

            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>

            <div className="relative max-w-6xl mx-auto">
                {/* Profile Header Card */}
                <div className="relative mb-8 animate-fade-in-down">
                    {/* Corner Decorations */}
                    <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500 animate-border-glow"></div>
                    <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500 animate-border-glow-delayed"></div>
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500 animate-border-glow"></div>
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500 animate-border-glow-delayed"></div>

                    {/* Animated Border Effect */}
                    <div className="absolute inset-0 border-scan-container overflow-hidden rounded-lg">
                        <div className="border-scan"></div>
                    </div>

                    {/* Main header card */}
                    <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-6 shadow-2xl shadow-cyan-500/10">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 rounded-full blur opacity-50 animate-gradient-rotate"></div>
                                <div className="relative">
                                    <img
                                        src={user.avatar || "https://via.placeholder.com/150"}
                                        alt="Profile Avatar"
                                        className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-cyan-500/50"
                                    />
                                    <button className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 p-2.5 rounded-full shadow-lg transition-all hover:scale-110 border border-cyan-400/30">
                                        <Camera className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 mb-2 animate-gradient-text font-mono uppercase tracking-wider">
                                    {user.displayName || user.username}
                                </h1>
                                <p className="text-cyan-300/70 mb-1 font-mono">@{user.username}</p>
                                <p className="text-gray-500 text-sm font-mono">{user.email}</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-cyan-400 font-mono">0</div>
                                    <div className="text-xs text-gray-500 font-mono uppercase">Watching</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-fuchsia-400 font-mono">0</div>
                                    <div className="text-xs text-gray-500 font-mono uppercase">Favorites</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-400 font-mono">0</div>
                                    <div className="text-xs text-gray-500 font-mono uppercase">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mb-8 overflow-x-auto animate-fade-in-up">
                    <div className="flex gap-2 min-w-max bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-6 py-3 rounded-md font-mono uppercase text-sm tracking-wider transition-all ${
                                        activeTab === tab.id
                                            ? "text-white"
                                            : "text-gray-500 hover:text-cyan-300"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-fuchsia-600 rounded-md opacity-80"></div>
                                    )}
                                    <Icon className="w-4 h-4 relative z-10" />
                                    <span className="whitespace-nowrap relative z-10">{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative">
                    {activeTab === "profile" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Edit Profile Form */}
                            <form onSubmit={handleSave} className="relative animate-fade-in-up">
                                {/* Corner Decorations */}
                                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
                                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
                                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
                                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>

                                <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 flex items-center gap-2 font-mono uppercase tracking-wider">
                                            <Edit2 className="w-5 h-5 text-cyan-400" />
                                            Edit Profile
                                        </h2>
                                    </div>

                                    {/* Username */}
                                    <div className="mb-5">
                                        <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3">
                                            Username
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                                            <input
                                                type="text"
                                                value={user.username}
                                                name="username"
                                                onChange={handleChange}
                                                className="relative w-full px-4 py-3 rounded-md bg-black/40 backdrop-blur-sm text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="mb-5">
                                        <label className="block text-purple-300 text-xs font-mono uppercase tracking-wider mb-3">
                                            Email Address
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                                            <input
                                                type="email"
                                                value={user.email}
                                                name="email"
                                                onChange={handleChange}
                                                className="relative w-full px-4 py-3 rounded-md bg-black/40 backdrop-blur-sm text-white border border-purple-500/30 focus:border-purple-400 focus:outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Display Name */}
                                    <div className="mb-5">
                                        <label className="block text-fuchsia-300 text-xs font-mono uppercase tracking-wider mb-3">
                                            Display Name
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                                            <input
                                                type="text"
                                                value={user.displayName}
                                                name="displayName"
                                                onChange={handleChange}
                                                className="relative w-full px-4 py-3 rounded-md bg-black/40 backdrop-blur-sm text-white border border-fuchsia-500/30 focus:border-fuchsia-400 focus:outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 font-mono">Public display name</p>
                                    </div>

                                    {/* Change Password Button */}
                                    <button
                                        type="button"
                                        className="w-full mb-4 py-3 rounded-md bg-black/40 border border-purple-500/30 text-purple-400 font-mono uppercase text-sm hover:bg-purple-950/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Change Password
                                    </button>

                                    {/* Save Button */}
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group/btn relative w-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* Button Border */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 rounded-md p-[2px]">
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-md animate-gradient-rotate"></div>
                                        </div>

                                        {/* Button Content */}
                                        <div className="relative bg-black rounded-md py-3.5 px-6 group-hover/btn:bg-gradient-to-r group-hover/btn:from-cyan-950/50 group-hover/btn:via-purple-950/50 group-hover/btn:to-fuchsia-950/50 transition-all duration-300">
                                            <span className="relative z-10 flex items-center justify-center gap-2 text-white font-mono uppercase tracking-wider text-sm font-bold">
                                                {saving ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Saving
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-5 h-5" />
                                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                                                            Save Changes
                                                        </span>
                                                    </>
                                                )}
                                            </span>

                                            {/* Scan Line Effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
                                        </div>
                                    </button>

                                    {error && (
                                        <div className="mt-4 p-3 rounded-md bg-red-500/10 border-l-4 border-red-500 backdrop-blur-sm animate-shake">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                <p className="text-red-400 text-sm font-mono">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Anime Stats */}
                            <div className="space-y-6">
                                {/* Watch Stats */}
                                <div className="relative animate-fade-in-up delay-100">
                                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-fuchsia-500 opacity-50"></div>
                                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500 opacity-50"></div>
                                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500 opacity-50"></div>
                                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-fuchsia-500 opacity-50"></div>

                                    <div className="relative bg-black/80 backdrop-blur-xl border border-fuchsia-500/30 rounded-lg p-6 shadow-2xl">
                                        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-fuchsia-400" />
                                            Watch Activity
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-cyan-500/10 rounded-md p-4 text-center border border-cyan-500/20">
                                                <div className="text-3xl font-bold text-cyan-400 mb-1 font-mono">0</div>
                                                <div className="text-xs text-gray-400 font-mono uppercase">Episodes</div>
                                            </div>
                                            <div className="bg-fuchsia-500/10 rounded-md p-4 text-center border border-fuchsia-500/20">
                                                <div className="text-3xl font-bold text-fuchsia-400 mb-1 font-mono">0</div>
                                                <div className="text-xs text-gray-400 font-mono uppercase">Hours</div>
                                            </div>
                                            <div className="bg-purple-500/10 rounded-md p-4 text-center border border-purple-500/20">
                                                <div className="text-3xl font-bold text-purple-400 mb-1 font-mono">0</div>
                                                <div className="text-xs text-gray-400 font-mono uppercase">Completed</div>
                                            </div>
                                            <div className="bg-indigo-500/10 rounded-md p-4 text-center border border-indigo-500/20">
                                                <div className="text-3xl font-bold text-indigo-400 mb-1 font-mono">0</div>
                                                <div className="text-xs text-gray-400 font-mono uppercase">Plan to Watch</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div className="relative animate-fade-in-up delay-200">
                                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
                                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
                                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
                                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>

                                    <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
                                        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                                            <Award className="w-5 h-5 text-cyan-400" />
                                            Account Info
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-gray-400 font-mono text-xs uppercase">User ID</span>
                                                <span className="text-white font-mono text-sm">{user.id || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-gray-400 font-mono text-xs uppercase">Status</span>
                                                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono uppercase border border-green-500/30">Active</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-400 font-mono text-xs uppercase">Member Since</span>
                                                <span className="text-white font-mono text-sm">Jan 2026</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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

            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-30px, 30px) scale(0.9); }
                }

                @keyframes float-slower {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-40px, 40px) scale(0.9); }
                    66% { transform: translate(40px, -40px) scale(1.1); }
                }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }

                @keyframes border-glow {
                    0%, 100% { opacity: 0.5; box-shadow: 0 0 5px currentColor; }
                    50% { opacity: 1; box-shadow: 0 0 15px currentColor; }
                }

                @keyframes gradient-text {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes gradient-rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                @keyframes border-scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }

                .animate-float-slow {
                    animation: float-slow 20s ease-in-out infinite;
                }

                .animate-float-slower {
                    animation: float-slower 25s ease-in-out infinite;
                }

                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                .animate-border-glow {
                    animation: border-glow 2s ease-in-out infinite;
                }

                .animate-border-glow-delayed {
                    animation: border-glow 2s ease-in-out infinite;
                    animation-delay: 1s;
                }

                .animate-gradient-text {
                    background-size: 200% auto;
                    animation: gradient-text 3s linear infinite;
                }

                .animate-gradient-rotate {
                    animation: gradient-rotate 8s linear infinite;
                }

                .animate-fade-in-down {
                    animation: fade-in-down 0.6s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .delay-100 {
                    animation-delay: 0.1s;
                }

                .delay-200 {
                    animation-delay: 0.2s;
                }

                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                }

                .border-scan-container {
                    pointer-events: none;
                }

                .border-scan {
                    position: absolute;
                    inset: -2px;
                    background: linear-gradient(
                        180deg,
                        transparent,
                        rgba(6, 182, 212, 0.5) 50%,
                        transparent
                    );
                    animation: border-scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}