import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Smile, Image, Sparkles, Flame, Volume2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { POPULAR_GIFS } from '../data';

interface SidebarChatProps {
  messages: ChatMessage[];
  userId: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

export default function SidebarChat({
  messages,
  userId,
  onSendMessage,
  onSendReaction,
}: SidebarChatProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const EMOJI_PRESETS = ['🍿', '🔥', '😂', '😱', '👏', '👀', '💡', '🎉'];

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const selectEmoji = (emoji: string) => {
    // Both put in chat bar and broadcast floating animation
    onSendReaction(emoji);
    setInputText(prev => prev + emoji);
    setShowEmojis(false);
  };

  const selectGif = (gifUrl: string, name: string) => {
    onSendMessage(`[GIF: ${name}] ${gifUrl}`);
    setShowGifs(false);
  };

  return (
    <div className="flex flex-col h-full border-r border-white/5 bg-[#08080c] w-full md:w-80 shrink-0">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0a0f]/40">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Party Chat</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white/40">
            <Sparkles size={24} className="mb-2 text-indigo-400/50" />
            <p className="text-xs">No chat messages yet.</p>
            <p className="text-[10px] mt-1">Start chatting or click reaction emojis to animate the party!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.userId === userId;
            const isSystem = msg.userId === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="text-[10px] text-white/50 bg-white/5 border border-white/5 px-3 py-1 rounded-full text-center font-sans">
                    {msg.avatar} <span className="font-semibold">{msg.username}</span>: {msg.text}
                  </span>
                </div>
              );
            }

            // Check if it's a GIF message
            const isGif = msg.text.startsWith('[GIF:') && msg.text.includes('http');
            let gifUrl = '';
            let gifName = '';
            if (isGif) {
              const urlMatch = msg.text.match(/https?:\/\/\S+/);
              const nameMatch = msg.text.match(/\[GIF: (.*?)\]/);
              gifUrl = urlMatch ? urlMatch[0] : '';
              gifName = nameMatch ? nameMatch[1] : 'GIF';
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                {/* Meta Name row */}
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-1 px-1">
                  <span>{msg.avatar}</span>
                  <span className="font-semibold text-white/70">{msg.username}</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-2.5 text-xs font-sans shadow-md border ${
                    isSelf
                      ? 'bg-indigo-600/20 border-indigo-500/20 text-indigo-100 rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-gray-300 rounded-tl-none'
                  }`}
                >
                  {isGif ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <img
                        src={gifUrl}
                        alt={gifName}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-40 object-cover"
                      />
                    </div>
                  ) : (
                    <p className="leading-relaxed break-words whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Reaction Quick Bar */}
      <div className="px-3 py-1.5 border-t border-white/5 bg-black/40 flex items-center justify-between gap-1 overflow-x-auto select-none no-scrollbar">
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none shrink-0 border-r border-white/5 pr-2 mr-1">React:</span>
        <div className="flex items-center gap-1.5">
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="text-lg hover:scale-130 active:scale-95 transition-all duration-150 p-1 filter drop-shadow hover:brightness-125 cursor-pointer"
              title={`Broadcast floating ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interactor Field */}
      <div className="relative p-3 border-t border-white/5 bg-[#0a0a0f]">
        {/* GIF Picker */}
        <AnimatePresence>
          {showGifs && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowGifs(false)} />
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-full left-3 right-3 mb-2 p-3 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl z-20"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                  <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">Choose Party GIF</span>
                  <button onClick={() => setShowGifs(false)} className="text-[10px] text-white/40 hover:text-white">Close</button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {POPULAR_GIFS.map((gif) => (
                    <button
                      key={gif.name}
                      onClick={() => selectGif(gif.url, gif.name)}
                      className="group relative rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition bg-black h-20 flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={gif.url}
                        alt={gif.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] text-white group-hover:text-indigo-300 font-sans">
                        {gif.name}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* TextInput Box */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 focus-within:border-indigo-500/70 rounded-xl px-3 py-2 transition duration-200">
          <button
            onClick={() => setShowGifs(!showGifs)}
            className={`p-1.5 rounded-lg transition ${showGifs ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="GIF Reaction Panel"
          >
            <Image size={15} />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 text-xs text-white bg-transparent outline-none border-none placeholder-white/20"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>

  );
}
