import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function UpdateNameModal({ show, onClose, currentName, onUpdate, userId }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      // 1. Update Database
      await supabase.from('profiles').update({ full_name: name }).eq('id', userId);
      
      // 2. Update Auth Metadata
      const { data: { user: updatedUser } } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      
      onUpdate(updatedUser);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-slide-up relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center mx-auto mb-6 border border-white shadow-sm">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Display Name</h2>
          <p className="text-[12px] text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-70">How neighbors see you</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-900 border border-transparent focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Save Changes"}
          </button>
          <button type="button" onClick={onClose} className="w-full text-xs font-black text-gray-300 uppercase tracking-widest pt-2 hover:text-gray-400 transition-colors">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}