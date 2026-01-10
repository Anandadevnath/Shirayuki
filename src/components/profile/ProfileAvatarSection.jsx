import React, { useEffect, useState } from "react";
import { getPrebuiltPfps, uploadCustomPfp, selectPrebuiltPfp } from "@/context/api/services";
import { BACKEND_BASE_URL } from "@/context/api/config";

export default function ProfileAvatarSection({ user, onAvatarChange }) {
  const [prebuilt, setPrebuilt] = useState([]); // [{ id, url }]
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPrebuiltPfps().then(({ data }) => {
      if (data && Array.isArray(data)) {
        // Store both id and url for each pfp
        const pfps = data.map(item => ({
          id: item.id,
          url: item.url.startsWith("http://") || item.url.startsWith("https://")
            ? item.url
            : BACKEND_BASE_URL.replace(/\/$/, "") + (item.url.startsWith("/") ? item.url : "/" + item.url)
        }));
        setPrebuilt(pfps);
      }
    });
  }, []);

  const handlePrebuiltSelect = async (url, id) => {
    setError("");
    const userId = user.id || user._id || user.userId;
    const { error } = await selectPrebuiltPfp({ userId, pfpId: id });
    if (!error) {
      onAvatarChange(url);
      // Update localStorage user object
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.pfpUrl = url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch {}
    } else setError("Failed to set avatar");
  };

  const handleUpload = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("pfp", file);
    setUploading(true);
    const { data, error } = await uploadCustomPfp(formData);
    setUploading(false);
    if (data && data.url) {
      onAvatarChange(data.url);
      // Update localStorage user object
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.pfpUrl = data.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch {}
    } else setError("Failed to upload avatar");
  };

  return (
    <div className="mb-5">
      <label className="block text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3">Profile Picture</label>
      <div className="flex flex-wrap gap-3 mb-3">
        {prebuilt.map((pfp) => (
          <img
            key={pfp.id}
            src={pfp.url}
            alt="prebuilt avatar"
            className={`w-14 h-14 rounded-full border-2 cursor-pointer ${user.avatar === pfp.url ? "border-fuchsia-400" : "border-cyan-500/30"}`}
            onClick={() => handlePrebuiltSelect(pfp.url, pfp.id)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <span className="text-xs text-cyan-400 font-mono">Uploading...</span>}
      </div>
      {error && <div className="text-xs text-red-400 font-mono mt-2">{error}</div>}
    </div>
  );
}
