import React from 'react';

const LocationPrompt = ({ isOpen, nearestBuilding, onConfirm, onCancel }) => {
  if (!isOpen || !nearestBuilding) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-slate-100 animate-scale-up">
        {/* Icon Area */}
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-2xl">📍</span>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Location Detected
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
            It looks like you're currently at <span className="text-blue-600 font-bold">{nearestBuilding.name}</span>. 
            Would you like to switch to this building?
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            Yes, Switch Building
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-white text-slate-400 font-bold text-sm rounded-2xl border border-slate-100 active:scale-95 transition-all"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPrompt;