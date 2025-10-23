import React from "react";

const spinnerSizes = {
  small: 40,
  medium: 56,
  large: 72,
};

const LoadingSpinner = ({ size = "medium" }) => {
  const dimension = spinnerSizes[size] || spinnerSizes.medium;
  const borderWidth = Math.max(1, Math.round(dimension * 0.05));

  return (
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: dimension + 24,
        background: 'transparent',
        padding: 8,
      }}
    >
      <div
        className="relative rounded-full animate-evolve"
        style={{
          width: dimension,
          height: dimension,
          border: `${borderWidth}px solid rgba(255,0,70,0.7)`,
          borderRadius: "50%",
          boxShadow: `0 0 ${Math.round(dimension * 0.3)}px rgba(255,0,70,0.6)`,
        }}
      >
        {/* ---- Sharingan ---- */}
        <div className="absolute inset-0 animate-sharingan">
          {[0, 120, 240].map((angle, i) => (
            <div
              key={i}
              className="absolute bg-black rounded-full"
              style={{
                width: Math.round(dimension / 8.5),
                height: Math.round(dimension / 8.5),
                top: "50%",
                left: "50%",
                transformOrigin: "center",
                transform: `rotate(${angle}deg) translate(${Math.round(
                  dimension / 2.3
                )}px)`,
                boxShadow: "0 0 8px rgba(255,0,70,0.7)",
                border: `1px solid rgba(255,0,70,0.9)`,
              }}
            />
          ))}
        </div>

        {/* ---- Mangekyou ---- */}
        <div className="absolute inset-0 animate-mangekyou opacity-0">
          <div
            className="absolute inset-0 rotate-star"
            style={{
              background:
                "radial-gradient(circle at center, #ff0046 25%, #7a002a 65%, black 90%)",
              clipPath:
                "polygon(50% 5%, 60% 35%, 95% 35%, 67% 57%, 76% 91%, 50% 70%, 24% 91%, 33% 57%, 5% 35%, 40% 35%)",
              filter: "drop-shadow(0 0 12px rgba(255,0,70,0.8))",
            }}
          />
        </div>

        {/* ---- Rinnegan ---- */}
        <div className="absolute inset-0 animate-rinnegan opacity-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, #9b5de5 20%, #4a148c 80%, black 95%)",
            }}
          ></div>
          {[1, 2, 3, 4, 5].map((r, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-purple-500/40"
              style={{
                top: r * 3.5 + "%",
                left: r * 3.5 + "%",
                right: r * 3.5 + "%",
                bottom: r * 3.5 + "%",
                filter: "blur(0.15px)",
              }}
            ></div>
          ))}
        </div>

        {/* ---- Pupil ---- */}
        <div
          className="absolute rounded-full bg-black"
          style={{
            width: Math.max(8, Math.round(dimension / 5.6)),
            height: Math.max(8, Math.round(dimension / 5.6)),
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 6px rgba(255,0,70,0.8)",
          }}
        ></div>
      </div>

      <style jsx>{`
        /* Rotation base */
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Eye aura + scale evolution */
        @keyframes evolve {
          0% {
            border-color: rgba(255, 0, 70, 0.7);
            box-shadow: 0 0 25px rgba(255, 0, 70, 0.7);
            transform: scale(1);
          }
          33% {
            border-color: rgba(255, 0, 70, 1);
            box-shadow: 0 0 40px rgba(255, 0, 70, 0.9);
            transform: scale(1.05);
          }
          66% {
            border-color: rgba(155, 85, 229, 0.8);
            box-shadow: 0 0 45px rgba(155, 85, 229, 0.8);
            transform: scale(1.1);
          }
          100% {
            border-color: rgba(155, 85, 229, 0.7);
            box-shadow: 0 0 25px rgba(155, 85, 229, 0.7);
            transform: scale(1);
          }
        }

        .animate-evolve {
          animation: evolve 10s ease-in-out infinite;
        }

        /* --- Sharingan Stage --- */
        .animate-sharingan {
          animation: spin-slow 4s linear infinite, stage-sharingan 10s infinite;
        }

        /* --- Mangekyou Stage --- */
        .animate-mangekyou {
          animation: spin-slow 5s linear infinite, stage-mangekyou 10s infinite;
        }

        /* --- Rinnegan Stage --- */
        .animate-rinnegan {
          animation: stage-rinnegan 10s infinite;
        }

        /* Smooth stage fades */
        @keyframes stage-sharingan {
          0%,
          28% {
            opacity: 1;
          }
          33% {
            opacity: 0.6;
          }
          36%,
          100% {
            opacity: 0;
          }
        }

        @keyframes stage-mangekyou {
          0%,
          28% {
            opacity: 0;
          }
          33% {
            opacity: 0.4;
          }
          36%,
          63% {
            opacity: 1;
          }
          68% {
            opacity: 0.6;
          }
          70%,
          100% {
            opacity: 0;
          }
        }

        @keyframes stage-rinnegan {
          0%,
          65% {
            opacity: 0;
          }
          70% {
            opacity: 0.4;
          }
          73%,
          100% {
            opacity: 1;
          }
        }

        .rotate-star {
          animation: spin-slow 6s linear infinite;
        }
      `}</style>
    </div>
  );
};

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
      <div className="text-red-400 mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-red-500/30 backdrop-blur-sm">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-white text-xl font-bold mb-3">
        Oops! Something went wrong
      </h3>
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
