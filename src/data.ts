import { PresetVideo } from './types';

export const PRESET_AVATARS = [
  { char: '🍿', name: 'Popcorn Ninja', color: 'from-amber-400 to-red-500' },
  { char: '🦊', name: 'Retro Fox', color: 'from-orange-400 to-red-600' },
  { char: '🐱', name: 'Neon Kitty', color: 'from-pink-400 to-purple-600' },
  { char: '🐼', name: 'Soda Panda', color: 'from-emerald-400 to-teal-600' },
  { char: '👾', name: 'Cyber Ghost', color: 'from-cyan-400 to-blue-600' },
  { char: '🦄', name: 'Cinema Unicorn', color: 'from-fuchsia-400 to-pink-600' },
  { char: '🐉', name: 'Dragon Director', color: 'from-red-500 to-yellow-500' },
  { char: '🍥', name: 'Anime Lover', color: 'from-indigo-400 to-purple-500' },
];

export const PRESET_VIDEOS: PresetVideo[] = [
  {
    id: 'sintel',
    name: 'Sintel (Official CGI Open Movie)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    duration: '14:48',
    category: 'Fantasy / Sci-Fi',
    description: 'A beautiful open-source movie about a girl who searches for her baby dragon companion, braving harsh terrains, monsters, and a tragic destiny.'
  },
  {
    id: 'tears-of-steel',
    name: 'Tears of Steel (Sci-Fi VFX Movie)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
    duration: '12:14',
    category: 'Sci-Fi / Action',
    description: 'Set in a dystopian future where giant robots threaten Amsterdam, a group of scientists attempts to resolve a romantic conflict from their past to save humanity.'
  },
  {
    id: 'big-buck-bunny',
    name: 'Big Buck Bunny (CGI Classic)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
    duration: '9:56',
    category: 'Comedy / Animation',
    description: 'A comedy following a giant, warm-hearted rabbit whose morning peace is interrupted by mischievous small rodents, sparking a comedic and highly inventive battle.'
  },
  {
    id: 'subwaysurf',
    name: 'Subway Surfers Infinite Loop (Lofi Stream)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-with-neon-lights-42994-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    duration: '3:00',
    category: 'Synth / Ambient',
    description: 'Sit back, chat, and relax with this high-contrast futuristic visual tunnel loop, accompanied by premium offline lofi-aesthetic beats.'
  }
];

export const POPULAR_GIFS = [
  { name: 'Popcorn', url: 'https://media.giphy.com/media/l0HlPytulDqi3i6A0/giphy.gif' },
  { name: 'Applause', url: 'https://media.giphy.com/media/nbvFV5EOmT27K/giphy.gif' },
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/2rqEdFksE5YDua9NFO/giphy.gif' },
  { name: 'Crying', url: 'https://media.giphy.com/media/d2lcHJTG5T6CI/giphy.gif' },
  { name: 'Shocked', url: 'https://media.giphy.com/media/3o7527pa7qs9kCG78A/giphy.gif' },
  { name: 'OOMMGG', url: 'https://media.giphy.com/media/5Govl2SypeSTC/giphy.gif' },
];
