import React from "react";
import ForgotPasswordForm from "../components/profile/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-black/80 rounded-lg shadow-lg border border-cyan-500/20">
        <h1 className="text-2xl font-bold text-fuchsia-400 mb-6 font-mono uppercase text-center">Forgot Password</h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
