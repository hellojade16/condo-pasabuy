import React from 'react';

export default function Navigation({ viewMode, setViewMode, currentBuilding }) {
  return (
    <nav className="flex bg-white px-6 py-3 gap-2 border-b border-slate-100">
      <button 
        onClick={() => setViewMode('building')}
        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
          viewMode === 'building' 
            ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
            : 'text-slate-400 hover:bg-slate-50'
        }`}
      >
        {currentBuilding?.name}
      </button>
      
      <button 
        onClick={() => setViewMode('global')}
        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
          viewMode === 'global' 
            ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
            : 'text-slate-400 hover:bg-slate-50'
        }`}
      >
        Global Feed
      </button>
    </nav>
  );
}