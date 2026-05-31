import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Share2, 
  Settings, 
  ArrowLeft, 
  Check, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock
} from 'lucide-react';
import { RoomState } from '../types';

interface HeaderRoomInfoProps {
  room: RoomState;
  userId: string;
  onLeaveRoom: () => void;
  onUpdateSettings: (hostPermissionsOnly: boolean, isPublic: boolean) => void;
}

export default function HeaderRoomInfo({
  room,
  userId,
  onLeaveRoom,
  onUpdateSettings,
}: HeaderRoomInfoProps) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isHost = room.hostId === userId;
  const roomLink = `${window.location.origin}/?room=${room.id}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-md px-6 py-4 gap-4 z-40">
      {/* Left Section: Back button, Name and Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={onLeaveRoom}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
          title="Back to Lobby"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-sans font-bold text-white tracking-tight">
              {room.name}
            </h1>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/60 font-mono mt-0.5">
            <span className="flex items-center gap-1">
              <Lock size={12} className="text-indigo-400" /> Room ID: <strong className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-sans tracking-wide">{room.id}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Users size={12} /> {room.members.length} watching
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Action Controls */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        <button
          onClick={copyInvite}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-full transition-all text-white font-sans text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.3)] cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={14} className="text-white animate-bounce" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>Invite Friends</span>
            </>
          )}
        </button>

        {isHost && (
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border transition ${
                showSettings 
                  ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-400' 
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
              }`}
              title="Room Host Settings"
            >
              <Settings size={18} />
            </button>

            <AnimatePresence>
              {showSettings && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSettings(false)} 
                  />
                  
                  {/* Floating Dialog */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black h-fit z-50 text-white"
                  >
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3.5">
                      <ShieldAlert size={16} className="text-indigo-400" />
                      <span className="font-bold text-sm text-indigo-200 tracking-wide uppercase">Host Console</span>
                    </div>

                    <div className="space-y-4">
                      {/* Control Permissions */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block">Playback Autonomy</label>
                        <button
                          onClick={() => onUpdateSettings(!room.hostPermissionsOnly, room.isPublic)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-left text-xs ${
                            room.hostPermissionsOnly 
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">Host Only Controls</span>
                            <span className="text-[10px] text-white/40 block mt-0.5">
                              {room.hostPermissionsOnly ? 'Only host playing/seeking' : 'All members can pause/seek'}
                            </span>
                          </div>
                          <span className={`h-2 w-2 rounded-full ${room.hostPermissionsOnly ? 'bg-indigo-400' : 'bg-white/20'}`} />
                        </button>
                      </div>

                      {/* Public/Private Room */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block">Privacy Setting</label>
                        <button
                          onClick={() => onUpdateSettings(room.hostPermissionsOnly, !room.isPublic)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-left text-xs ${
                            !room.isPublic 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {room.isPublic ? <Eye size={16} className="text-emerald-400" /> : <EyeOff size={16} className="text-amber-400" />}
                            <div>
                              <span className="font-semibold block">Visibility</span>
                              <span className="text-[10px] text-white/40 block mt-0.5">
                                {room.isPublic ? 'Visible on lobby public list' : 'Hidden from lobby list (invite only)'}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>

  );
}
