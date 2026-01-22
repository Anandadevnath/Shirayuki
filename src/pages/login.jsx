import { useState } from "react";
import { useToast } from "../components/ui/toast";
import { ENDPOINTS } from "../context/api/endpoints";
import { BACKEND_BASE_URL } from "../context/api/config";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from "lucide-react";
import "../css/login.css";
import { getUserProfile } from "../context/api/services";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("isLoggedIn", "true");
        try {
          if (data?.token) localStorage.setItem("token", data.token);
        } catch (err) {
          console.warn('Failed to persist user data to localStorage', err);
        }

        const extractId = (id) => {
          if (!id) return null;
          if (typeof id === 'string') return id;
          if (id.$oid) return id.$oid;
          try {
            const s = id.toString();
            const m = s.match(/ObjectId\("?([0-9a-fA-F]{24})"?\)/);
            if (m) return m[1];
            return s;
          } catch { return null; }
        };

        const uid = extractId(data?.user?.userId ?? data?.user?._id ?? data?.user?.id);
        if (uid) localStorage.setItem('userId', uid);

        if (uid) {
          try {
            const { data: profileData } = await getUserProfile(uid);
            if (profileData) {
              localStorage.setItem("user", JSON.stringify(profileData));
            }
          } catch {
            if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
          }
        } else if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        window.dispatchEvent(new Event("storage"));
        showToast({ title: "Login successful", description: "Welcome back!", duration: 3000 });
        navigate("/");
      } else {
        setError(data.message || "Login failed");
        showToast({ title: "Login failed", description: data.message || "Login failed", duration: 3000 });
      }
    } catch {
      setError("Network error");
      showToast({ title: "Network error", description: "Please try again later.", duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-200px)] -mt-20 py-12 sm:py-16 md:py-20 overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md px-6 mt-4">
        {/* Logo Section */}
        <div className="text-center mb-6 mt-8 sm:mt-0">
          <div className="relative inline-block">
            <p className="text-cyan-300/80 text-sm tracking-widest uppercase font-mono">
              System Access Portal
            </p>
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>
        </div>

        {/* Main Form Card */}
        <form onSubmit={handleLogin} className="relative animate-fade-in-up">
          {/* Corner Decorations */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500 animate-border-glow"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500 animate-border-glow-delayed"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500 animate-border-glow"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500 animate-border-glow-delayed"></div>

          {/* Animated Border Effect */}
          <div className="absolute inset-0 border-scan-container overflow-hidden rounded-lg">
            <div className="border-scan"></div>
          </div>

          {/* Main Card Content */}
          <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-8 shadow-2xl shadow-cyan-500/10">
            {/* Diagonal Lines Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-transparent transform rotate-45 translate-x-8 -translate-y-8"></div>
            </div>

            {/* Title */}
            <div className="relative mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 text-center mb-2 animate-gradient-text">
                AUTHENTICATE
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500"></div>
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-fuchsia-500"></div>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-md bg-black/40 backdrop-blur-sm text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all placeholder:text-gray-600 font-mono text-sm"
                    required
                  />
                  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none rounded-r-md"></div>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse"></div>
                Password
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Lock className="h-5 w-5 text-fuchsia-500/50 group-focus-within:text-fuchsia-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-md bg-black/40 backdrop-blur-sm text-white border border-fuchsia-500/30 focus:border-fuchsia-400 focus:outline-none transition-all placeholder:text-gray-600 font-mono text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-500 hover:text-white transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-fuchsia-500/5 to-transparent pointer-events-none rounded-r-md"></div>
                </div>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between mb-6 text-xs">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 border border-cyan-500/50 rounded bg-black/40 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M4.5 8.5L1.5 5.5 2.5 4.5 4.5 6.5 9.5 1.5 10.5 2.5z" />
                    </svg>
                  </div>
                </div>
                <span className="ml-2 text-gray-400 group-hover:text-cyan-300 transition-colors font-mono">Remember Session</span>
              </label>
              <a
                href="/updatePassword"
                className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-mono"
                style={{ textDecoration: 'none' }}
              >
                Reset Access
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-500/10 border-l-4 border-red-500 backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-red-400 text-sm font-mono">{error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mb-8 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Button Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 rounded-md p-[2px]">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-md animate-gradient-rotate"></div>
              </div>

              {/* Button Content */}
              <div className="relative bg-black rounded-md py-4 px-6 group-hover:bg-gradient-to-r group-hover:from-cyan-950/50 group-hover:via-purple-950/50 group-hover:to-fuchsia-950/50 transition-all duration-300">
                <span className="relative z-10 flex items-center justify-center gap-3 text-white font-mono uppercase tracking-wider text-sm font-bold">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating
                    </>
                  ) : (
                    <>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                        Initialize Access
                      </span>
                      <ArrowRight className="h-5 w-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>

                {/* Scan Line Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
              </div>
            </button>

            {/* Register Link */}
            <div className="text-center border-t border-gray-800 pt-6">
              <span className="text-gray-500 text-sm font-mono">New User? </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 hover:from-cyan-300 hover:to-fuchsia-300 transition-all"
              >
                CREATE_ACCOUNT →
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}