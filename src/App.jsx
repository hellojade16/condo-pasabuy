import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import ErrandCard from './components/ErrandCard';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

function App() {
  const [user, setUser] = useState(null);
  const [errands, setErrands] = useState([]);
  const [currentBuilding, setCurrentBuilding] = useState(() => {
    const saved = localStorage.getItem('savedBuilding');
    if (saved && saved !== "undefined" && saved !== "null") {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [nearbyBuildings, setNearbyBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', loc: '', unit: '', fee: 50 });
  const [viewMode, setViewMode] = useState('building');

  // 1. Initial Auth and Storage Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });

    const saved = localStorage.getItem('savedBuilding');
    if (saved) {
      setCurrentBuilding(JSON.parse(saved));
      setNearbyBuildings([]);
    }
  }, []);

  // 2. Fetch Errands on Tab/Building Change
  useEffect(() => {
    if (currentBuilding) fetchErrands();
  }, [viewMode, currentBuilding]);

  // 🚀 3. REAL-TIME LISTENER (Merged correctly here)
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'errands' }, 
        () => {
          console.log("Change detected! Re-fetching...");
          fetchErrands(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBuilding]); 

  // --- Handlers ---
  const handleClaim = async (errandId) => {
    const { error } = await supabase
      .from('errands')
      .update({ 
        status: 'claimed', 
        runner_id: user.id,
        runner_name: user.user_metadata?.display_name || 'Neighbor'
      })
      .eq('id', errandId);

    if (error) {
      alert("Could not claim: " + error.message);
    } else {
      fetchErrands(); 
    }
  };

  const handleDelete = async (errandId) => {
    const { error } = await supabase.from('errands').delete().eq('id', errandId);
    if (error) alert(error.message);
    else fetchErrands();
  };

  const handleComplete = async (errandId) => {
    const { error } = await supabase.from('errands').update({ status: 'completed' }).eq('id', errandId);
    if (error) alert(error.message);
    else fetchErrands();
  };

  const handleGPSVerification = async (selectedBuilding = null) => {
    if (selectedBuilding) {
      setCurrentBuilding(selectedBuilding);
      setNearbyBuildings([]);
      localStorage.setItem('savedBuilding', JSON.stringify(selectedBuilding));

      const { error } = await supabase.auth.updateUser({
        data: { 
          selected_building_id: selectedBuilding.id,
          building_name: selectedBuilding.name 
        }
      });
      if (error) console.error("Database sync error:", error.message);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const myLat = position.coords.latitude;
      const myLon = position.coords.longitude;
      const { data: buildings } = await supabase.from('buildings').select('*');
      
      const matches = buildings.filter(b => {
        const dist = calculateDistance(myLat, myLon, Number(b.latitude), Number(b.longitude));
        return dist <= 10000; 
      });

      if (matches.length > 1) {
        setNearbyBuildings(matches);
      } else if (matches.length === 1) {
        setCurrentBuilding(matches[0]);
        localStorage.setItem('savedBuilding', JSON.stringify(matches[0]));
      } else {
        alert("No buildings found nearby.");
      }
    });
  };

  const fetchErrands = async () => {
    let query = supabase.from('errands').select('*, buildings(name)');
    if (viewMode === 'building') {
      query = query.eq('building_id', currentBuilding.id);
    }
    const { data } = await query
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    setErrands(data || []);
  };

  const handlePostErrand = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('errands').insert([{
      title: formData.title, location_detail: formData.loc, unit_number: formData.unit,
      description: formData.desc, fee_amount: formData.fee, status: 'open',
      building_id: currentBuilding.id, user_id: user.id
    }]);
    if (!error) { setShowModal(false); fetchErrands(); }
  };

  // 4. Auth/Building Gatekeeper
  if (!user || !currentBuilding) {
    return (
      <Auth 
        onAuthSuccess={async (u) => { 
          setUser(u); 
          const saved = localStorage.getItem('savedBuilding');
          if (saved && saved !== "undefined") {
            setCurrentBuilding(JSON.parse(saved));
            return;
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('verified_building_id, buildings(id, name)')
            .eq('id', u.id)
            .single();

          if (profile?.buildings) {
            const b = profile.buildings;
            setCurrentBuilding(b);
            localStorage.setItem('savedBuilding', JSON.stringify(b));
          } else {
            handleGPSVerification(); 
          }
        }} 
        nearbyBuildings={nearbyBuildings} 
        currentBuilding={currentBuilding}
        onVerify={async (b) => {
          localStorage.setItem('savedBuilding', JSON.stringify(b));
          setCurrentBuilding(b);
          setNearbyBuildings([]);
          const { error } = await supabase.from('profiles').update({ verified_building_id: b.id }).eq('id', user.id);
          if (error) alert("Database Error: " + error.message);
        }} 
      />
    );
  } 

  // 5. Final Main UI
  return (
    <div className="h-screen bg-slate-50 max-w-md mx-auto shadow-2xl flex flex-col font-sans relative overflow-hidden">
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <button 
          onClick={() => { 
            supabase.auth.signOut(); 
            setUser(null); 
            setCurrentBuilding(null); 
            localStorage.removeItem('savedBuilding');
          }} 
          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
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
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      <nav className="flex bg-white px-6 py-3 gap-2 border-b border-slate-100">
        <button 
          onClick={() => setViewMode('building')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
            viewMode === 'building' 
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          {currentBuilding?.name}
        </button>
        
        <button 
          onClick={() => setViewMode('global')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
            viewMode === 'global' 
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          Global Feed
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {errands.length > 0 ? (
          errands.map(errand => (
            <ErrandCard 
              key={errand.id} 
              errand={errand} 
              currentBuilding={currentBuilding} 
              user={user}
              onClaim={handleClaim} 
              onComplete={handleComplete} 
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <h3 className="text-slate-900 font-black text-lg tracking-tight">
              No errands in {viewMode === 'building' ? currentBuilding.name : 'the area'}
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">
              {viewMode === 'building' 
                ? "Your neighbors are quiet today! Be the first to ask for a favor." 
                : "Nothing happening globally. Try posting an errand to get things started!"}
            </p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-slide-up relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Post Errand</h2>
              <button onClick={() => setShowModal(false)} className="bg-gray-100 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            <form onSubmit={handlePostErrand} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">What do you need?</label>
                <input type="text" placeholder="e.g. 1kg of Rice" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Store Location</label>
                  <input type="text" placeholder="e.g. Lobby/Palengke" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none" onChange={e => setFormData({...formData, loc: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Your Unit #</label>
                  <input type="text" placeholder="e.g. 201" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none" onChange={e => setFormData({...formData, unit: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Instructions (Optional)</label>
                <textarea placeholder="Any specific brands or notes?" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none h-20 resize-none" onChange={e => setFormData({...formData, desc: e.target.value})} />
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm font-bold text-blue-900">Runner Fee</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-blue-600">₱</span>
                  <input type="number" value={formData.fee} className="w-20 bg-transparent text-xl font-black text-blue-600 outline-none" onChange={e => setFormData({...formData, fee: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">Post to {currentBuilding.name}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;