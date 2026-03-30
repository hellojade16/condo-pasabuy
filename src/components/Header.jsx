import React from 'react';


export default function Header({ user, currentBuilding, onPostClick, onProfileClick }) {

  return (

    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">

            <button 

        onClick={onProfileClick} 

        className="relative group transition-transform active:scale-90"

      >

         <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm flex items-center justify-center bg-gray-50">

            {user?.user_metadata?.avatar_url ? (

              <img 

                src={user.user_metadata.avatar_url} 

                alt="Profile" 

                className="w-full h-full object-cover" 

              />

            ) : (

              <span className="text-xs font-black text-blue-500 uppercase">

                {user?.user_metadata?.full_name?.charAt(0) || 'N'}

              </span>

            )}

         </div>

      </button>



      <div className="text-center">

        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">

          Condo<span className="text-blue-600">Pasabuy</span>

        </h1>

        <div className="flex items-center justify-center gap-1 mt-1">

          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">

            {currentBuilding?.name}

          </p>

        </div>

      </div>



      <button 

        onClick={onPostClick} 

        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-90"

      >

        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">

          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />

        </svg>

      </button>

    </header>

  );

}