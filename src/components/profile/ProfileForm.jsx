
import React from "react";
import { Edit2, Lock, Save } from "lucide-react";
import ProfileAvatarSection from "./ProfileAvatarSection";

export default function ProfileForm({ user, handleChange, handleSave, saving, error }) {
  // Avatar change handler
  const handleAvatarChange = (url) => {
    handleChange({ target: { name: "avatar", value: url } });
  };
  return (
    <form onSubmit={handleSave} className="relative animate-fade-in-up overflow-hidden">
      {/* Corner Decorations - hidden on small screens */}
      <div className="hidden sm:block absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-50"></div>
      <div className="hidden sm:block absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500 opacity-50"></div>
      <div className="hidden sm:block absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500 opacity-50"></div>
      <div className="hidden sm:block absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-50"></div>
      <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Edit2 className="w-5 h-5 text-cyan-400" />
            Edit Profile
          </h2>
        </div>
        {/* Avatar Section */}
        <ProfileAvatarSection user={user} onAvatarChange={handleAvatarChange} />
        {/* Username#Tagline Combined */}
        <div className="mb-5">
          <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3">
            Username & Tagline
          </label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-md opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
            <input
              type="text"
              value={user.tagline && user.tagline.length > 0 ? `${user.username}#${user.tagline.replace(/^#+/, '')}` : user.username}
              name="usernameTagline"
              onChange={e => {
                const value = e.target.value;
                const [username, ...tagArr] = value.split('#');
                let tagline = tagArr.join('#');
                // Remove any leading # from tagline
                tagline = tagline.replace(/^#+/, '');
                handleChange({
                  target: {
                    name: 'username',
                    value: username.trim(),
                  }
                });
                handleChange({
                  target: {
                    name: 'tagline',
                    value: tagline.trim(),
                  }
                });
              }}
              className="relative w-full px-4 py-3 rounded-md bg-black/40 backdrop-blur-sm text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all font-mono text-sm"
              placeholder="username#owner"
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
        {/* Removed Display Name field */}
        {/* Change Password Button */}
        <a
          href="/updatePassword"
          className="w-full mb-4 py-3 rounded-md bg-black/40 border border-purple-500/30 text-purple-400 font-mono uppercase text-sm hover:bg-purple-950/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <Lock className="w-4 h-4" />
          Change Password
        </a>
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
  );
}
