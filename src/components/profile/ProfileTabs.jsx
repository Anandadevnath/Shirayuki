import React from "react";

export default function ProfileTabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="mb-8 overflow-x-auto animate-fade-in-up">
      <div className="flex gap-2 min-w-max bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-md font-mono uppercase text-sm tracking-wider transition-all ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-500 hover:text-cyan-300"
              }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-fuchsia-600 rounded-md opacity-80"></div>
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="whitespace-nowrap relative z-10">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
