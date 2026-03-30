import React from 'react';

export default function Navigation({ viewMode, setViewMode, currentBuilding }) {
  return (
    <nav className="flex bg-white px-6 gap-6 border-b border-slate-100">
      <button 
        onClick={() => setViewMode('building')}
        className={`flex-1 py-4 text-xs font-black transition-all border-b-2 ${
          viewMode === 'building' 
            ? 'border-blue-600 text-blue-600' 
            : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        {currentBuilding?.name}
      </button>
      
      <button 
        onClick={() => setViewMode('global')}
        className={`flex-1 py-4 text-xs font-black transition-all border-b-2 ${
          viewMode === 'global' 
            ? 'border-blue-600 text-blue-600' 
            : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        Global Feed
      </button>
    </nav>
  );
}