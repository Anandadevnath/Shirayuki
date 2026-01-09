import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "@/context/api/services";
import { User, Mail, Lock, Save, Upload, Heart, Bell, Settings, PlayCircle, FileDown, FileUp, Camera, Edit2 } from "lucide-react";

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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-[#1a0f2e] to-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-[#1a0f2e] to-black">
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 max-w-md">
                    <p className="text-red-400 text-center text-lg">{error}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const tabs = [
        { id: "profile", name: "Profile", icon: User },
        { id: "watching", name: "Continue Watching", icon: PlayCircle },
        { id: "bookmarks", name: "Bookmarks", icon: Heart },
        { id: "notifications", name: "Notifications", icon: Bell },
        { id: "import", name: "Import/Export", icon: FileDown },
        { id: "settings", name: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0f2e] to-black py-8 px-4">
            {/* Subtle center glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-6xl mx-auto">
                {/* Profile Header Card */}
                <div className="relative group mb-8">
                    {/* Glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                    {/* Main header card */}
                    <div className="relative bg-[#1a0d2e]/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-50 group-hover/avatar:opacity-75 transition"></div>
                                <div className="relative">
                                    <img
                                        src={user.avatar || "https://via.placeholder.com/150"}
                                        alt="Profile Avatar"
                                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-500/30"
                                    />
                                    <button className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 p-2 rounded-full shadow-lg transition-all hover:scale-110">
                                        <Camera className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {user.displayName || user.username}
                                </h1>
                                <p className="text-zinc-400 mb-1">@{user.username}</p>
                                <p className="text-zinc-500 text-sm">{user.email}</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4 md:gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-400">0</div>
                                    <div className="text-xs text-zinc-500">Watching</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-pink-400">0</div>
                                    <div className="text-xs text-zinc-500">Bookmarks</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">0</div>
                                    <div className="text-xs text-zinc-500">Reviews</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mb-8 overflow-x-auto">
                    <div className="flex gap-2 min-w-max bg-[#1a0d2e]/40 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === tab.id
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="whitespace-nowrap">{tab.name}</span>
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
                            <form onSubmit={handleSave} className="relative group">
                                {/* Glow effect */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                                <div className="relative bg-[#1a0d2e]/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Edit2 className="w-6 h-6 text-purple-400" />
                                            Edit Profile
                                        </h2>
                                    </div>

                                    {/* Username */}
                                    <div className="mb-5">
                                        <label className="block text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4 text-purple-400" />
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={user.username}
                                            name="username"
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-[#2a1a4a]/40 backdrop-blur-sm text-white border border-purple-500/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-5">
                                        <label className="block text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-purple-400" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            name="email"
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-[#2a1a4a]/40 backdrop-blur-sm text-white border border-purple-500/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                        />
                                    </div>

                                    {/* Display Name */}
                                    <div className="mb-5">
                                        <label className="block text-zinc-300 text-sm font-medium mb-2">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={user.displayName}
                                            name="displayName"
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-[#2a1a4a]/40 backdrop-blur-sm text-white border border-purple-500/20 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">This name will be displayed on public pages</p>
                                    </div>

                                    {/* Change Password Button */}
                                    <button
                                        type="button"
                                        className="w-full mb-4 py-3 rounded-xl bg-[#2a1a4a]/30 border border-purple-500/20 text-purple-400 font-medium hover:bg-[#2a1a4a]/50 hover:border-purple-500/40 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Change Password
                                    </button>

                                    {/* Save Button */}
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group/btn relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {/* Button background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 group-hover/btn:bg-pos-100 transition-all duration-500"></div>

                                        {/* Button glow */}
                                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 blur-lg bg-gradient-to-r from-purple-600 to-pink-600 transition-opacity duration-300"></div>

                                        {/* Button text */}
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {saving ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Save Changes
                                                </>
                                            )}
                                        </span>
                                    </button>

                                    {error && (
                                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <p className="text-red-400 text-sm text-center">{error}</p>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Profile Stats & Info */}
                            <div className="space-y-6">
                                {/* Account Info */}
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                                    <div className="relative bg-[#1a0d2e]/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-zinc-400">User ID</span>
                                                <span className="text-white font-mono text-sm">{user.id || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-zinc-400">Member Since</span>
                                                <span className="text-white">January 2026</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-zinc-400">Account Status</span>
                                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Active</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-zinc-400">Subscription</span>
                                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">Free</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Stats */}
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                                    <div className="relative bg-[#1a0d2e]/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold text-white mb-4">Activity</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-purple-400 mb-1">0</div>
                                                <div className="text-sm text-zinc-400">Episodes Watched</div>
                                            </div>
                                            <div className="bg-pink-500/10 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-pink-400 mb-1">0</div>
                                                <div className="text-sm text-zinc-400">Hours Watched</div>
                                            </div>
                                            <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
                                                <div className="text-sm text-zinc-400">Completed</div>
                                            </div>
                                            <div className="bg-indigo-500/10 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-indigo-400 mb-1">0</div>
                                                <div className="text-sm text-zinc-400">Reviews</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== "profile" && (
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20"></div>

                            <div className="relative bg-[#1a0d2e]/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 shadow-2xl text-center">
                                <div className="text-6xl mb-4">🚧</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                                <p className="text-zinc-400">This feature is under development</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .bg-size-200 {
                    background-size: 200% 100%;
                }
                .bg-pos-0 {
                    background-position: 0% 0%;
                }
                .bg-pos-100 {
                    background-position: 100% 0%;
                }
            `}</style>
        </div>
    );
}