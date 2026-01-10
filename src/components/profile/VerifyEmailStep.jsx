import React, { useState } from "react";
import { sendVerificationEmail, verifyEmailCode } from "@/context/api/services";

export default function VerifyEmailStep({ onVerified }) {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendVerificationEmail({ email });
      setCodeSent(true);
    } catch (err) {
      setError("Failed to send verification code");
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmailCode({ email, code });
      if (onVerified) onVerified(email);
    } catch (err) {
      setError("Invalid or expired code");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
              placeholder="Enter your email"
              required
            />
          </div>
          {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-cyan-600 text-white font-bold mt-2 disabled:opacity-50">
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
              placeholder="Enter the code sent to your email"
              required
            />
          </div>
          {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-cyan-600 text-white font-bold mt-2 disabled:opacity-50">
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      )}
    </div>
  );
}
