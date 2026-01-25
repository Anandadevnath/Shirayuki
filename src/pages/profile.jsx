import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../components/ui/toast";
import { backendClient } from "@/context/api/client";
import { ENDPOINTS } from "@/context/api/endpoints";
import { User, PlayCircle, Heart, TrendingUp } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileForm from "../components/profile/ProfileForm";
import ProfileStats from "../components/profile/ProfileStats";
import "../css/profile.css";


const TABS = [
    { id: "profile", name: "Profile", icon: User },
    { id: "watching", name: "Watching", icon: PlayCircle },
    { id: "favorites", name: "Favorites", icon: Heart },
    { id: "stats", name: "Stats", icon: TrendingUp },
];

const DEFAULT_POSTER = "/public/logo/studio-logo/cloverworks.avif";


const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getEpisodeNumber = (episodeId) => {
    const match = episodeId?.match(/ep=(\d+)/);
    return match ? match[1] : '';
};

const safeJsonParse = (str) => {
    try {
        return JSON.parse(str);
    } catch {
        return null; // ignore parse errors
    }
};

const updateLocalStorage = (key, updates) => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = safeJsonParse(stored);
            if (parsed) {
                const updated = { ...parsed, ...updates };
                localStorage.setItem(key, JSON.stringify(updated));
                return true;
            }
        }
    } catch {
        // ignore localStorage write errors
    }
    return false;
};

const normalizeUser = (data, localUser = null) => {
    const avatar = data.pfpUrl || data.avatar || localUser?.pfpUrl || localUser?.avatar || null;
    return {
        id: data.id || data.userId || data._id || null,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        tagline: data.tagline || '',
        avatar,
        pfpUrl: avatar,
    };
};


const LoadingSpinner = () => (
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

const ErrorDisplay = ({ error }) => (
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

const WatchCard = React.memo(({ item, index }) => (
    <a key={index} href={item.url} className="block group">
        <div className="relative overflow-hidden rounded-lg aspect-[2/3] min-h-[120px]">
            <img
                src={item.poster || DEFAULT_POSTER}
                alt={item.title || item.animeId.replace(/-/g, " ")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            {item.category && (
                <span className="absolute top-1 right-1 bg-purple-600 hover:bg-purple-700 text-[9px] px-1.5 py-0.5 rounded text-white font-semibold">
                    {item.category}
                </span>
            )}
            
            {item.server && (
                <span className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-[9px] px-1.5 py-0.5 rounded text-white font-semibold">
                    {item.server}
                </span>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <h3 className="font-semibold text-white text-xs line-clamp-2 mb-0.5 group-hover:text-purple-400 transition-colors">
                    {item.title || item.animeId.replace(/-/g, " ")}
                </h3>
                <div className="flex items-center gap-1 flex-wrap">
                    {item.episodeId && (
                        <span className="bg-green-700/90 hover:bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <span className="font-bold">Ep</span> {getEpisodeNumber(item.episodeId)}
                        </span>
                    )}
                    <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        {formatTime(item.watchedSeconds)} / {formatTime(item.durationSeconds)}
                    </span>
                </div>
            </div>
        </div>
    </a>
));

WatchCard.displayName = 'WatchCard';

const ContentSection = ({ children }) => (
    <div className="relative animate-fade-in-up">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-lg p-12 shadow-2xl text-center">
            {children}
        </div>
    </div>
);

const UnderConstruction = () => (
    <ContentSection>
        <div className="text-6xl mb-4 opacity-50">⚠️</div>
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-2 font-mono uppercase">
            Under Construction
        </h3>
        <p className="text-gray-400 font-mono text-sm">This feature is being developed</p>
    </ContentSection>
);

const BackgroundElements = () => (
    <>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>
    </>
);


const useLocalUser = () => {
    return useMemo(() => {
        const raw = localStorage.getItem("user");
        return raw ? safeJsonParse(raw) : null;
    }, []);
};

const useUserProfile = (userId) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const localUser = useLocalUser();

    useEffect(() => {
        let mounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            setError("");

            if (!userId) {
                if (localUser) {
                    const fallback = normalizeUser(localUser);
                    if (mounted) {
                        setUser(fallback);
                        setLoading(false);
                    }
                    return;
                }
                
                setTimeout(() => {
                    if (mounted) {
                        setError("User not logged in.");
                        setLoading(false);
                    }
                }, 0);
                return;
            }

            try {
                const endpoint = ENDPOINTS.USER.GET_USER_PROFILE(userId);
                const { data, error: apiError } = await backendClient.get(endpoint);

                if (!mounted) return;

                if (apiError || !data) {
                    if (localUser) {
                        const fallback = normalizeUser(localUser);
                        setUser(fallback);
                        setLoading(false);
                        return;
                    }
                    setError("Failed to load profile.");
                } else {
                    const normalized = normalizeUser(data, localUser);
                    setUser(normalized);
                    
                    if (localUser) {
                        updateLocalStorage("user", { 
                            pfpUrl: normalized.avatar, 
                            avatar: normalized.avatar 
                        });
                    }
                }
            } catch {
                if (mounted) {
                    setError("Failed to load profile.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            mounted = false;
        };
    }, [userId, localUser]);

    return { user, setUser, loading, error };
};

const useWatchProgress = (userId, activeTab) => {
    const [watchProgress, setWatchProgress] = useState(null);
    const [watchLoading, setWatchLoading] = useState(false);
    const [watchError, setWatchError] = useState("");

    useEffect(() => {
        if (activeTab !== "watching") return;

        let mounted = true;

        const fetchWatchProgress = async () => {
            setWatchLoading(true);
            setWatchError("");

            if (!userId) {
                setTimeout(() => {
                    if (mounted) {
                        setWatchError("User not logged in.");
                        setWatchLoading(false);
                    }
                }, 0);
                return;
            }

            try {
                const endpoint = ENDPOINTS.PROGRESS.WATCH(userId);
                const { data, error } = await backendClient.get(endpoint);

                if (!mounted) return;

                if (error || !data) {
                    setWatchError("Failed to fetch watch progress.");
                    setWatchProgress(null);
                } else {
                    setWatchProgress(data);
                }
            } catch {
                if (mounted) {
                    setWatchError("Failed to fetch watch progress.");
                }
            } finally {
                if (mounted) {
                    setWatchLoading(false);
                }
            }
        };

        fetchWatchProgress();

        return () => {
            mounted = false;
        };
    }, [activeTab, userId]);

    return { watchProgress, watchLoading, watchError };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ProfilePage() {
    const userId = localStorage.getItem("userId");
    const [activeTab, setActiveTab] = useState("profile");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const { user, setUser, loading } = useUserProfile(userId);
    const { watchProgress, watchLoading, watchError } = useWatchProgress(userId, activeTab);

    const handleChange = useCallback((e) => {
        setUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setUser]);

    const handleSave = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const { avatar, ...profileData } = user;
            const endpoint = ENDPOINTS.USER.UPDATE_USER_PROFILE(userId);
            const { error: apiError } = await backendClient.put(endpoint, { ...profileData, avatar });

            if (!apiError) {
                if (updateLocalStorage("user", { pfpUrl: avatar, avatar })) {
                    window.dispatchEvent(new Event('storage'));
                }
                showToast({
                    title: "Profile updated",
                    description: "Your profile was updated successfully.",
                    duration: 3000
                });
            } else {
                setError("Failed to save profile.");
                showToast({
                    title: "Update failed",
                    description: "Failed to save profile.",
                    duration: 3000
                });
            }
        } catch {
            setError("Failed to save profile.");
            showToast({
                title: "Update failed",
                description: "Failed to save profile.",
                duration: 3000
            });
        } finally {
            setSaving(false);
        }
    }, [user, userId, showToast]);

    const hasWatchData = useMemo(() => 
        watchProgress && Array.isArray(watchProgress.data) && watchProgress.data.length > 0,
        [watchProgress]
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error && !user) {
        return <ErrorDisplay error={error} />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="relative min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden -mt-20">
            <BackgroundElements />

            <div className="relative max-w-6xl mx-auto mt-16 w-full">
                <ProfileHeader user={user} />
                <ProfileTabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="relative">
                    {activeTab === "profile" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <ProfileForm
                                user={user}
                                handleChange={handleChange}
                                handleSave={handleSave}
                                saving={saving}
                                error={error}
                            />
                            <ProfileStats user={user} />
                        </div>
                    )}

                    {activeTab === "watching" && (
                        <ContentSection>
                            {watchLoading ? (
                                <div className="text-cyan-300 text-lg font-mono uppercase tracking-wider mb-2">
                                    Loading Watching Progress...
                                </div>
                            ) : watchError ? (
                                <div className="text-red-400 text-lg font-mono uppercase mb-2">
                                    {watchError}
                                </div>
                            ) : hasWatchData ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {watchProgress.data.map((item, idx) => (
                                        <WatchCard key={`${item.animeId}-${item.episodeId}-${idx}`} item={item} index={idx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 font-mono text-sm">
                                    No watch progress found.
                                </div>
                            )}
                        </ContentSection>
                    )}

                    {activeTab !== "profile" && activeTab !== "watching" && (
                        <UnderConstruction />
                    )}
                </div>
            </div>
        </div>
    );
}