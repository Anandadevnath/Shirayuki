import React, { useState } from "react";
import { useToast } from "../ui/toast";
import { forgotPassword } from "@/context/api/services";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Password reset link sent to your email.");
      showToast({ title: "Reset link sent", description: "Check your email for the reset link.", duration: 3000 });
      setEmail("");
    } catch { /* ignore error */
      setError("Failed to send reset link");
      showToast({ title: "Failed to send reset link", description: "Please try again later.", duration: 3000 });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
          placeholder="user@domain.com"
          required
        />
      </div>
      {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
      {success && <div className="text-green-400 text-xs font-mono">{success}</div>}
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-cyan-600 text-white font-bold mt-2 disabled:opacity-50">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
