import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import UpdateNameModal from './Modals/UpdateName';

export default function Profile({ user, onLogout, onClose, setUser, currentBuilding, onVerify }) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [showNameModal, setShowNameModal] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!user) return null;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    fetchProfile();
  }, [user.id]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handlePasswordReset = async () => {
    if (cooldown > 0) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`, 
      });
      if (error) throw error;
      alert(`Success! Link sent to ${user.email}.`);
      setCooldown(60);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileName = `${user.id}-${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      const { data: { user: updatedUser } } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      setUser(updatedUser); 
      setAvatarUrl(publicUrl); 
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans animate-slide-up">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-gray-50">
        <button onClick={onClose} className="text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm">Back</button>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">My Profile</h2>
        <button onClick={onLogout} className="text-red-500 font-bold hover:text-red-600 transition-colors text-sm">Logout</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pt-10">
        
        {/* AVATAR SECTION */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-50 shadow-lg bg-gray-100 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-3xl font-black text-blue-200">{fullName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full text-white cursor-pointer shadow-md hover:bg-blue-700 transition-all active:scale-90 border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>

          {/* IDENTITY SECTION - UPDATED TO ICON ONLY */}
          <div className="w-full space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity</label>
            <div className="w-full p-5 bg-white border border-gray-100 rounded-[24px] flex justify-between items-center shadow-sm">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-0.5">Display Name</span>
                <span className="font-bold text-gray-900">{fullName || 'Set your name'}</span>
              </div>
              <button 
                onClick={() => setShowNameModal(true)}
                className="w-10 h-10 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-600 active:scale-90 transition-all hover:bg-blue-600 hover:text-white border border-blue-100/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Residence</label>
          <div className="w-full p-5 bg-blue-50/50 border border-blue-100/50 text-blue-700 rounded-[24px] font-bold flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                
                <span className="uppercase tracking-tight text-[13px] font-black">{currentBuilding?.name || 'No Building Set'}</span>
              </div>
            </div>
            <button 
              onClick={async () => { 
  if(window.confirm("Verify location again?")) { 
    localStorage.removeItem('savedBuilding');
    await supabase
      .from('profiles')
      .update({ verified_building_id: null })
      .eq('id', user.id);
    onClose(); 
    onVerify(null); 
  } 
}}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

       
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="p-4 px-6 bg-gray-50 rounded-[24px] flex justify-between items-center opacity-70">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
            <span className="text-xs font-bold text-gray-900">{user?.email}</span>
          </div>
          <button 
            onClick={handlePasswordReset}
            disabled={cooldown > 0}
            className={`w-full p-5 rounded-[24px] font-bold flex justify-between items-center transition-all ${
              cooldown > 0 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'bg-white border border-gray-100 text-gray-600 active:bg-gray-50 shadow-sm'
            }`}
          >
            <span className="text-sm font-bold">{cooldown > 0 ? `Retry in ${cooldown}s` : 'Change Password'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>

      <UpdateNameModal 
        show={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={fullName}
        userId={user.id}
        onUpdate={(u) => { setUser(u); setFullName(u.user_metadata.full_name); }}
      />
    </div>
  );
}