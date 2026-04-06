import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import LogoImage from '../assets/logo.png'; 
import RequestBuildingModal from './Modals/RequestBuilding';

const ModernInput = ({ icon, ...props }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      {icon}
    </span>
    <input 
      {...props} 
      className="w-full pl-12 pr-4 py-4 border border-gray-100 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all outline-none text-sm placeholder:text-gray-300"
    />
  </div>
);

// Added isInitialLoading to the props destructing
export default function Auth({ onAuthSuccess, nearbyBuildings, onVerify, currentBuilding, loadingGPS, user, lastScannedCoords, isInitialLoading }) {
  const [step, setStep] = useState('choice'); 
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Auth.jsx
useEffect(() => {
  // If we have a user but no building, and we haven't scanned yet...
  // trigger the GPS scan automatically!
  if (user && !currentBuilding && !lastScannedCoords && !loadingGPS) {
    onVerify();
  }
}, [user, currentBuilding, lastScannedCoords, loadingGPS, onVerify]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: fullName } }
    });

    if (error) alert(error.message);
    else setStep('verify-email');
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      // Reset step to choice to ensure we don't get stuck in the 'login' form view
      setStep('choice');
      onAuthSuccess(data.user);
    }
    setLoading(false);
  };
  

return (
    <div className="flex-1 flex flex-col items-center justify-center p-0 bg-gray-50 min-h-screen font-sans">
      <div className="w-full max-sm flex-1 sm:flex-initial bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative flex flex-col justify-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-3xl"></div>

        <div className="text-center mb-10">
          <img src={LogoImage} alt="Condo Pasabuy" className="h-20 w-auto mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Condo</h1>
            <h1 className="text-3xl font-black text-blue-600 tracking-tight">Pasabuy</h1>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 font-bold uppercase tracking-widest opacity-80">
            Hyper-local Condo Errands
          </p>
        </div>

        {loadingGPS || isInitialLoading ? (
          <div className="text-center space-y-4 animate-pulse py-10">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 animate-spin">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Locating...</h2>
          </div>
        ) : (
          <>
            {user && !currentBuilding ? (
              <div className="animate-fade-in text-center w-full space-y-6">
                
                {/* 1. Show Nearby Buildings List if found */}
                {nearbyBuildings?.length > 0 ? (
                  <div className="w-full">
                    <h2 className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-6">Nearby Condos Found</h2>
                    <div className="flex flex-col space-y-3 w-full max-h-[300px] overflow-y-auto pr-1">
                      {nearbyBuildings.map(b => (
                        <button 
                          key={b.id} 
                          onClick={() => onVerify(b)} 
                          className="w-full bg-gray-50 border border-gray-100 hover:border-blue-400 text-gray-800 py-4 px-6 rounded-2xl font-bold transition-all shadow-sm active:scale-95"
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : loadingGPS ? (
                  /* 2. Show Syncing Spinner while waiting for GPS coords */
                  <div className="py-6 flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finding Buildings...</p>
                  </div>
                ) : (
                  /* 3. Fallback if no buildings are nearby */
                  <div className="text-center py-6 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">No Condos Nearby</p>
                    <p className="text-[11px] text-slate-500 px-4">We couldn't find any supported condos at your current location.</p>
                    <button onClick={() => onVerify()} className="mt-2 text-xs font-bold text-blue-600 underline">Try Again</button>
                  </div>
                )}

                <button 
                  onClick={() => setShowRequestModal(true)} 
                  className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] text-gray-300 font-black uppercase hover:text-blue-500 hover:border-blue-200 transition-all"
                >
                  + My building is not here
                </button>
              </div>
            ) : (
              <>
                {step === 'choice' && (
                  <div className="w-full space-y-4 animate-fade-in text-center">
                    {!user && (
                      <>
                        <button onClick={() => setStep('login')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold active:scale-95 transition-all shadow-md shadow-blue-100">Login</button>
                        <button onClick={() => setStep('signup')} className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold active:scale-95 transition-all hover:bg-gray-200">Create Account</button>
                      </>
                    )}
                  </div>
                )}

                {step === 'signup' && (
                  <form onSubmit={handleSignUp} className="w-full space-y-4 animate-slide-up">
                    <p className="text-center text-xs font-black mb-6 uppercase tracking-widest text-blue-600">Join the Community</p>
                    <ModernInput type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
                    <ModernInput type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>} />
                    <ModernInput type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
                    <button type="submit" disabled={loading} className={`w-full py-4 mt-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg text-white ${loading ? 'bg-blue-500 cursor-not-allowed' : 'bg-blue-600 shadow-blue-100 active:scale-95'}`}>
                      {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign Up'}
                    </button>
                    <button onClick={() => setStep('choice')} className="w-full text-xs text-gray-400 font-medium pt-2 text-center">Back</button>
                  </form>
                )}

                {step === 'login' && (
                  <form onSubmit={handleLogin} className="w-full space-y-4 animate-slide-up">
                    <p className="text-center text-xs font-black mb-6 uppercase tracking-widest text-blue-600">Welcome Back</p>
                    <ModernInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>} />
                    <ModernInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
                    <button type="submit" disabled={loading} className={`w-full py-4 mt-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg text-white ${loading ? 'bg-blue-600 cursor-not-allowed opacity-90' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-900 active:scale-95'}`}>
                      {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Login & Verify GPS'}
                    </button>
                    <button onClick={() => setStep('choice')} className="text-xs text-gray-400 font-medium pt-2 w-full text-center">Back</button>
                  </form>
                )}
              </>
            )}
          </>
        )}

        <RequestBuildingModal show={showRequestModal} onClose={() => setShowRequestModal(false)} onBuildingAdded={(newBuilding) => onVerify(newBuilding)} lastScannedCoords={lastScannedCoords} />    
      </div>
    </div>
  );}