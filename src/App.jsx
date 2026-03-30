import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import ErrandCard from './components/ErrandCard';
import PostErrandModal from './components/Modals/PostErrand'; 
import Header from './components/Header';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import ResetPasswordModal from './components/Modals/ResetPassword';

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
  const [nearbyBuildings, setNearbyBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', loc: '', unit: '', fee: 50 });
  const [viewMode, setViewMode] = useState('building');
  const [showProfile, setShowProfile] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [lastScannedCoords, setLastScannedCoords] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

const [currentBuilding, setCurrentBuilding] = useState(() => {
  const saved = localStorage.getItem('savedBuilding');
  if (!saved || saved === "undefined" || saved === "null") return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
});

  const handleLogout = async () => {
  setShowProfile(false);
  setUser(null);
  setCurrentBuilding(null);
  setErrands([]); 
  setNearbyBuildings([]);
  localStorage.removeItem('savedBuilding');
  localStorage.clear();
  await supabase.auth.signOut();
};

  const resetForm = () => {
    setFormData({ title: '', desc: '', loc: '', unit: '', fee: 50 });
  };

  const handleFeeChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setFormData({ ...formData, fee: "" });
      return;
    } 
    const numValue = Number(value);
    setFormData({ ...formData, fee: numValue });
  };

  useEffect(() => {
    setLoadingGPS(false);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
      
      setIsInitialLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowProfile(false);
        setShowRecoveryModal(true);
        return; 
      }
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setCurrentBuilding(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentBuilding) fetchErrands();
  }, [viewMode, currentBuilding]);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'errands' }, 
        () => fetchErrands()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentBuilding]); 

  const handleClaim = async (errandId) => {
    const { error } = await supabase
      .from('errands')
      .update({ 
        status: 'claimed', 
        runner_id: user.id,
        runner_name: user.user_metadata?.full_name || user.user_metadata?.display_name || 'Neighbor'
      })
      .eq('id', errandId);

    if (error) alert("Could not claim: " + error.message);
    else fetchErrands(); 
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
    setLoadingGPS(true);

    if (selectedBuilding) {
      try {
        setCurrentBuilding(selectedBuilding);
        setNearbyBuildings([]);
        localStorage.setItem('savedBuilding', JSON.stringify(selectedBuilding));

        if (user?.id) {
          const { error: profileError } = await supabase.from('profiles')
              .update({ verified_building_id: selectedBuilding.id })
              .eq('id', user.id);
              
          if (profileError) console.warn("Profile not ready for update yet.");

          await supabase.auth.updateUser({
            data: { 
              selected_building_id: selectedBuilding.id, 
              building_name: selectedBuilding.name 
            }
          });
        }
      } catch (err) {
        console.error("Selection error:", err.message);
      } finally {
        setLoadingGPS(false); 
      }
      return;
    }

    setCurrentBuilding(null); 
    setNearbyBuildings([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const myLat = position.coords.latitude;
          const myLon = position.coords.longitude;
          setLastScannedCoords({ lat: myLat, lon: myLon });

          const { data: buildings, error } = await supabase.from('buildings').select('*');
          if (error) throw error;

          const matches = buildings.filter(b => {
            const dist = calculateDistance(myLat, myLon, Number(b.latitude), Number(b.longitude));
            return dist <= 100; 
          });

          if (matches.length === 1) {
            const found = matches[0];
            setCurrentBuilding(found);
            localStorage.setItem('savedBuilding', JSON.stringify(found));
          } else {
            setNearbyBuildings(matches);
          }
        } catch (err) {
          console.error("Database error:", err.message);
        } finally {
          setLoadingGPS(false); 
        }
      },
      (geoError) => {
        console.warn("GPS Error Code:", geoError.code);
        setLoadingGPS(false); 
        if (geoError.code === 3) {
          alert("GPS taking too long. Please select your building manually.");
        }
      },
      { 
        enableHighAccuracy: false, 
        timeout: 8000,               
        maximumAge: 60000           
      }
    );
  };

  const fetchErrands = async () => {
    let query = supabase
      .from('errands')
      .select(`
        *,
        buildings(name),
        profiles:user_id (avatar_url)
      `);

    if (viewMode === 'building') query = query.eq('building_id', currentBuilding.id);

    const { data, error } = await query
      .neq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) console.error("Fetch Error:", error.message);
    else setErrands(data || []);
  };

  const handlePostErrand = async (e) => {
    e.preventDefault();
    if (formData.fee < 50) {
      alert("Minimum runner fee is ₱50.00");
      return;
    }
    const { error } = await supabase.from('errands').insert([{
      title: formData.title, location_detail: formData.loc, unit_number: formData.unit,
      description: formData.desc, fee_amount: formData.fee, status: 'open',
      building_id: currentBuilding.id, user_id: user.id, 
      full_name: user.user_metadata?.full_name || user.user_metadata?.display_name || 'Neighbor'
    }]);

    if (!error) { 
      setShowModal(false); 
      resetForm(); 
      fetchErrands(); 
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
         <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || !currentBuilding) {
    return (
      <Auth 
        user={user}
        onAuthSuccess={async (u) => { 
          setUser(u); 
          const saved = localStorage.getItem('savedBuilding');
          if (saved && saved !== "undefined" && saved !== "null") {
            setCurrentBuilding(JSON.parse(saved));
            return;
          }
          const { data: profile } = await supabase
            .from('profiles').select('verified_building_id, buildings(id, name)')
            .eq('id', u.id).single();

          if (profile?.buildings) {
            setCurrentBuilding(profile.buildings);
            localStorage.setItem('savedBuilding', JSON.stringify(profile.buildings));
          } else handleGPSVerification(); 
        }} 
        nearbyBuildings={nearbyBuildings} 
        currentBuilding={currentBuilding}
        loadingGPS={loadingGPS}
        onVerify={handleGPSVerification} 
        lastScannedCoords={lastScannedCoords} 
      />
    );
  } 
  


  return (
    <div className="h-screen bg-slate-50 max-w-md mx-auto shadow-2xl flex flex-col font-sans relative overflow-hidden">
      <Header 
        user={user} 
        currentBuilding={currentBuilding} 
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout} 
        onPostClick={() => setShowModal(true)} 
      />

      <Navigation viewMode={viewMode} setViewMode={setViewMode} currentBuilding={currentBuilding} />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {errands.length > 0 ? (
          errands.map(errand => (
            <ErrandCard key={errand.id} errand={errand} currentBuilding={currentBuilding} user={user} onClaim={handleClaim} onComplete={handleComplete} onDelete={handleDelete} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10 animate-fade-in">
            <div className="w-24 h-24 bg-blue-50/50 rounded-[40px] flex items-center justify-center mb-8 border border-blue-100/30 shadow-sm shadow-blue-50/50">
              <svg className="w-10 h-10 text-blue-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {viewMode === 'building' ? 'Building is quiet' : 'Global Feed is empty'}
            </h3>
            <p className="text-[13px] text-slate-400 mt-3 font-medium leading-relaxed max-w-[240px] mx-auto opacity-80">
              {viewMode === 'building' 
                ? `Be the first neighbor in ${currentBuilding?.name} to request a favor.` 
                : "No errands are available right now. Check back later or post your own."}
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-8 px-8 py-3 bg-white border border-slate-100 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all hover:bg-blue-50 hover:border-blue-100"
            >
              + Post First Errand
            </button>
          </div>
        )}
      </main>

      {showProfile && (
        <Profile 
          user={user} 
          setUser={setUser} 
          currentBuilding={currentBuilding} 
          onVerify={handleGPSVerification} 
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout}
        />
      )}

      <PostErrandModal 
        showModal={showModal} 
        setShowModal={(val) => { setShowModal(val); if (val === false) resetForm(); }} 
        formData={formData} 
        setFormData={setFormData} 
        handleFeeChange={handleFeeChange} 
        handlePostErrand={handlePostErrand} 
        currentBuilding={currentBuilding} 
      />

      <ResetPasswordModal 
        show={showRecoveryModal} 
        onClose={() => setShowRecoveryModal(false)} 
        onAuthReset={() => { setUser(null); setCurrentBuilding(null); localStorage.clear(); }} 
      />
    </div>
  );
}

export default App;