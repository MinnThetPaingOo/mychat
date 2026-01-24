import React from "react";

export default function UploadingOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-slate-600 rounded-full flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-6 h-6 text-white animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Spinning border */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
        </div>
        <div className="mt-2 text-center">
          <div className="flex mt-1 space-x-1">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-pulse"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
