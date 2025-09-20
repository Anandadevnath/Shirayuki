import React from 'react';

const SectionHeader = ({ title, subtitle, showViewAll = true }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
        {subtitle && (
          <p className="text-gray-400 text-sm">{subtitle}</p>
        )}
      </div>
      
      {showViewAll && (
        <button className="text-red-600 hover:text-red-500 font-semibold text-sm transition-colors">
          View All →
        </button>
      )}
    </div>
  );
};

export default SectionHeader;