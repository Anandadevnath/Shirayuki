import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/toast";
import { updatePassword } from "@/context/api/services";

export default function UpdatePasswordForm({ onSuccess }) {
  const userId = localStorage.getItem("userId");
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showToast({ 
        title: "Passwords do not match", 
        description: "Please re-enter your new password.", 
        duration: 3000 
      });
      return;
    }

    setLoading(true);

    try {
      await updatePassword({
        userId,
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      showToast({ 
        title: "Password updated", 
        description: "Your password was updated successfully.", 
        duration: 3000 
      });

      resetForm();
      onSuccess?.();
      navigate("/login");
    } catch (error) {
      showToast({ 
        title: "Update failed", 
        description: error?.message || "Failed to update password.", 
        duration: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { 
      name: "currentPassword", 
      label: "Current Password", 
      placeholder: "Enter current password" 
    },
    { 
      name: "newPassword", 
      label: "New Password", 
      placeholder: "Enter new password" 
    },
    { 
      name: "confirmPassword", 
      label: "Confirm New Password", 
      placeholder: "Re-enter new password" 
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inputFields.map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="block text-xs text-cyan-300 font-mono uppercase tracking-wider mb-1">
            {label}
          </label>
          <input
            type="password"
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder={placeholder}
            required
            disabled={loading}
          />
        </div>
      ))}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}