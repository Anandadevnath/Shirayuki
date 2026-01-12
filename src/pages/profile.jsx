import React, { useState, useEffect } from "react";
import { useToast } from "../components/ui/toast";
import { backendClient } from "@/context/api/client";
import { ENDPOINTS } from "@/context/api/endpoints";
import { User, PlayCircle, Heart, TrendingUp } from "lucide-react";
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
    const [watchProgress, setWatchProgress] = useState(null);
    const [watchLoading, setWatchLoading] = useState(false);
    const [watchError, setWatchError] = useState("");

    useEffect(() => {
        if (activeTab === "watching") {
            setWatchLoading(true);
            setWatchError("");
            if (!userId) {
                setWatchError("User not logged in.");
                setWatchLoading(false);
                return;
            }
            const endpoint = ENDPOINTS.PROGRESS.WATCH(userId);
            backendClient.get(endpoint)
                .then(({ data, error }) => {
                    if (error || !data) {
                        setWatchError("Failed to fetch watch progress.");
                        setWatchProgress(null);
                    } else {
                        setWatchProgress(data);
                    }
                    setWatchLoading(false);
                })
                .catch(() => {
                    setWatchError("Failed to fetch watch progress.");
                    setWatchLoading(false);
                });
        }
    }, [activeTab, userId]);

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
            const endpoint = ENDPOINTS.USER.GET_USER_PROFILE(userId);
            const { data, error } = await backendClient.get(endpoint);
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
        const { avatar, ...profileData } = user;
        const endpoint = ENDPOINTS.USER.UPDATE_USER_PROFILE(userId);
        const { data, error } = await backendClient.put(endpoint, { ...profileData, avatar });
        if (!error) {
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
                    {activeTab === "watching" && (
                        <div className="relative animate-fade-in-up">
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>
                            <div className="relative bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-lg p-12 shadow-2xl text-center">
                                {watchLoading ? (
                                    <>
                                        <div className="text-cyan-300 text-lg font-mono uppercase tracking-wider mb-2">Loading Watching Progress...</div>
                                    </>
                                ) : watchError ? (
                                    <>
                                        <div className="text-red-400 text-lg font-mono uppercase mb-2">{watchError}</div>
                                    </>
                                ) : watchProgress && Array.isArray(watchProgress.data) && watchProgress.data.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {watchProgress.data.map((item, idx) => {
                                            // Custom card for watching section with redirect to item.url
                                            const anime = {
                                                id: item.animeId,
                                                poster: item.poster || "/public/logo/studio-logo/cloverworks.avif",
                                                name: item.animeId.replace(/-/g, " "),
                                                type: item.category,
                                                episodes: { sub: item.episodeId },
                                                rating: item.server,
                                            };
                                            return (
                                                <a
                                                    key={idx}
                                                    href={item.url}
                                                    className="block group"
                                                >
                                                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[2/3]">
                                                        <img
                                                            src={anime.poster}
                                                            alt={anime.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                        {/* Type Badge */}
                                                        {anime.type && (
                                                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-purple-600 hover:bg-purple-700 text-[10px] sm:text-xs px-2 py-0.5 rounded text-white font-semibold">{anime.type}</span>
                                                        )}
                                                        {/* Rating Badge */}
                                                        {anime.rating && (
                                                            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-600 hover:bg-red-700 text-[10px] sm:text-xs px-2 py-0.5 rounded text-white font-semibold">{anime.rating}</span>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                                                            <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors">
                                                                {anime.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                {anime.episodes?.sub && (
                                                                    <span className="bg-pink-500/90 hover:bg-pink-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3 sm:h-3"><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                                                                        {anime.episodes.sub}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 font-mono text-sm">No watch progress found.</div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab !== "profile" && activeTab !== "watching" && (
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