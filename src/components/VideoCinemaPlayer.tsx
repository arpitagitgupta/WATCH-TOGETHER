import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Sparkles, 
  UploadCloud, 
  Tv, 
  Settings, 
  Flame, 
  Info, 
  Sun,
  Link2
} from 'lucide-react';
import { VideoSource, PlaybackState, ReactionAlert } from '../types';
import { PRESET_VIDEOS } from '../data';

interface VideoCinemaPlayerProps {
  activeVideo: VideoSource | null;
  playbackState: PlaybackState;
  userId: string;
  isHost: boolean;
  hostPermissionsOnly: boolean;
  roomAmbientGlow: string; // From settings (e.g. 'purple', 'neon-cyan', 'netflix-red', 'emerald')
  onVideoChange: (video: VideoSource) => void;
  onPlaybackChange: (state: { isPlaying: boolean; currentTime: number }) => void;
  incomingReaction: ReactionAlert | null;
}

export default function VideoCinemaPlayer({
  activeVideo,
  playbackState,
  userId,
  isHost,
  hostPermissionsOnly,
  roomAmbientGlow,
  onVideoChange,
  onPlaybackChange,
  incomingReaction,
}: VideoCinemaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncTime, setSyncTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ReactionAlert[]>([]);

  // Locks to prevent infinite event loops
  const isSyncingRef = useRef(false);

  // Control visibility timer
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to remote playback updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;

    isSyncingRef.current = true;
    
    // Set Play/Pause state
    if (playbackState.isPlaying) {
      setIsPlaying(true);
      video.play().catch(() => {
        // Handle auto-play browser blocks silently
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
      video.pause();
    }

    // Set seek position
    // If local time differs from the synchronized time by > 1.4s, execute corrective seek
    const diff = Math.abs(video.currentTime - playbackState.currentTime);
    if (diff > 1.4) {
      video.currentTime = playbackState.currentTime;
    }

    isSyncingRef.current = false;
  }, [playbackState, activeVideo]);

  // Floating reactions queueing
  useEffect(() => {
    if (incomingReaction) {
      setActiveReactions(prev => [...prev, incomingReaction]);
      // Remove after 2.5s
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== incomingReaction.id));
      }, 2500);
    }
  }, [incomingReaction]);

  // Setup video timing observers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlayEvent = () => {
      setIsPlaying(true);
      if (isSyncingRef.current) return;
      if (hostPermissionsOnly && !isHost) return;
      onPlaybackChange({ isPlaying: true, currentTime: video.currentTime });
    };

    const onPauseEvent = () => {
      setIsPlaying(false);
      if (isSyncingRef.current) return;
      if (hostPermissionsOnly && !isHost) return;
      onPlaybackChange({ isPlaying: false, currentTime: video.currentTime });
    };

    const onTimeUpdate = () => {
      setSyncTime(video.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener('play', onPlayEvent);
    video.addEventListener('pause', onPauseEvent);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('play', onPlayEvent);
      video.removeEventListener('pause', onPauseEvent);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [activeVideo, isHost, hostPermissionsOnly, onPlaybackChange]);

  // Volume adjuster
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Mouse over slider handles
  const handleMouseActivity = () => {
    setControlsVisible(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  // User input Play Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (hostPermissionsOnly && !isHost) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    if (hostPermissionsOnly && !isHost) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setSyncTime(time);
    onPlaybackChange({ isPlaying: !video.paused, currentTime: time });
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // URL Stream Loader
  const handleUrlLoad = (urlToLoad?: string) => {
    const finalUrl = urlToLoad || streamUrl.trim();
    if (!finalUrl) return;

    // Use a human filename from URL
    let nameOfLink = customName.trim();
    if (!nameOfLink) {
      try {
        const u = new URL(finalUrl);
        nameOfLink = u.pathname.split('/').pop() || 'Web Video Link';
      } catch {
        nameOfLink = 'Custom Web Stream';
      }
    }

    onVideoChange({
      type: 'url',
      url: finalUrl,
      name: nameOfLink
    });
    setStreamUrl('');
    setCustomName('');
  };

  // File Upload Intake Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const videoSrc: VideoSource = {
        type: 'file',
        url: URL.createObjectURL(file),
        name: `📎 ${file.name}`,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      onVideoChange(videoSrc);
    }
  };

  const handleFileChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const videoSrc: VideoSource = {
        type: 'file',
        url: URL.createObjectURL(file),
        name: `📎 ${file.name}`,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      onVideoChange(videoSrc);
    }
  };

  // Maximize Fullscreen
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Fullscreen block: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Party mode sparklers
  const triggerPartyMode = () => {
    setPartyMode(true);
    setTimeout(() => setPartyMode(false), 5000);
  };

  // Ambient LED Styling Matcher
  const getGlowStyles = () => {
    switch (roomAmbientGlow) {
      case 'purple':
        return 'from-indigo-600/10 to-transparent shadow-[0_0_120px_rgba(79,70,229,0.35)]';
      case 'neon-cyan':
        return 'from-cyan-500/15 to-transparent shadow-[0_0_120px_rgba(6,182,212,0.3)]';
      case 'netflix-red':
        return 'from-red-650/15 to-transparent shadow-[0_0_120px_rgba(224,3,9,0.3)]';
      case 'emerald':
        return 'from-emerald-500/15 to-transparent shadow-[0_0_120px_rgba(16,185,129,0.3)]';
      case 'none':
        return 'none';
      default:
        return 'from-indigo-600/10 to-transparent shadow-[0_0_120px_rgba(79,70,229,0.35)]';
    }
  };

  const glowClass = getGlowStyles();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden relative min-h-0 bg-black">
      
      {/* Background LED Ambient projection sphere */}
      {glowClass !== 'none' && activeVideo && (
        <div className={`absolute -inset-[40px] md:-inset-[100px] bg-gradient-to-t rounded-full filter blur-[120px] shrink-0 pointer-events-none transition-all duration-1000 ${glowClass} z-0`} />
      )}

      {/* Floating party neon frame overlay */}
      {partyMode && (
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 animate-pulse pointer-events-none z-10" />
      )}

      {/* Video Content Grid Block */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseActivity}
        onMouseLeave={() => isPlaying && setControlsVisible(false)}
        className="w-full max-w-4xl rounded-2xl overflow-hidden aspect-video bg-[#111116] border border-white/10 relative shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] z-10 transition-all duration-300"
      >
        {activeVideo ? (
          <div className="w-full h-full relative group">
            <video
              ref={videoRef}
              src={activeVideo.url}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              preload="auto"
              playsInline
            />

            {/* Custom Cinema Controller overlay */}
            <div 
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-3 transition-all duration-300 select-none z-20 ${
                controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              {/* Timeline Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/50 font-mono tracking-wide">{formatTime(syncTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={syncTime}
                  onChange={handleSeek}
                  disabled={hostPermissionsOnly && !isHost}
                  className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                />
                <span className="text-[10px] text-white/50 font-mono tracking-wide">{formatTime(duration)}</span>
              </div>

              {/* Functional Key Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePlay} 
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-505 rounded-lg text-white transition scale-105 active:scale-90"
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                  </button>

                  {/* Volume element */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="text-white/60 hover:text-white transition"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-white/10 rounded appearance-none outline-none cursor-pointer accent-white"
                    />
                  </div>

                  <span className="text-[10px] text-white/40 font-mono hidden sm:inline select-none">
                    {activeVideo.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Party Sync Indicator */}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-mono select-none">
                    <Sun size={10} className="animate-spin text-emerald-400" /> Perfectly Synced
                  </div>

                  {/* Fun party trigger */}
                  <button
                    onClick={triggerPartyMode}
                    className={`p-1.5 rounded-lg text-white/60 hover:text-amber-400 transition hover:bg-white/5 ${partyMode ? 'text-amber-400 bg-amber-500/10' : ''}`}
                    title="Toggle Cinema Sparklers"
                  >
                    <Sparkles size={15} />
                  </button>

                  <button 
                    onClick={handleFullscreen} 
                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition"
                  >
                    <Maximize size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* floating reactions display inside container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
              <AnimatePresence>
                {activeReactions.map((reaction) => (
                  <motion.div
                    key={reaction.id}
                    initial={{ opacity: 0, scale: 0.5, y: 150, x: `${reaction.x}%` }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.4, 1.1, 0.7], 
                      y: -250, 
                      x: [`${reaction.x}%`, `${reaction.x + (Math.random() * 20 - 10)}%`]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: "easeOut" }}
                    className="absolute bottom-10 text-4xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  >
                    {reaction.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          
          /* Empty Intake Zone: Drag File or Stream URL */
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full h-full flex flex-col items-center justify-center p-6 text-center select-none relative ${
              dragActive ? 'bg-indigo-950/20 border-2 border-dashed border-indigo-500' : 'bg-[#111116]'
            }`}
          >
            <div className="max-w-md w-full shrink-0">
              <UploadCloud size={44} className={`mx-auto mb-3.5 ${dragActive ? 'text-indigo-400 animate-bounce' : 'text-white/20'}`} />
              <h3 className="text-sm font-bold text-white mb-2 font-sans">
                Drag movie file here or stream from URL
              </h3>
              <p className="text-[11px] text-white/40 mb-5 font-sans">
                Watch local files with friends instantly! They remain local and load synced.
              </p>

              {/* Link Input stream bar */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-3 py-1.5">
                  <Link2 size={14} className="text-white/30" />
                  <input
                    type="text"
                    placeholder="Paste public stream URL (e.g. .mp4, .webm)"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-white/25"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Give the video a title (optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/25"
                  />
                  <button
                    onClick={() => handleUrlLoad()}
                    disabled={!streamUrl.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition rounded-xl text-xs text-white font-semibold cursor-pointer"
                  >
                    Load Stream
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 mb-5 select-none">
                <span className="h-px bg-white/5 flex-1" />
                <span className="text-[9px] uppercase font-bold text-white/25 tracking-wider">Or Choose A Blockbuster</span>
                <span className="h-px bg-white/5 flex-1" />
              </div>

              {/* Presets Slider grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {PRESET_VIDEOS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUrlLoad(item.url)}
                    className="group flex flex-col bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition duration-200 text-left h-24 relative select-none cursor-pointer"
                  >
                    <img 
                      src={item.thumbnail} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-14 object-cover opacity-60 group-hover:opacity-90 transition duration-300 pointer-events-none" 
                    />
                    <div className="p-1 px-1.5">
                      <span className="text-[9px] font-bold text-white group-hover:text-indigo-300 transition truncate block">{item.name}</span>
                      <span className="text-[8px] text-white/40 block mt-0.5">{item.duration} • {item.category}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Browse File Button */}
              <div className="mt-5">
                <label className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 hover:text-white transition cursor-pointer font-sans inline-flex items-center gap-1.5">
                  <UploadCloud size={13} /> Browse local file
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileChoose}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Info Bar */}
      {activeVideo && (
        <div className="w-full max-w-4xl mt-4 flex items-start gap-3.5 bg-[#111116] border border-white/10 p-4 rounded-2xl z-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
            <Tv size={18} />
          </div>
          <div className="flex-1 min-w-0 font-sans">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">Currently Watching</h4>
            <p className="text-xs text-white/80 mt-1 truncate">{activeVideo.name}</p>
            {activeVideo.size && (
              <span className="text-[10px] text-indigo-400 font-mono block mt-0.5">Stream Source Size: {activeVideo.size}</span>
            )}
            {PRESET_VIDEOS.find(p=>p.url === activeVideo.url) && (
              <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
                {PRESET_VIDEOS.find(p=>p.url === activeVideo.url)?.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
