import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import LogoImage from '../assets/logo.png'; 


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

export default function Auth({ onAuthSuccess, nearbyBuildings, onVerify, currentBuilding }) {
  const [step, setStep] = useState('choice'); 
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- AUTH LOGIC ---
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
    else onAuthSuccess(data.user);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-0 bg-gray-50 min-h-screen font-sans">
      
      {/* FULL SCREEN MODERN CARD */}
      <div className="w-full max-w-sm flex-1 sm:flex-initial bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative flex flex-col justify-center">
        
        {/* Blue Accent Line at the very top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-3xl"></div>

        {/* --- BRANDING AREA --- */}
        <div className="text-center mb-10">
          <img 
            src={LogoImage} 
            alt="Condo Pasabuy" 
            className="h-20 w-auto mx-auto mb-4" 
          />
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Condo</h1>
            <h1 className="text-3xl font-black text-blue-600 tracking-tight">Pasabuy</h1>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 font-bold uppercase tracking-widest opacity-80">
            Hyper-local Condo Errands
          </p>
        </div>

        {/* STEP 0: LOGIN OR SIGNUP CHOICE */}
        {step === 'choice' && (
          <div className="w-full space-y-4 animate-fade-in">
            <button 
              onClick={() => setStep('login')} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold active:scale-95 transition-all shadow-md shadow-blue-100"
            >
              Login
            </button>
            <button 
              onClick={() => setStep('signup')} 
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold active:scale-95 transition-all hover:bg-gray-200"
            >
              Create Account
            </button>
          </div>
        )}

        {/* STEP 1: SIGNUP FORM */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp} className="w-full space-y-4 animate-slide-up">
            <p className="text-center text-xs font-black mb-6 uppercase tracking-widest text-blue-600">Join the Community</p>
            <ModernInput 
              type="text" placeholder="Full Name" value={fullName} 
              onChange={e => setFullName(e.target.value)} required 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <ModernInput 
              type="email" placeholder="Email Address" value={email} 
              onChange={e => setEmail(e.target.value)} required 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>}
            />
            <ModernInput 
              type="password" placeholder="Create Password" value={password} 
              onChange={e => setPassword(e.target.value)} required 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 mt-4 rounded-xl font-bold shadow-lg shadow-blue-100">
              {loading ? "Registering..." : "Sign Up"}
            </button>
            <button onClick={() => setStep('choice')} className="w-full text-xs text-gray-400 font-medium pt-2">Back</button>
          </form>
        )}

        {/* STEP 2: EMAIL VERIFICATION NOTICE */}
        {step === 'verify-email' && (
          <div className="text-center space-y-4 animate-slide-up pt-4">
            <div className="text-6xl mb-6">📩</div>
            <h2 className="text-2xl font-bold text-gray-900">Check your Email!</h2>
            <p className="text-gray-500 text-sm leading-relaxed px-2">Verification link sent to<br/><strong className="text-gray-700">{email}</strong>. Please click it to activate your account.</p>
            <button onClick={() => setStep('login')} className="w-full bg-gray-100 text-gray-700 mt-8 py-4 rounded-xl font-bold">Go to Login</button>
          </div>
        )}

        {/* STEP 3: LOGIN FORM */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="w-full space-y-4 animate-slide-up">
            <p className="text-center text-xs font-black mb-6 uppercase tracking-widest text-blue-600">Welcome Back</p>
            <ModernInput 
              type="email" placeholder="Email" value={email} 
              onChange={e => setEmail(e.target.value)} required 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>}
            />
            <ModernInput 
              type="password" placeholder="Password" value={password} 
              onChange={e => setPassword(e.target.value)} required 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-4 mt-4 rounded-xl font-bold shadow-lg shadow-blue-100">
              Login & Verify GPS
            </button>
            <button onClick={() => setStep('choice')} className="w-full text-xs text-gray-400 font-medium pt-2">Back</button>
          </form>
        )}

                    {/* --- BUILDING SELECTION OVERLAY --- */}
            {nearbyBuildings?.length > 0 && !currentBuilding && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 p-8 flex flex-col justify-center animate-fade-in rounded-3xl">
                
                <h2 className="text-center text-blue-600 font-black text-xs uppercase tracking-widest mb-6">
                  Multiple Buildings Found
                </h2>

                {/* 🛡️ ADD THIS WRAPPER DIV WITH 'space-y-3' */}
                <div className="flex flex-col space-y-3 w-full">
                  {nearbyBuildings.map(b => (
                    <button 
                      key={b.id} 
                      onClick={() => onVerify(b)} 
                      className="w-full bg-gray-50 border border-gray-100 hover:border-blue-400 hover:bg-blue-50 text-gray-800 py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 text-center shadow-sm"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>

                <p className="text-center text-gray-400 text-xs mt-6 font-medium">
                  Which one are you in?
                </p>
              </div>
            )}
      </div>
    </div>
  );
}
