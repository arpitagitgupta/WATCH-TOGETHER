import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Mic, 
  MicOff, 
  VolumeX, 
  Volume2, 
  Crown, 
  BarChart3, 
  Plus, 
  Trash2, 
  Sparkle, 
  UserPlus2
} from 'lucide-react';
import { Member, Poll, RoomState } from '../types';

interface RightFriendsPanelProps {
  room: RoomState;
  userId: string;
  onVotePoll: (pollId: string, optionIndex: number | null) => void;
  onCreatePoll: (question: string, options: string[]) => void;
  onDeletePoll: (pollId: string) => void;
  onToggleVoice: (isMicOn: boolean) => void;
}

export default function RightFriendsPanel({
  room,
  userId,
  onVotePoll,
  onCreatePoll,
  onDeletePoll,
  onToggleVoice,
}: RightFriendsPanelProps) {
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [noiseSuppressed, setNoiseSuppressed] = useState(true);

  const me = room.members.find(m => m.id === userId);
  const isMicOn = me?.isMicOn || false;
  const isHost = room.hostId === userId;

  // Simulated Speaking Equalizer
  const [eqHeights, setEqHeights] = useState<number[]>([4, 4, 4, 4, 4]);
  useEffect(() => {
    if (!isMicOn) {
      setEqHeights([4, 4, 4, 4, 4]);
      return;
    }
    const interval = setInterval(() => {
      setEqHeights(
        Array.from({ length: 5 }, () => 4 + Math.floor(Math.random() * 16))
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isMicOn]);

  const addOptionField = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOptionField = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const optionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleCreatePollSubmit = () => {
    const trimmedQ = pollQuestion.trim();
    const trimmedOpts = pollOptions.map(o => o.trim()).filter(Boolean);

    if (!trimmedQ || trimmedOpts.length < 2) return;

    onCreatePoll(trimmedQ, trimmedOpts);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollCreator(false);
  };

  return (
    <div className="flex flex-col h-full border-l border-white/5 bg-[#08080c] w-full md:w-80 shrink-0">
      
      {/* 1. Voice Chat Panel */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-b from-indigo-950/5 to-black/0">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Party Voice Room</span>
          <span className="text-[9px] text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">WebRTC Sync</span>
        </div>

        <div className="flex items-center gap-3 bg-[#0a0a0f] border border-white/5 rounded-2xl p-3">
          <button
            onClick={() => onToggleVoice(!isMicOn)}
            className={`p-3.5 rounded-xl transition ${
              isMicOn 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block">
              {isMicOn ? 'Voice Active / Speaking' : 'Mic Stream Muted'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {/* Noise toggle */}
              <button
                onClick={() => setNoiseSuppressed(!noiseSuppressed)}
                className={`text-[9px] uppercase font-sans tracking-wider px-1.5 py-0.5 rounded transition ${
                  noiseSuppressed 
                    ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400' 
                    : 'bg-white/5 text-white/30 border border-white/0'
                }`}
              >
                {noiseSuppressed ? '⚡ Suppression ON' : 'Suppression Off'}
              </button>
            </div>
          </div>

          {/* EQ Waves */}
          {isMicOn && (
            <div className="flex items-end gap-0.5 h-6 shrink-0 w-8 justify-end">
              {eqHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-t transition-all duration-100"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Friends Participant List */}
      <div className="flex-1 overflow-y-auto p-4 border-b border-white/5 min-h-[140px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={12} /> Watchers ({room.members.length})
          </span>
          <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
            ● {room.members.filter(m => m.isMicOn).length} connected
          </span>
        </div>

        <div className="space-y-2">
          {room.members.map((member) => {
            const isSelf = member.id === userId;
            const isUserSpeaking = member.isMicOn;
            
            return (
              <div 
                key={member.id} 
                className={`flex items-center justify-between p-2 rounded-xl transition ${
                  isSelf ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-xl relative filter drop-shadow flex items-center justify-center bg-black/25 w-9 h-9 rounded-xl border ${
                    isUserSpeaking ? 'border-emerald-400 animate-pulse' : 'border-white/5'
                  }`}>
                    {member.avatar}
                    
                    {/* Speaker indicator dot */}
                    {isUserSpeaking && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#08080c]" />
                    )}
                  </span>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate block">
                        {member.username} 
                      </span>
                      {isSelf && (
                        <span className="text-[9px] text-white/30 font-sans font-light shrink-0">
                          (You)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 font-sans block truncate mt-0.5">
                      {member.isHost ? 'Active Host' : 'Watching party'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {member.isHost && (
                    <Crown size={12} className="text-amber-400 fill-amber-400 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.4)] mr-1" />
                  )}
                  {member.isMicOn ? (
                    <Mic size={11} className="text-emerald-400 animate-pulse" />
                  ) : (
                    <MicOff size={11} className="text-white/20" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Poll Widget */}
      <div className="p-4 bg-[#0a0a0f]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 size={12} className="text-indigo-400" /> Watch Party Polls
          </span>
          {isHost && (
            <button
              onClick={() => setShowPollCreator(!showPollCreator)}
              className="p-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              title="Create New Room Poll"
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Poll List */}
        <div className="space-y-3 max-h-56 overflow-y-auto">
          {room.polls.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-white/5 rounded-xl text-white/20 select-none">
              <span className="text-[11px]">No active poll</span>
            </div>
          ) : (
            room.polls.map((poll) => {
              // Calculate total votes
              const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
              
              return (
                <div key={poll.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-white">
                  <div className="flex items-start justify-between mb-1.5">
                    <h5 className="text-xs font-bold text-zinc-100 font-sans select-none">{poll.question}</h5>
                    {isHost && (
                      <button 
                        onClick={() => onDeletePoll(poll.id)}
                        className="text-white/20 hover:text-red-400 transition p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-white/40 font-sans block mb-2 select-none">Asked by {poll.creatorName} • {totalVotes} votes</span>

                  <div className="space-y-2">
                    {poll.options.map((option, idx) => {
                      const userVoted = option.votes.includes(userId);
                      const percent = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => onVotePoll(poll.id, userVoted ? null : idx)}
                          className={`w-full text-left relative overflow-hidden rounded-lg p-2 text-[11px] transition border duration-150 ${
                            userVoted 
                              ? 'bg-indigo-500/10 border-indigo-500/30' 
                              : 'bg-black/40 border border-white/5 hover:border-white/10'
                          }`}
                        >
                          {/* Percentage progress background */}
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-indigo-500/10 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />

                          <div className="relative flex items-center justify-between">
                            <span className={`font-medium ${userVoted ? 'text-indigo-300 font-bold' : 'text-white/80'}`}>{option.text}</span>
                            <span className="font-mono text-[10px] text-white/50">{percent}% ({option.votes.length})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Poll Dialog Overlay/Inline */}
        <AnimatePresence>
          {showPollCreator && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setShowPollCreator(false)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed bottom-4 right-4 left-4 md:left-auto md:w-80 p-4 border border-white/10 rounded-2xl bg-[#0a0a0f]/95 backdrop-blur-2xl shadow-2xl z-40 text-xs"
              >
                <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Plus size={14} className="text-indigo-400" /> Create Watch Poll
                </h4>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block mb-1">Question / Prompt</label>
                    <input
                      type="text"
                      placeholder="e.g. Which movie is next?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full text-xs text-white bg-white/5 border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl focus:border-indigo-500/60 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block mb-0.5">Options (Min 2)</label>
                    {pollOptions.map((opt, id) => (
                      <div key={id} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder={`Option #${id + 1}`}
                          value={opt}
                          onChange={(e) => optionChange(id, e.target.value)}
                          className="flex-1 text-xs text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg outline-none"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removeOptionField(id)}
                            className="text-white/30 hover:text-red-400 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        onClick={addOptionField}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-sans cursor-pointer"
                      >
                        <Plus size={11} /> Add Option
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setShowPollCreator(false)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 transition rounded-xl text-center text-white/70 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!pollQuestion.trim() || pollOptions.filter(o=>o.trim()).length < 2}
                      onClick={handleCreatePollSubmit}
                      className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-600 transition rounded-xl text-center text-white font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                    >
                      Launch
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>

  );
}
