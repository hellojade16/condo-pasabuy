import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function RequestBuildingModal({ show, onClose, onBuildingAdded, lastScannedCoords }) {
  const [buildingName, setBuildingName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInstantAdd = async (e) => {
    e.preventDefault();
    
    // 1. Debugging: Log the coords to see if they exist
    console.log("Current Coords:", lastScannedCoords);

    if (!buildingName.trim()) {
      alert("Please enter a condo name.");
      return;
    }

    if (!lastScannedCoords) {
      alert("GPS Error: We don't have your location yet. Please close this and wait for the 'Locating...' scan to finish.");
      return;
    }

    setLoading(true);
    try {
      // --- START MERGED CHECK LOGIC ---
      // Check if a similar building exists within 100 meters using your SQL function
      const { data: existing, error: checkError } = await supabase
        .rpc('check_building_exists', {
          p_name: buildingName,
          p_lat: parseFloat(lastScannedCoords.lat), // Convert text to double precision
          p_lng: parseFloat(lastScannedCoords.lon), // Convert text to double precision
          p_radius_meters: 100
        });

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        // Find the closest match from the results
        const match = existing[0];
        alert(`Duplicate Found: "${match.name}" is already registered approximately ${Math.round(match.distance)} meters from your location.`);
        setLoading(false);
        return; // Stop the insertion
      }
      // --- END MERGED CHECK LOGIC ---

      const { data, error } = await supabase
        .from('buildings')
        .insert([{ 
          name: buildingName, 
          latitude: lastScannedCoords.lat.toString(), 
          longitude: lastScannedCoords.lon.toString() 
        }])
        .select().single();

      if (error) throw error;
      
      // Success!
      onBuildingAdded(data); 
      setBuildingName('');
      onClose();
    } catch (err) {
      console.error("Supabase Error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white p-8 pb-10 rounded-[40px] shadow-2xl animate-slide-up relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Modern Header Section */}
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center mx-auto mb-6 border border-white shadow-sm">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Register Condo
          </h2>
          <p className="text-[12px] text-slate-400 mt-3 font-bold uppercase tracking-[0.15em] leading-relaxed px-4">
            START A NEW COMMUNITY
          </p>
        </div>

        <form onSubmit={handleInstantAdd} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Condo Name</label>
            <input 
              type="text" 
              value={buildingName} 
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. Verve Residences"
              className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all text-base"
              required 
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-blue-600 text-white rounded-[20px] font-black shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Launch Building"}
          </button>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full text-[10px] font-black text-gray-300 uppercase mt-2 tracking-widest hover:text-gray-500 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}