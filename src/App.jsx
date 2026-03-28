import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import ErrandCard from './components/ErrandCard';
import PostErrandModal from './components/PostErrandModal'; 
import Header from './components/Header';
import Navigation from './components/Navigation';
import Profile from './components/Profile';


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
    }return null;});
  const [nearbyBuildings, setNearbyBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', loc: '', unit: '', fee: 50 });
  const [viewMode, setViewMode] = useState('building');
  const [showProfile, setShowProfile] = useState(false);

  const resetForm = () => {
  setFormData({ title: '', desc: '', loc: '', unit: '', fee: 50 });};

  const handleFeeChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setFormData({ ...formData, fee: "" });
      return;
    } const numValue = Number(value);
    setFormData({ ...formData, fee: numValue });};

  useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session) {
        setUser(session.user); // This catches any changes to the user profile!
      }
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);

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

  useEffect(() => {
    if (currentBuilding) fetchErrands();
  }, [viewMode, currentBuilding]);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'errands' }, 
        () => {
          fetchErrands(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (selectedBuilding) {
      setCurrentBuilding(selectedBuilding);
      setNearbyBuildings([]);
      localStorage.setItem('savedBuilding', JSON.stringify(selectedBuilding));
      await supabase.auth.updateUser({
        data: { selected_building_id: selectedBuilding.id, building_name: selectedBuilding.name }
      });
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

      if (matches.length > 1) setNearbyBuildings(matches);
      else if (matches.length === 1) {
        setCurrentBuilding(matches[0]);
        localStorage.setItem('savedBuilding', JSON.stringify(matches[0]));
      } else alert("No buildings found nearby.");
    });
  };

  const fetchErrands = async () => {
    // 🔗 Joining with profiles table to get the poster's avatar_url
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

    if (error) {
      console.error("Fetch Error:", error.message);
    } else {
      setErrands(data || []);
    }
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
    }};

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
            .from('profiles').select('verified_building_id, buildings(id, name)')
            .eq('id', u.id).single();

          if (profile?.buildings) {
            setCurrentBuilding(profile.buildings);
            localStorage.setItem('savedBuilding', JSON.stringify(profile.buildings));
          } else handleGPSVerification(); 
        }} 
        nearbyBuildings={nearbyBuildings} 
        currentBuilding={currentBuilding}
        onVerify={async (b) => {
          localStorage.setItem('savedBuilding', JSON.stringify(b));
          setCurrentBuilding(b);
          setNearbyBuildings([]);
          await supabase.from('profiles').update({ verified_building_id: b.id }).eq('id', user.id);
        }} 
      />
    );
  } 

  return (
    <div className="h-screen bg-slate-50 max-w-md mx-auto shadow-2xl flex flex-col font-sans relative overflow-hidden">
      
      <Header 
        user={user} 
        currentBuilding={currentBuilding} 
        onProfileClick={() => setShowProfile(true)}
        onLogout={() => { 
          supabase.auth.signOut(); 
          setUser(null); 
          setCurrentBuilding(null); 
          localStorage.removeItem('savedBuilding');
        }} 
        onPostClick={() => setShowModal(true)} 
      />

      <Navigation 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        currentBuilding={currentBuilding} 
      />

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
              No errands in {viewMode === 'building' ? currentBuilding?.name : 'the area'}
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">
              {viewMode === 'building' 
                ? "Your neighbors are quiet today! Be the first to ask for a favor." 
                : "Nothing happening globally. Try posting an errand to get things started!"}
            </p>
          </div>
        )}
      </main>

      <PostErrandModal 
      showModal={showModal}
      setShowModal={(val) => {
        setShowModal(val);
        if (val === false) resetForm(); 
      }}
      formData={formData}
      setFormData={setFormData}
      handleFeeChange={handleFeeChange}
      handlePostErrand={handlePostErrand}
      currentBuilding={currentBuilding}
    />

    {/* 🚀 THE PROFILE PAGE OVERLAY */}
{showProfile && (
  <Profile 
    user={user} 
    setUser={setUser}
    onClose={() => setShowProfile(false)} 
    onLogout={() => {
      supabase.auth.signOut();
      setUser(null);
      setCurrentBuilding(null);
      localStorage.removeItem('savedBuilding');
      setShowProfile(false);
    }}
  />
)}
    </div>
  );
  }

export default App;