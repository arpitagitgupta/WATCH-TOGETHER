import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { RoomState, Member, ChatMessage, Poll, VideoSource } from './src/types.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// In-Memory Room Stores
const rooms = new Map<string, RoomState>();

// Helper to generate IDs
function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WT-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Add some starter public rooms
const presetMovies = [
  {
    name: "Sintel (Cinematic Open Movie)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
  },
  {
    name: "Big Buck Bunny",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  {
    name: "Tears of Steel",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  }
];

// Seed initial rooms
const seedRoom1 = {
  id: "WT-CHILL",
  name: "🍿 Friday Movie Night! (Demo)",
  isPublic: true,
  isPasswordProtected: false,
  hostId: "system-host",
  hostPermissionsOnly: false,
  activeVideo: {
    type: 'preset' as const,
    url: presetMovies[0].url,
    name: presetMovies[0].name,
  },
  playbackState: {
    isPlaying: false,
    currentTime: 120,
    lastUpdated: Date.now(),
  },
  members: [
    { id: "system-host", username: "CinematicHost", avatar: "🤖", isHost: true, isMicOn: false },
    { id: "guest-alex", username: "Alex🍿", avatar: "🦊", isHost: false, isMicOn: false },
    { id: "guest-sam", username: "Sam_Critic", avatar: "🐼", isHost: false, isMicOn: true }
  ],
  polls: [
    {
      id: "poll-1",
      question: "Which movie next weekend?",
      creatorName: "CinematicHost",
      isActive: true,
      options: [
        { text: "Big Buck Bunny Classics", votes: ["system-host"] },
        { text: "Tears of Steel Sci-Fi", votes: ["guest-alex", "guest-sam"] }
      ]
    }
  ],
  messages: [
    { id: "msg-1", userId: "system-host", username: "CinematicHost", avatar: "🤖", text: "Welcome to WatchTogether! Pop some popcorn 🍿", timestamp: Date.now() - 300000 },
    { id: "msg-2", userId: "guest-alex", username: "Alex🍿", avatar: "🦊", text: "Wow, this looks perfectly synced down to the millisecond!", timestamp: Date.now() - 120000 }
  ]
};

const seedRoom2 = {
  id: "WT-ANIME",
  name: "⚡ Anime & Chill (Demo)",
  isPublic: true,
  isPasswordProtected: false,
  hostId: "system-host-2",
  hostPermissionsOnly: true,
  activeVideo: {
    type: 'preset' as const,
    url: presetMovies[1].url,
    name: presetMovies[1].name,
  },
  playbackState: {
    isPlaying: true,
    currentTime: 45,
    lastUpdated: Date.now(),
  },
  members: [
    { id: "system-host-2", username: "AnimeSensei", avatar: "🍥", isHost: true, isMicOn: false },
    { id: "guest-marina", username: "Marina", avatar: "🐱", isHost: false, isMicOn: false }
  ],
  polls: [],
  messages: [
    { id: "msg-3", userId: "system-host-2", username: "AnimeSensei", avatar: "🍥", text: "Playing Bunny Classic!", timestamp: Date.now() - 60000 }
  ]
};

rooms.set(seedRoom1.id, seedRoom1);
rooms.set(seedRoom2.id, seedRoom2);

// WebSockets Connection State Tracking
// Map of WebSocket to Metadata
interface SocketState {
  ws: WebSocket;
  roomId?: string;
  userId?: string;
  username?: string;
  avatar?: string;
}
const socketStates = new Map<WebSocket, SocketState>();

// API Endpoint to fetch rooms list (filtered summary for dashboard)
app.get("/api/rooms", (req, res) => {
  const publicRoomsList = Array.from(rooms.values())
    .filter(r => r.isPublic)
    .map(r => ({
      id: r.id,
      name: r.name,
      memberCount: r.members.length,
      activeVideo: r.activeVideo ? r.activeVideo.name : "None",
      isPasswordProtected: r.isPasswordProtected,
      isPlaying: r.playbackState.isPlaying
    }));
  res.json(publicRoomsList);
});

// API Endpoint to check room eligibility
app.get("/api/rooms/:id", (req, res) => {
  const r = rooms.get(req.params.id.toUpperCase());
  if (!r) {
    return res.status(404).json({ error: "Room not found" });
  }
  res.json({
    id: r.id,
    name: r.name,
    isPasswordProtected: r.isPasswordProtected,
    hostPermissionsOnly: r.hostPermissionsOnly
  });
});

// Broadcast to room
function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, state] of socketStates.entries()) {
    if (state.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Handle WebSocket Events
wss.on('connection', (ws: WebSocket) => {
  // Init socket recording
  socketStates.set(ws, { ws });

  ws.on('message', (rawMsg: string) => {
    try {
      const data = JSON.parse(rawMsg);
      const state = socketStates.get(ws);
      if (!state) return;

      switch (data.type) {
        case 'join': {
          const { roomId, userId, username, avatar, isHost, password } = data.payload;
          const targetRoomId = roomId.toUpperCase();

          // If WT-NEW requested, create room
          let room = rooms.get(targetRoomId);
          if (!room && targetRoomId.startsWith("WT-NEW")) {
            const newCode = generateRoomId();
            room = {
              id: newCode,
              name: `${username}'s Watch Lounge`,
              isPublic: data.payload.isPublic !== false,
              isPasswordProtected: !!password,
              password: password || undefined,
              hostId: userId,
              hostPermissionsOnly: false,
              activeVideo: null,
              playbackState: { isPlaying: false, currentTime: 0, lastUpdated: Date.now() },
              members: [],
              polls: [],
              messages: []
            };
            rooms.set(newCode, room);
          } else if (!room) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Room not found.' } }));
            return;
          }

          // Verify password if protected
          if (room.isPasswordProtected && room.password && room.password !== password && room.hostId !== userId) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Incorrect Room Password.' } }));
            return;
          }

          // Remove user from prior room if any
          if (state.roomId && state.roomId !== targetRoomId) {
            removeUserFromRoom(ws);
          }

          // Update socket records
          state.roomId = room.id;
          state.userId = userId;
          state.username = username;
          state.avatar = avatar;

          // Add user to room's member array
          // Check if already in members (handle reload/reconnect)
          const existingIdx = room.members.findIndex(m => m.id === userId);
          const newMember: Member = {
            id: userId,
            username,
            avatar,
            isHost: room.hostId === userId || isHost || room.members.length === 0,
            isMicOn: false
          };

          if (existingIdx >= 0) {
            room.members[existingIdx] = newMember;
          } else {
            room.members.push(newMember);
          }

          // Broadcast Join
          broadcastToRoom(room.id, {
            type: 'member_joined',
            payload: { member: newMember }
          }, ws);

          // Add a welcoming automated system message
          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            userId: 'system',
            username: 'System Notification',
            avatar: '✨',
            text: `${username} joined the Watch Party! 🍿`,
            timestamp: Date.now()
          };
          room.messages.push(sysMsg);
          // Keep chats up to 100 messages to prevent infinite growth
          if (room.messages.length > 100) room.messages.shift();

          broadcastToRoom(room.id, {
            type: 'chat_message',
            payload: { message: sysMsg }
          });

          // Send current room state back to user
          ws.send(JSON.stringify({
            type: 'room_state',
            payload: { room, selfId: userId }
          }));
          break;
        }

        case 'video_change': {
          const { roomId, video } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          // Verify permission
          const state = socketStates.get(ws);
          if (room.hostPermissionsOnly && room.hostId !== state?.userId) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only the host can change current media.' } }));
            return;
          }

          room.activeVideo = video as VideoSource;
          room.playbackState = {
            isPlaying: false,
            currentTime: 0,
            lastUpdated: Date.now()
          };

          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            userId: 'system',
            username: 'System Notification',
            avatar: '🎬',
            text: `${state?.username || 'Somebody'} loaded a new video: "${video.name}"`,
            timestamp: Date.now()
          };
          room.messages.push(sysMsg);

          broadcastToRoom(room.id, {
            type: 'video_sync',
            payload: {
              video: room.activeVideo,
              playbackState: room.playbackState,
              senderId: state?.userId || ''
            }
          });
          broadcastToRoom(room.id, {
            type: 'chat_message',
            payload: { message: sysMsg }
          });
          break;
        }

        case 'playback_change': {
          const { roomId, playbackState } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          // Verify permission
          const state = socketStates.get(ws);
          if (room.hostPermissionsOnly && room.hostId !== state?.userId) {
            // Revert seeker to matching server state
            ws.send(JSON.stringify({
              type: 'video_sync',
              payload: {
                video: room.activeVideo,
                playbackState: room.playbackState,
                senderId: 'system'
              }
            }));
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only the host has playback authority.' } }));
            return;
          }

          // Update Server State
          room.playbackState = {
            isPlaying: playbackState.isPlaying,
            currentTime: playbackState.currentTime,
            lastUpdated: Date.now()
          };

          // Broadcast state to room
          broadcastToRoom(room.id, {
            type: 'video_sync',
            payload: {
              video: room.activeVideo,
              playbackState: room.playbackState,
              senderId: state?.userId || ''
            }
          }, ws);
          break;
        }

        case 'chat_message': {
          const { roomId, text } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (!state) return;

          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            userId: state.userId || 'unknown',
            username: state.username || 'Anonymous',
            avatar: state.avatar || '👤',
            text: text,
            timestamp: Date.now()
          };

          room.messages.push(newMsg);
          if (room.messages.length > 100) room.messages.shift();

          broadcastToRoom(room.id, {
            type: 'chat_message',
            payload: { message: newMsg }
          });
          break;
        }

        case 'emoji_reaction': {
          const { roomId, emoji } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (!state) return;

          // Generate animated positions (random x coord, floating heights)
          const reactionId = `react-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          const payload = {
            id: reactionId,
            username: state.username || 'Someone',
            emoji,
            x: 20 + Math.random() * 60, // Avoid edge clipping
            y: 80 // Bottom layer start
          };

          broadcastToRoom(room.id, {
            type: 'emoji_reaction',
            payload
          });
          break;
        }

        case 'voice_toggle': {
          const { roomId, isMicOn } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (!state) return;

          const member = room.members.find(m => m.id === state.userId);
          if (member) {
            member.isMicOn = isMicOn;
            broadcastToRoom(room.id, {
              type: 'voice_update',
              payload: { members: room.members }
            });
          }
          break;
        }

        case 'create_poll': {
          const { roomId, question, options } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (!state) return;

          const newPoll: Poll = {
            id: `poll-${Date.now()}`,
            question,
            creatorName: state.username || 'Host',
            isActive: true,
            options: options.map((optText: string) => ({
              text: optText,
              votes: []
            }))
          };

          room.polls.push(newPoll);
          broadcastToRoom(room.id, {
            type: 'poll_update',
            payload: { polls: room.polls }
          });
          break;
        }

        case 'vote_poll': {
          const { roomId, pollId, optionIndex } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (!state) return;

          const poll = room.polls.find(p => p.id === pollId);
          if (!poll) return;

          // Clear any current votes by this user in this poll
          poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(id => id !== state.userId);
          });

          // Add vote
          if (optionIndex !== null && optionIndex !== undefined && poll.options[optionIndex]) {
            poll.options[optionIndex].votes.push(state.userId || '');
          }

          broadcastToRoom(room.id, {
            type: 'poll_update',
            payload: { polls: room.polls }
          });
          break;
        }

        case 'delete_poll': {
          const { roomId, pollId } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          room.polls = room.polls.filter(p => p.id !== pollId);
          broadcastToRoom(room.id, {
            type: 'poll_update',
            payload: { polls: room.polls }
          });
          break;
        }

        case 'room_settings_update': {
          const { roomId, hostPermissionsOnly, isPublic } = data.payload;
          const room = rooms.get(roomId);
          if (!room) return;

          const state = socketStates.get(ws);
          if (room.hostId !== state?.userId) return; // Only host

          room.hostPermissionsOnly = hostPermissionsOnly;
          room.isPublic = isPublic;

          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            userId: 'system',
            username: 'System Notification',
            avatar: '⚙️',
            text: `Room settings changed by ${state.username}. Host-only controls: ${hostPermissionsOnly ? 'On' : 'Off'}`,
            timestamp: Date.now()
          };
          room.messages.push(sysMsg);

          // Full room broadcast
          broadcastToRoom(room.id, {
            type: 'room_state',
            payload: { room, selfId: state.userId }
          });
          break;
        }

        case 'heartbeat': {
          // Keepalive
          ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
          break;
        }
      }
    } catch (e) {
      console.error("Failed to process socket message:", e);
    }
  });

  ws.on('close', () => {
    removeUserFromRoom(ws);
    socketStates.delete(ws);
  });
});

// Remove websocket connection references from the relevant room
function removeUserFromRoom(ws: WebSocket) {
  const state = socketStates.get(ws);
  if (!state || !state.roomId || !state.userId) return;

  const room = rooms.get(state.roomId);
  if (!room) return;

  // Find user data
  const leavingUser = room.members.find(m => m.id === state.userId);
  if (!leavingUser) return;

  // Filter user out
  room.members = room.members.filter(m => m.id !== state.userId);

  // Send system parting message
  const sysMsg: ChatMessage = {
    id: `sys-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    userId: 'system',
    username: 'System Notification',
    avatar: '👋',
    text: `${leavingUser.username} left the room.`,
    timestamp: Date.now()
  };
  room.messages.push(sysMsg);

  broadcastToRoom(room.id, {
    type: 'member_left',
    payload: { memberId: state.userId }
  });

  broadcastToRoom(room.id, {
    type: 'chat_message',
    payload: { message: sysMsg }
  });

  // If room is empty, do a scheduled cleanup of temporary lounge after 90 seconds
  if (room.members.length === 0 && !['WT-CHILL', 'WT-ANIME'].includes(room.id)) {
    setTimeout(() => {
      const activeRoom = rooms.get(room.id);
      if (activeRoom && activeRoom.members.length === 0) {
        rooms.delete(room.id);
        console.log(`Cleaned up empty room ${room.id} from memory.`);
      }
    }, 90000);
  } else if (room.members.length > 0 && room.hostId === state.userId) {
    // Re-assign host permissions to another member if the host leaves
    const nextHost = room.members[0];
    room.hostId = nextHost.id;
    nextHost.isHost = true;

    const hostChangeMsg: ChatMessage = {
      id: `sys-host-${Date.now()}`,
      userId: 'system',
      username: 'System Notification',
      avatar: '👑',
      text: `${nextHost.username} is now the host.`,
      timestamp: Date.now()
    };
    room.messages.push(hostChangeMsg);

    broadcastToRoom(room.id, {
      type: 'room_state',
      payload: { room, selfId: '' }
    });
  }
}

// Vite / static file serving flow
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Handle errors
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`WatchTogether server running on http://localhost:${PORT}`);
  });
}

initializeServer().catch(err => {
  console.error("Failed to start full stack Express+WS server:", err);
});
