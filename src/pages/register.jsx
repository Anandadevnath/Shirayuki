import { useState } from "react";
import { useToast } from "../components/ui/toast";
import { ENDPOINTS } from "../context/api/endpoints";
import { BACKEND_BASE_URL } from "../context/api/config";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, Shield } from "lucide-react";
import "../css/register.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tagline, setTagline] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validatePassword = (pwd) => {
    const errors = [];
    
    if (pwd.length < 8) {
      errors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("one lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push("one special character (!@#$%^&*...)");
    }
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate password before sending request
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const errorMsg = `Password must contain: ${passwordErrors.join(", ")}`;
      setError(errorMsg);
      showToast({ 
        title: "Weak Password", 
        description: errorMsg, 
        duration: 5000 
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}${ENDPOINTS.AUTH.REGISTER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, tagline }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Registration successful", description: "You can now log in.", duration: 3000 });
        navigate("/login");
      } else {
        // Parse backend error message for detailed feedback
        let errorDescription = data.message || "Registration failed";
        
        // Check for common backend validation errors
        if (data.message) {
          if (data.message.toLowerCase().includes("password")) {
            // If backend returns password requirements, show them
            errorDescription = data.message;
          } else if (data.message.toLowerCase().includes("email")) {
            errorDescription = "Email is invalid or already in use";
          } else if (data.message.toLowerCase().includes("username")) {
            errorDescription = "Username is invalid or already taken";
          }
        }
        
        setError(errorDescription);
        showToast({ 
          title: "Registration failed", 
          description: errorDescription, 
          duration: 5000 
        });
      }
    } catch { /* ignore error */
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

      {/* Register Container */}
      <div className="relative z-10 w-full max-w-md px-6 my-8">
        {/* Logo Section */}
        <div className="text-center mb-12 mt-8 sm:mt-0 relative ">
          <div className="relative inline-block">
            <p className="text-fuchsia-300/80 text-sm tracking-widest uppercase font-mono">
              New User Registration
            </p>
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"></div>
          </div>
        </div>

        {/* Main Form Card */}
        <form onSubmit={handleRegister} className="relative animate-fade-in-up -mt-5">
          {/* Corner Decorations */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-fuchsia-500 animate-border-glow"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500 animate-border-glow-delayed"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500 animate-border-glow"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-fuchsia-500 animate-border-glow-delayed"></div>

          {/* Animated Border Effect */}
          <div className="absolute inset-0 border-scan-container overflow-hidden rounded-lg">
            <div className="border-scan-register"></div>
          </div>

          {/* Main Card Content */}
          <div className="relative bg-black/80 backdrop-blur-xl border border-fuchsia-500/30 rounded-lg p-8 shadow-2xl shadow-fuchsia-500/10">
            {/* Diagonal Lines Decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-transparent transform -rotate-45 -translate-x-8 -translate-y-8"></div>
            </div>

            {/* Title */}
            <div className="relative mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 text-center mb-2 animate-gradient-text">
                CREATE PROFILE
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-fuchsia-500"></div>
                <Shield className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500"></div>
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-6">
              <label className="block text-fuchsia-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse"></div>
                Username
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <User className="h-5 w-5 text-fuchsia-500/50 group-focus-within:text-fuchsia-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="choose_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-md bg-black/40 backdrop-blur-sm text-white border border-fuchsia-500/30 focus:border-fuchsia-400 focus:outline-none transition-all placeholder:text-gray-600 font-mono text-sm"
                    required
                  />
                  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-fuchsia-500/5 to-transparent pointer-events-none rounded-r-md"></div>
                </div>
              </div>
            </div>

            {/* Tagline Input */}
            <div className="mb-6">
              <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                Tagline
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="#animefan"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full pl-4 pr-4 py-3.5 rounded-md bg-black/40 backdrop-blur-sm text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all placeholder:text-gray-600 font-mono text-sm"
                  />
                  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none rounded-r-md"></div>
                </div>
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
              <label className="block text-purple-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                Password
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-500/50 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-md bg-black/40 backdrop-blur-sm text-white border border-purple-500/30 focus:border-purple-400 focus:outline-none transition-all placeholder:text-gray-600 font-mono text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-500 hover:text-white transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none rounded-r-md"></div>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="mb-6">
              <label className="flex items-start cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    required
                  />
                  <div className="w-4 h-4 border border-fuchsia-500/50 rounded bg-black/40 peer-checked:bg-fuchsia-500 peer-checked:border-fuchsia-400 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M4.5 8.5L1.5 5.5 2.5 4.5 4.5 6.5 9.5 1.5 10.5 2.5z"/>
                    </svg>
                  </div>
                </div>
                <span className="ml-3 text-gray-400 group-hover:text-fuchsia-300 transition-colors font-mono text-xs leading-relaxed">
                  I agree to the <span className="text-fuchsia-400">Terms of Service</span> and <span className="text-cyan-400">Privacy Policy</span>
                </span>
              </label>
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

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mb-8 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Button Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 rounded-md p-[2px]">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-cyan-500/20 rounded-md animate-gradient-rotate"></div>
              </div>
              
              {/* Button Content */}
              <div className="relative bg-black rounded-md py-4 px-6 group-hover:bg-gradient-to-r group-hover:from-fuchsia-950/50 group-hover:via-purple-950/50 group-hover:to-cyan-950/50 transition-all duration-300">
                <span className="relative z-10 flex items-center justify-center gap-3 text-white font-mono uppercase tracking-wider text-sm font-bold">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Profile
                    </>
                  ) : (
                    <>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                        Register Account
                      </span>
                      <ArrowRight className="h-5 w-5 text-fuchsia-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                
                {/* Scan Line Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
              </div>
            </button>

            {/* Login Link */}
            <div className="text-center border-t border-gray-800 pt-6">
              <span className="text-gray-500 text-sm font-mono">Existing User? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 hover:from-cyan-300 hover:to-fuchsia-300 transition-all"
              >
                SIGN_IN →
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}