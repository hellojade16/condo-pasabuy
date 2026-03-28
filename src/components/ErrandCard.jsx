import React, { useState } from 'react'; 
import { formatDistanceToNow } from 'date-fns';


export default function ErrandCard({ errand, currentBuilding, user, onClaim, onComplete, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false); // Toggle state
  const isMyBuilding = errand.building_id === currentBuilding?.id;
  
  // Logic to check if text is long enough to bother expanding
  const isLong = errand.description?.length > 60;
  const isPoster = user?.id === errand.user_id;

  // Extract the avatar from the joined profiles table
  const posterAvatar = errand.profiles?.avatar_url;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${errand.status === 'claimed' ? 'bg-gray-50 opacity-70' : 'bg-white shadow-sm border-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-lg capitalize leading-tight">{errand.title}</h3>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
              {errand.buildings?.name || 'Local'}
            </span>
          </div>

          {/* --- DISPLAYING THE PROFILE PIC OR INITIAL --- */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden border border-blue-50">
              {posterAvatar ? (
                <img 
                  src={posterAvatar} 
                  className="w-full h-full object-cover" 
                  alt={errand.full_name} 
                />
              ) : (
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  {errand.full_name?.charAt(0) || 'N'}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
              {errand.full_name || 'Neighbor'}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">
            {formatDistanceToNow(new Date(errand.created_at), { addSuffix: true })}
          </span>
          </div>
          
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <span></span> {errand.location_detail}
          </p>
          
          {isMyBuilding ? (
            <div className="mt-3 space-y-1">
              {errand.description && (
                <button 
                  onClick={() => isLong && setIsExpanded(!isExpanded)}
                  className={`text-left w-full group transition-all ${isLong ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <p className={`text-gray-400 text-xs italic leading-snug transition-all ${
                    !isExpanded && isLong ? 'line-clamp-2' : ''
                  }`}>
                    "{errand.description}"
                  </p>
                  {isLong && (
                    <span className="text-[9px] font-black uppercase text-blue-500 mt-1 block group-hover:underline">
                      {isExpanded ? 'Show Less ↑' : 'Show Full List ↓'}
                    </span>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                  Deliver to: {errand.unit_number}
                </span>
                {isPoster && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase">
                    Your Post
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1 text-gray-400 text-[10px] italic">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Details hidden for other buildings
            </div>
          )}
        </div>
        
        {/* Modern Delete Button UI - Icon Only Version */}
        <div className="text-right flex flex-col items-end">
          {isPoster && errand.status === 'open' && (
            <button 
              onClick={() => {
                if(window.confirm("Remove this errand? This cannot be undone.")) {
                  onDelete(errand.id);
                }
              }}
              className="group flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all duration-200 active:scale-90 border border-red-100 mb-2 shadow-sm"
              title="Cancel Errand"
            >
              <svg 
                className="w-4 h-4 transition-transform group-hover:rotate-12" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fee</p>
          <span className="font-black text-green-600 text-lg">₱{errand.fee_amount}</span>
        </div>
      </div>

      <div className="mt-4">
        {errand.status === 'claimed' ? (
          <div className="flex justify-between items-center border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <p className="text-orange-500 font-bold text-[10px] italic">
                {errand.runner_id === user?.id ? "You claimed this!" : `Claimed by ${errand.runner_name}`}
              </p>
            </div>
            
            {isPoster && (
              <button 
                onClick={() => onComplete(errand.id)} 
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-green-100 active:scale-95 transition-all"
              >
                Confirm Received
              </button>
            )}
          </div>
        ) : (
          isMyBuilding ? (
            <button 
              onClick={() => onClaim(errand.id)} 
              disabled={isPoster}
              className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 
                ${isPoster 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed animate-pulse' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
            >
              {isPoster ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-ping"></span>
                  Waiting for a runner...
                </span>
              ) : "I Got It!"}
            </button>
          ) : (
            <div className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl text-[11px] text-center border border-dashed border-gray-200 font-bold flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Must be at {errand.buildings?.name || 'this building'} to claim
            </div>
          )
        )}
      </div>
    </div>
  );
}