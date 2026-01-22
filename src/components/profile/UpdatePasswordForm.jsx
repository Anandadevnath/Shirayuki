import React, { useState } from "react";
import { useToast } from "../ui/toast";

import { updatePassword } from "@/context/api/services";

export default function UpdatePasswordForm({ onSuccess, email }) {
  const userId = localStorage.getItem("userId");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      showToast({ title: "Passwords do not match", description: "Please re-enter your new password.", duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userId,
        oldPassword: currentPassword,
        newPassword
      };
      console.log('Update password payload:', payload);
      await updatePassword(payload);
      setSuccess("Password updated successfully");
      showToast({ title: "Password updated", description: "Your password was updated successfully.", duration: 3000 });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onSuccess) onSuccess();
    } catch {
      setError("Failed to update password");
      showToast({ title: "Update failed", description: "Failed to update password.", duration: 3000 });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
          placeholder="Enter current password"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
          placeholder="Enter new password"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono"
          placeholder="Re-enter new password"
          required
        />
      </div>
      {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
      {success && <div className="text-green-400 text-xs font-mono">{success}</div>}
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-cyan-600 text-white font-bold mt-2 disabled:opacity-50">
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
