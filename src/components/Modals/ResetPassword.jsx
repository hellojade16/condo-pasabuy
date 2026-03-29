import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ModernInput = ({ icon, ...props }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      {icon}
    </span>
    <input 
      {...props} 
      className="w-full pl-12 pr-4 py-4 border border-gray-100 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none text-sm placeholder:text-gray-300 font-medium"
    />
  </div>
);

export default function ResetPasswordModal({ show, onClose, onAuthReset }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (error) {
      alert("Error updating password: " + error.message);
    } else {
      alert("Success! Your password has been updated. Please log in with your new password.");
      window.location.hash = ""; // Clean URL
      await supabase.auth.signOut();
      onAuthReset(); // Call App.jsx to reset user state
      onClose(); // Close the modal
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      
      {/* MODAL CARD */}
        <div 
        className="w-full max-w-sm bg-white p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl shadow-blue-900/10 border border-gray-50 animate-slide-up relative"
        onClick={e => e.stopPropagation()}
        >
        
        {/* --- HEADER --- */}
        <div className="text-center mb-8 pt-4 relative">
            {/* X Close Button - Moved slightly for better spacing */}
            <button onClick={onClose} className="absolute right-[-10px] top-[-10px] p-2 text-gray-300 hover:text-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
            
            {/* New Soft Icon Container */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Set New Password
            </h2>
            <p className="text-[12px] text-slate-400 mt-3 font-bold uppercase tracking-[0.15em] leading-relaxed px-2">
            Secure your account access
            </p>
        </div>

        {/* --- FORM --- */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <ModernInput 
            type="password" placeholder="New Password (min. 6 chars)" value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} required 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
          />
          <ModernInput 
            type="password" placeholder="Confirm New Password" value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} required 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 mt-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center relative shadow-lg text-white
              ${loading 
                ? 'bg-blue-600 cursor-not-allowed opacity-90' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-900 active:scale-95 shadow-blue-100'
              }`}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <span className={`transition-all duration-300 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              Update Password
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}