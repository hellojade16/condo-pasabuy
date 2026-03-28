import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Profile({ user, onLogout, onClose, setUser }) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      // 📤 STEP 1: Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 🔗 STEP 2: Get the Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // 📝 STEP 3: Update the Database 'profiles' table
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 👤 STEP 4: Update Auth Metadata (for the current session)
      const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (authError) throw authError;

      // ✨ STEP 5: Update local React state instantly
      setUser(updatedUser); // This tells App.jsx to update the Header
      setAvatarUrl(publicUrl); // This updates the image on this page
      
      alert("Profile updated successfully!");

    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans animate-slide-up">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-gray-100">
        <button onClick={onClose} className="text-gray-400 font-bold">Cancel</button>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">My Profile</h2>
        <button onClick={onLogout} className="text-red-500 font-bold">Logout</button>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center space-y-8">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-xl bg-gray-100 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span className="text-4xl font-black text-blue-300">{user?.user_metadata?.full_name?.charAt(0)}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>

        {/* User Info */}
        <div className="text-center w-full">
          <h3 className="text-2xl font-black text-gray-900">{user?.user_metadata?.full_name}</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">{user?.email}</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-4">
          <button 
            onClick={() => alert("Password reset link sent to your email!")}
            className="w-full p-4 bg-gray-50 text-gray-600 rounded-2xl font-bold flex justify-between items-center"
          >
            Change Password
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}