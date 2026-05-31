export interface VideoSource {
  type: 'url' | 'file' | 'preset';
  url: string;
  name: string;
  size?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
}

export interface Member {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isMicOn: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface PollOption {
  text: string;
  votes: string[]; // List of userIds who voted for this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorName: string;
  isActive: boolean;
}

export interface RoomState {
  id: string;
  name: string;
  isPublic: boolean;
  isPasswordProtected: boolean;
  password?: string;
  hostId: string;
  hostPermissionsOnly: boolean;
  activeVideo: VideoSource | null;
  playbackState: PlaybackState;
  members: Member[];
  polls: Poll[];
  messages: ChatMessage[];
}

export interface ReactionAlert {
  id: string;
  username: string;
  emoji: string;
  x: number; // Percent of width, e.g. 10 - 90
  y: number; // Percent of height
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'watching';
  currentRoom?: string;
}

export interface PresetVideo {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: string;
  category: string;
  description: string;
}
