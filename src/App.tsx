import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkle, Radio, ShieldCheck, Flame, Users, WifiOff } from 'lucide-react';
import { RoomState, VideoSource, PlaybackState, ReactionAlert, ChatMessage } from './types';
import HeaderRoomInfo from './components/HeaderRoomInfo';
import SidebarChat from './components/SidebarChat';
import VideoCinemaPlayer from './components/VideoCinemaPlayer';
import RightFriendsPanel from './components/RightFriendsPanel';
import MainLobby from './components/MainLobby';
import { PRESET_AVATARS } from './data';

export default function App() {
  // Identity state
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🍿');
  const [glowTheme, setGlowTheme] = useState('purple');

  // Room synchronization states
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [incomingReaction, setIncomingReaction] = useState<ReactionAlert | null>(null);

  // Connection health states
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Sockets references
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedIdentity = useRef(false);

  // 1. Initialize user Profile from local storage
  useEffect(() => {
    if (hasInitializedIdentity.current) return;
    hasInitializedIdentity.current = true;

    let storedId = localStorage.getItem('wt_userid');
    if (!storedId) {
      storedId = `user-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem('wt_userid', storedId);
    }
    setUserId(storedId);

    const storedName = localStorage.getItem('wt_username');
    const storedAv = localStorage.getItem('wt_avatar');
    const storedGlow = localStorage.getItem('wt_glow');

    if (storedName) {
      setUsername(storedName);
    } else {
      const randomPreset = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      const randomName = `${randomPreset.name.split(' ')[0]}_${Math.floor(100 + Math.random() * 899)}`;
      setUsername(randomName);
      localStorage.setItem('wt_username', randomName);
    }

    if (storedAv) {
      setAvatar(storedAv);
    } else {
      const randomPreset = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      setAvatar(randomPreset.char);
      localStorage.setItem('wt_avatar', randomPreset.char);
    }

    if (storedGlow) {
      setGlowTheme(storedGlow);
    }
  }, []);

  // 2. Establish persistent multi-user WebSockets connection
  useEffect(() => {
    if (!userId || !username) return;

    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
      
      console.log(`Connecting to WatchTogether socket: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setReconnecting(false);
        setConnectionError('');
        console.log('Connected to sync server!');

        // Start heartbeat ping
        heartbeatIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 12000);

        // Check if there was an active room we belong to, or look at URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoom = urlParams.get('room');
        
        if (activeRoomId) {
          // Re-join active room automatically
          socket.send(JSON.stringify({
            type: 'join',
            payload: {
              roomId: activeRoomId,
              userId,
              username,
              avatar,
              isHost: roomState?.hostId === userId
            }
          }));
        } else if (urlRoom) {
          // Join room requested from link
          setActiveRoomId(urlRoom.toUpperCase());
          socket.send(JSON.stringify({
            type: 'join',
            payload: {
              roomId: urlRoom,
              userId,
              username,
              avatar,
              isHost: false
            }
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'room_state': {
              const { room } = message.payload;
              setRoomState(room);
              setActiveRoomId(room.id);
              // Make sure URL contains correct room value
              const currentRoomUrl = new URL(window.location.href);
              if (currentRoomUrl.searchParams.get('room') !== room.id) {
                currentRoomUrl.searchParams.set('room', room.id);
                window.history.pushState({}, '', currentRoomUrl.toString());
              }
              break;
            }

            case 'member_joined': {
              const { member } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                // Avoid duplicate additions
                const filtered = prev.members.filter(m => m.id !== member.id);
                return {
                  ...prev,
                  members: [...filtered, member]
                };
              });
              break;
            }

            case 'member_left': {
              const { memberId } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  members: prev.members.filter(m => m.id !== memberId)
                };
              });
              break;
            }

            case 'video_sync': {
              const { video, playbackState } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  activeVideo: video,
                  playbackState
                };
              });
              break;
            }

            case 'chat_message': {
              const { message: chatMsg } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                // Safeguard duplicates
                if (prev.messages.some(m => m.id === chatMsg.id)) return prev;
                return {
                  ...prev,
                  messages: [...prev.messages, chatMsg]
                };
              });
              break;
            }

            case 'emoji_reaction': {
              setIncomingReaction(message.payload);
              break;
            }

            case 'voice_update': {
              const { members } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  members
                };
              });
              break;
            }

            case 'poll_update': {
              const { polls } = message.payload;
              setRoomState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  polls
                };
              });
              break;
            }

            case 'error': {
              alert(message.payload.message);
              // Reset if room error
              if (message.payload.message.includes('not found')) {
                leaveRoom();
              }
              break;
            }
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        setReconnecting(true);
        console.log('Socket closed. Retrying connection in 3.5s...');
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        setTimeout(() => connectWebSocket(), 3500);
      };

      socket.onerror = () => {
        setConnectionError('Real-time connection interrupted.');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [userId, username]);

  // Update User Profiles
  const updateProfile = (name: string, av: string) => {
    setUsername(name);
    setAvatar(av);
    localStorage.setItem('wt_username', name);
    localStorage.setItem('wt_avatar', av);
  };

  // Update Settings
  const updateAmbientLeds = (theme: string) => {
    setGlowTheme(theme);
    localStorage.setItem('wt_glow', theme);
  };

  // Socket triggers
  const createRoom = (roomParams: { name: string; isPublic: boolean; password?: string }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'join',
      payload: {
        roomId: 'WT-NEW-SESSION',
        userId,
        username,
        avatar,
        isHost: true,
        ...roomParams
      }
    }));
  };

  const joinSpecificRoomId = (roomId: string, passWord?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'join',
      payload: {
        roomId: roomId.toUpperCase(),
        userId,
        username,
        avatar,
        isHost: false,
        password: passWord
      }
    }));
  };

  const leaveRoom = () => {
    setActiveRoomId(null);
    setRoomState(null);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('room');
    window.history.pushState({}, '', cleanUrl.toString());
  };

  // Sync operations
  const changeVideoSource = (video: VideoSource) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'video_change',
      payload: { roomId: activeRoomId, video }
    }));
  };

  const changePlaybackState = (playState: { isPlaying: boolean; currentTime: number }) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'playback_change',
      payload: { 
        roomId: activeRoomId,
        playbackState: {
          isPlaying: playState.isPlaying,
          currentTime: playState.currentTime,
          lastUpdated: Date.now()
        }
      }
    }));
  };

  const sendTextMessage = (text: string) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      payload: { roomId: activeRoomId, text }
    }));
  };

  const sendEmojiReaction = (emoji: string) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'emoji_reaction',
      payload: { roomId: activeRoomId, emoji }
    }));
  };

  const toggleMicInRoom = (isMicOn: boolean) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'voice_toggle',
      payload: { roomId: activeRoomId, isMicOn }
    }));
  };

  const launchPoll = (question: string, options: string[]) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'create_poll',
      payload: { roomId: activeRoomId, question, options }
    }));
  };

  const voteInPoll = (pollId: string, optionIndex: number | null) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'vote_poll',
      payload: { roomId: activeRoomId, pollId, optionIndex }
    }));
  };

  const removePoll = (pollId: string) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'delete_poll',
      payload: { roomId: activeRoomId, pollId }
    }));
  };

  const changeRoomHostSettings = (hostPermissionsOnly: boolean, isPublic: boolean) => {
    if (!wsRef.current || !activeRoomId) return;
    wsRef.current.send(JSON.stringify({
      type: 'room_settings_update',
      payload: { roomId: activeRoomId, hostPermissionsOnly, isPublic }
    }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#050507] font-sans text-white relative">
      
      {/* Network offline / reconnect status indicator overlay */}
      {(!isConnected || reconnecting) && (
        <div className="absolute top-3 right-3 py-1.5 px-3 rounded-full bg-red-650 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-black z-50 select-none animate-pulse">
          <WifiOff size={11} /> Reconnecting Socket Stream...
        </div>
      )}

      {/* Main visual router content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 select-none">
        {activeRoomId && roomState ? (
          
          /* Full Watch Room Layout: Left (Chat), Center (Player), Right (Friends & Voice list) */
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Main Center Video Area + Top bar Header */}
            <div className="flex-1 flex flex-col min-h-0">
              <HeaderRoomInfo
                room={roomState}
                userId={userId}
                onLeaveRoom={leaveRoom}
                onUpdateSettings={changeRoomHostSettings}
              />
              <VideoCinemaPlayer
                activeVideo={roomState.activeVideo}
                playbackState={roomState.playbackState}
                userId={userId}
                isHost={roomState.hostId === userId}
                hostPermissionsOnly={roomState.hostPermissionsOnly}
                roomAmbientGlow={glowTheme}
                onVideoChange={changeVideoSource}
                onPlaybackChange={changePlaybackState}
                incomingReaction={incomingReaction}
              />
            </div>

            {/* Side-by-Side Flex drawers layout */}
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 shrink-0 select-text">
              {/* Left Column: Messages / Sockets Chat */}
              <SidebarChat
                messages={roomState.messages}
                userId={userId}
                onSendMessage={sendTextMessage}
                onSendReaction={sendEmojiReaction}
              />
              {/* Right Column: Friends, Voice room indicators, active poll grids */}
              <RightFriendsPanel
                room={roomState}
                userId={userId}
                onVotePoll={voteInPoll}
                onCreatePoll={launchPoll}
                onDeletePoll={removePoll}
                onToggleVoice={toggleMicInRoom}
              />
            </div>
          </div>
        ) : (
          
          /* Main Lobby View containing Landings, Lobby room cards, Profile edits, led customization templates */
          <MainLobby
            userId={userId}
            username={username}
            avatar={avatar}
            onUpdateUser={updateProfile}
            ambientGlow={glowTheme}
            onUpdateAmbientGlow={updateAmbientLeds}
            onJoinSpecificRoom={joinSpecificRoomId}
            onCreateNewRoom={createRoom}
          />
        )}
      </div>

    </div>
  );
}
