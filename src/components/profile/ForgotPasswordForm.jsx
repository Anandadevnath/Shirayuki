import React, { useState } from "react";
import { forgotPassword } from "@/context/api/services";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Password reset link sent to your email.");
      setEmail("");
    } catch (err) {
      setError("Failed to send reset link");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-mono mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white"
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
