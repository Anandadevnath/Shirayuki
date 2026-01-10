import React from "react";
import SecureUpdatePassword from "../components/profile/SecureUpdatePassword";

export default function UpdatePasswordPage() {
  return (
    <div className="relative min-h-screen bg-black py-12 px-4 overflow-hidden -mt-20 flex items-center justify-center">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40"></div>
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>
      <div className="relative w-full max-w-lg mx-auto mt-16">
        {/* Card with border and glow */}
        <div className="relative animate-fade-in-down">
          {/* Corner Decorations */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500 animate-border-glow"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500 animate-border-glow-delayed"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500 animate-border-glow"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500 animate-border-glow-delayed"></div>
          {/* Animated Border Effect */}
          <div className="absolute inset-0 border-scan-container overflow-hidden rounded-lg">
            <div className="border-scan"></div>
          </div>
          {/* Main Card */}
          <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-8 shadow-2xl shadow-cyan-500/10">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-6 animate-gradient-text font-mono uppercase text-center tracking-wider">
              Update Password
            </h1>
            <SecureUpdatePassword />
          </div>
        </div>
      </div>
    </div>
  );
}
