import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Tv, 
  Users, 
  Sparkles, 
  Lock, 
  Globe, 
  User, 
  Settings as SettingsIcon, 
  Compass, 
  PlayCircle, 
  KeyRound, 
  Sparkle, 
  ArrowRight,
  Eye,
  Settings,
  Flame,
  Plus
} from 'lucide-react';
import { Friend, RoomState } from '../types';
import { PRESET_AVATARS, PRESET_VIDEOS } from '../data';

const getApiUrl = (slug: string) => {
  const backendBase = import.meta.env.VITE_API_URL || '';
  return `${backendBase}${slug}`;
};

interface LobbyProps {
  userId: string;
  username: string;
  avatar: string;
  onUpdateUser: (name: string, av: string) => void;
  ambientGlow: string;
  onUpdateAmbientGlow: (theme: string) => void;
  onJoinSpecificRoom: (roomId: string, pass?: string) => void;
  onCreateNewRoom: (roomParams: { name: string; isPublic: boolean; password?: string }) => void;
}

export default function MainLobby({
  userId,
  username,
  avatar,
  onUpdateUser,
  ambientGlow,
  onUpdateAmbientGlow,
  onJoinSpecificRoom,
  onCreateNewRoom,
}: LobbyProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'create' | 'profile' | 'settings'>('landing');

  // Dashboard state
  const [activeLobbies, setActiveLobbies] = useState<any[]>([]);
  const [loadingLobbies, setLoadingLobbies] = useState(false);
  
  // Create Room state
  const [roomName, setRoomName] = useState(`${username}'s Popcorn Suite`);
  const [isPublic, setIsPublic] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  // Join Code state
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [passwordRequiredForCode, setPasswordRequiredForCode] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Fetch lobies on load / polling
  const loadPublicRooms = async () => {
    setLoadingLobbies(true);
    try {
      const resp = await fetch(getApiUrl('/api/rooms'));
      if (resp.ok) {
        const data = await resp.json();
        setActiveLobbies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLobbies(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadPublicRooms();
    }
  }, [activeTab]);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    onCreateNewRoom({
      name: roomName.trim(),
      isPublic,
      password: usePassword ? password : undefined
    });
  };

  const handleQuickJoin = async (id: string) => {
    try {
      // Check room eligibility
      const r = await fetch(getApiUrl(`/api/rooms/${id.toUpperCase()}`));
      if (r.ok) {
        const details = await r.json();
        if (details.isPasswordProtected) {
          setJoinCode(id);
          setPasswordRequiredForCode(true);
          setActiveTab('dashboard');
        } else {
          onJoinSpecificRoom(id);
        }
      } else {
        setJoinError("Room not found or expired.");
      }
    } catch {
      setJoinError("Connection failure.");
    }
  };

  const submitJoinCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError('');

    try {
      const r = await fetch(getApiUrl(`/api/rooms/${code}`));
      if (!r.ok) {
        setJoinError("Room not found.");
        return;
      }
      const data = await r.json();
      if (data.isPasswordProtected && !joinPassword) {
        setPasswordRequiredForCode(true);
        setJoinError("This room is password-protected.");
        return;
      }
      onJoinSpecificRoom(code, joinPassword);
    } catch {
      setJoinError("Failed to authenticate.");
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-[#050507] via-[#08080c] to-[#0a0a0f] text-white flex flex-col md:flex-row min-h-0 select-none">
      
      {/* Left Navigation Rails - Neon icons with spacing details */}
      <nav className="border-b md:border-b-0 md:border-r border-white/5 bg-[#08080c]/90 backdrop-blur-md p-4 flex md:flex-col items-center justify-between md:justify-start gap-4 shrink-0 overflow-x-auto no-scrollbar z-30">
        
        {/* Brand logo */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 mb-6">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Tv size={18} className="text-white animate-pulse" />
          </div>
          <span className="font-sans font-extrabold tracking-tight text-lg bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            WatchTogether
          </span>
        </div>

        {/* Tab triggers */}
        <div className="flex md:flex-col items-center gap-1.5 w-full">
          <button
            onClick={() => setActiveTab('landing')}
            className={`w-full md:w-44 flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
              activeTab === 'landing' 
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white'
            }`}
          >
            <PlayCircle size={16} />
            <span className="hidden md:inline">Cinema Landing</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full md:w-44 flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Compass size={16} />
            <span className="hidden md:inline">Browse Lounges</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`w-full md:w-44 flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
              activeTab === 'create' 
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Plus size={16} />
            <span className="hidden md:inline">Host a Room</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full md:w-44 flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white'
            }`}
          >
            <User size={16} />
            <span className="hidden md:inline">My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full md:w-44 flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                : 'hover:bg-white/5 border border-transparent text-white/50 hover:text-white'
            }`}
          >
            <SettingsIcon size={16} />
            <span className="hidden md:inline">Video Settings</span>
          </button>
        </div>

        {/* User Mini Avatar block in sidebar */}
        <div className="hidden md:block mt-auto border-t border-white/5 pt-4 w-full">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-2xl">{avatar}</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{username}</span>
              <span className="text-[9px] text-white/40 block truncate">User Profile</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dynamic View Area */}
      <div className="flex-1 overflow-y-auto min-h-0 select-text p-6 md:p-10 relative">
        
        {activeTab === 'landing' && (
          <div className="flex flex-col items-center justify-center min-h-full py-10 relative">
            {/* Ambient decorative glowing blobs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/5 rounded-full filter blur-[100px] pointer-events-none z-0" />
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl relative z-10"
            >
              <div className="inline-flex items-center gap-1.5 px-3-5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-bold mb-6 tracking-wide select-none">
                <Sparkles size={13} className="animate-spin text-indigo-400" /> Perfectly Synced Movie Nights
              </div>

              <h1 className="text-4xl md:text-6xl font-sans font-extrabold tracking-tight text-white leading-none select-none">
                Watch Movies Together, <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Anywhere</span>
              </h1>

              <p className="text-base text-white/60 mt-6 leading-relaxed select-none font-sans font-light">
                Create a dark cinema suite instantly, invite friends with a single shareable link, and enjoy perfectly synchronized audio and video streams down to the millisecond.
              </p>

              {/* Instant CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 shrink-0">
                <button
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#1a1c26] border border-indigo-500/30 text-white shadow-[0_0_25px_rgba(79,70,229,0.45)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] transition duration-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  Create Room Suite <ArrowRight size={16} className="text-indigo-400" />
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition rounded-xl font-bold text-xs uppercase tracking-wider text-white/90 hover:text-white cursor-pointer"
                >
                  Explore Public Rooms
                </button>
              </div>
            </motion.div>

            {/* Quick Cinema Presets Preview grid */}
            <div className="mt-16 w-full max-w-4xl relative z-10">
              <h3 className="text-center text-[10px] uppercase font-bold tracking-widest text-white/40 mb-6 select-none">Cinematic Stream Library</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PRESET_VIDEOS.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative shadow-lg hover:border-blue-500/20 transition duration-300"
                  >
                    <img 
                      src={v.thumbnail} 
                      alt={v.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover opacity-70 group-hover:opacity-100 transition duration-300"
                    />
                    <div className="p-4">
                      <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition duration-200 truncate">{v.name}</span>
                      <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">{v.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Top Row: Title & Direct Connection Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold font-sans">Public Lounges</h2>
                <span className="text-xs text-white/50 block mt-1">Discover active synced parties globally or enter a specific room code.</span>
              </div>

              {/* Direct Code Join Container */}
              <div className="flex flex-col gap-2 shrink-0 md:max-w-sm w-full bg-white/5 border border-white/10 p-4 rounded-xl shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">Enter Party Room Code</span>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center min-w-0">
                    <KeyRound size={14} className="text-white/30 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. WT-CHILL"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white uppercase placeholder-white/20 w-full"
                    />
                  </div>
                  <button
                    onClick={submitJoinCode}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0 transition"
                  >
                    Join
                  </button>
                </div>

                {passwordRequiredForCode && (
                  <div className="mt-2 text-xs">
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">🔑 Password Protected:</span>
                    <input
                      type="password"
                      placeholder="Verify Room Password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      className="w-full text-xs text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl focus:border-indigo-500/60 outline-none"
                    />
                  </div>
                )}

                {joinError && (
                  <span className="text-[10px] text-red-400 font-semibold block mt-1.5 select-none">{joinError}</span>
                )}
              </div>
            </div>

            {/* Public Rooms grid block */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Lobbies on Server</span>
                <button
                  onClick={loadPublicRooms}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-[10px]"
                >
                  Refresh Active Map
                </button>
              </div>

              {loadingLobbies ? (
                <div className="text-center py-20 text-white/40">
                  <span className="inline-block animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
                  <p className="text-xs font-mono">Crawling watch sessions...</p>
                </div>
              ) : activeLobbies.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/0">
                  <span className="text-sm text-white/30 block mb-4">No active public rooms at this time</span>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition rounded-xl text-xs font-bold"
                  >
                    Host the first Room!
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLobbies.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 shadow-md transition flex flex-col justify-between gap-4 group relative overflow-hidden"
                    >
                      {/* Decorative gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-indigo-400 transition text-sm flex items-center gap-2">
                            {room.name}
                            {room.isPasswordProtected && <Lock size={12} className="text-amber-400 shrink-0" />}
                          </h4>
                          <span className="text-[10px] text-white/40 block mt-1 font-mono uppercase tracking-wider">Room code: {room.id}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shrink-0 select-none">
                          <Users size={11} /> {room.memberCount} watching
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 relative z-10">
                        <div className="min-w-0">
                          <span className="text-[10px] text-white/40 block uppercase select-none">Screen Stream:</span>
                          <span className="text-xs text-white/70 block truncate mt-0.5">{room.activeVideo || "Browsing selection..."}</span>
                        </div>
                        <button
                          onClick={() => handleQuickJoin(room.id)}
                          className="px-4 py-2 bg-[#0a0a0f] hover:bg-indigo-600 border border-white/10 hover:border-indigo-500/50 transition duration-200 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Join Party
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-lg mx-auto bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl shadow-black/80">
            <div>
              <h2 className="text-xl font-bold font-sans">Initialize Watch Suite</h2>
              <span className="text-xs text-white/50 block mt-1">Configure your room identity, security filters, and permissions.</span>
            </div>

            <div className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block mb-1">Lounge Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Watch Lounge"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full text-xs text-white bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl focus:border-indigo-500/60 outline-none"
                />
              </div>

              {/* Privacy settings */}
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block mb-2">Visibility Settings</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      isPublic 
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                        : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <Globe size={15} />
                    <div>
                      <span className="text-xs font-bold block">Public Suite</span>
                      <span className="text-[9px] text-white/40 block mt-0.5">Listed on the room browser</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsPublic(false)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      !isPublic 
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                        : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <Lock size={15} />
                    <div>
                      <span className="text-xs font-bold block">Private Suite</span>
                      <span className="text-[9px] text-white/40 block mt-0.5">Invite link required</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security Switch */}
              <div className="border border-white/10 bg-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Password Protection</span>
                    <span className="text-[10px] text-white/40 block">Add an access key to restrict entry</span>
                  </div>
                  <button
                    onClick={() => setUsePassword(!usePassword)}
                    className={`h-5 w-9 rounded-full relative transition duration-200 ${usePassword ? 'bg-indigo-600' : 'bg-zinc-850'}`}
                  >
                    <span className={`h-4.5 w-4.5 bg-white rounded-full absolute top-0.5 transition-all ${usePassword ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>

                {usePassword && (
                  <input
                    type="password"
                    placeholder="Enter Room Code word"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl focus:border-indigo-500/60 outline-none"
                  />
                )}
              </div>

              {/* Submit trigger button */}
              <button
                disabled={!roomName.trim() || (usePassword && !password)}
                onClick={handleCreate}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-505 rounded-xl transition shadow-[0_0_20px_rgba(79,70,229,0.3)] font-bold text-xs uppercase tracking-wide cursor-pointer disabled:opacity-45"
              >
                Host Lounge (WT-NEW)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-lg mx-auto bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl shadow-black">
            <div>
              <h2 className="text-xl font-bold font-sans">Cinematic Identity</h2>
              <span className="text-xs text-white/50 block mt-1">Customize your handle and character icon for the watch suite.</span>
            </div>

            <div className="space-y-6">
              
              {/* Display Header */}
              <div className="flex items-center gap-4 border border-white/5 bg-black/40 p-4 rounded-2xl">
                <span className="text-4xl filter drop-shadow select-none">{avatar}</span>
                <div>
                  <span className="text-xs text-white/40 uppercase font-mono block">Your Active Tag:</span>
                  <span className="text-sm font-bold block mt-0.5 text-indigo-400">{username}</span>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block">Edit Username</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="Choose alias name"
                  defaultValue={username}
                  onChange={(e) => {
                    const clean = e.target.value.trim();
                    if (clean) onUpdateUser(clean, avatar);
                  }}
                  className="w-full text-xs text-white bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl focus:border-indigo-500/60 outline-none"
                />
              </div>

              {/* Avatar choose grid */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block">Choose Screen Face</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((item) => (
                    <button
                      key={item.char}
                      onClick={() => onUpdateUser(username, item.char)}
                      className={`h-11 rounded-xl bg-white/5 hover:bg-white/10 transition text-2xl filter drop-shadow active:scale-95 cursor-pointer border ${
                        avatar === item.char ? 'border-indigo-500 scale-105 bg-indigo-500/10' : 'border-white/5'
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 text-white">
            <div>
              <h2 className="text-xl font-bold font-sans">Video Ambient Settings</h2>
              <span className="text-xs text-white/50 block mt-1">Configure LED light projection around the sync movie player.</span>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block">Ambiance Hue Model</label>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => onUpdateAmbientGlow('purple')}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs transition text-left ${
                    ambientGlow === 'purple' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                    <span>Neon Cyberpunk Indigo</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest">Active Glow</span>
                </button>

                <button
                  onClick={() => onUpdateAmbientGlow('neon-cyan')}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs transition text-left ${
                    ambientGlow === 'neon-cyan' ? 'bg-cyan-500/10 border-cyan-500' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded bg-cyan-500 shadow-[0_0_10px_cyan]" />
                    <span>Hologram Cyan</span>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateAmbientGlow('netflix-red')}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs transition text-left ${
                    ambientGlow === 'netflix-red' ? 'bg-red-500/10 border-red-500' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded bg-red-650 shadow-[0_0_10px_red]" />
                    <span>Netflix Crimson Red</span>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateAmbientGlow('emerald')}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs transition text-left ${
                    ambientGlow === 'emerald' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded bg-emerald-500 shadow-[0_0_10px_emerald]" />
                    <span>Emerald Green Glow</span>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateAmbientGlow('none')}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs transition text-left ${
                    ambientGlow === 'none' ? 'bg-zinc-800 border-zinc-500' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded bg-zinc-700" />
                    <span>Pure Black (Glow Disabled)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
