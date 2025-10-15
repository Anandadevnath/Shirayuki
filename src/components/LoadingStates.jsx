import React from 'react';

const spinnerSizes = {
  small: 32,
  medium: 48,
  large: 72,
};

const LoadingSpinner = ({ size = 'medium' }) => {
  const dimension = spinnerSizes[size] || spinnerSizes.medium;
  return (
    <div className="flex items-center justify-center" style={{ minHeight: dimension + 16 }}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 64 64"
        fill="none"
        className="animate-spin"
        style={{ display: 'block' }}
      >
        {/* Anime eye style spinner */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="#f472b6"
          strokeWidth="6"
          strokeDasharray="44 88"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke="#a78bfa"
          strokeWidth="4"
          strokeDasharray="32 64"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Sparkle */}
        <circle
          cx="48"
          cy="16"
          r="3"
          fill="#f9a8d4"
          opacity="0.9"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
      <div className="text-red-400 mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-red-500/30 backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <h3 className="text-white text-xl font-bold mb-3">Oops! Something went wrong</h3>
      <p className="text-gray-300 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export { LoadingSpinner, ErrorMessage };