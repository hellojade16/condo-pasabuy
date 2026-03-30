import React from 'react';

export default function PostErrandModal({ 
  showModal, 
  setShowModal, 
  formData, 
  setFormData, 
  handleFeeChange, 
  handlePostErrand, 
  currentBuilding 
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-slide-up relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Post Errand</h2>
          <button 
            onClick={() => setShowModal(false)} 
            className="bg-gray-100 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handlePostErrand} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">What do you need?</label>
            <input 
              type="text" 
              placeholder="e.g. 1kg of Rice" 
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Store Location</label>
              <input 
                type="text" 
                placeholder="e.g. Lobby/Palengke" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none" 
                value={formData.loc}
                onChange={e => setFormData({...formData, loc: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Your Unit #</label>
              <input 
                type="text" 
                placeholder="e.g. 201" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none" 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Instructions (Optional)</label>
            <textarea 
              placeholder="Any specific brands or notes?" 
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none h-20 resize-none" 
              value={formData.desc}
              onChange={e => setFormData({...formData, desc: e.target.value})} 
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-blue-900">Runner Fee</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-600">₱</span>
              <input 
                type="number" 
                min='50' 
                value={formData.fee} 
                className="w-20 bg-transparent text-xl font-black text-blue-600 outline-none" 
                onChange={handleFeeChange} 
              />
            </div>
          </div>

          <button 
  type="submit" 
  className="group relative w-full mt-6 overflow-hidden rounded-[20px] bg-blue-600 py-4 px-6 font-black text-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] active:scale-[0.96]"
>
  {/* Subtle Inner Light Effect */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
  
  <div className="relative flex items-center justify-center gap-3">
    <span className="text-[11px] uppercase tracking-[0.2em]">Post Errand</span>
  </div>
</button>
        </form>
      </div>
    </div>
  );
}