import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Sparkles, Zap } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bgColor, setBgColor] = useState('bg-blue-500');
  const [clickEffect, setClickEffect] = useState(null);
  
  // AI State
  const [aiText, setAiText] = useState("Tap to start!");
  
  // THE BUFFER QUEUE
  // We use a "ref" to store the list of messages so it doesn't slow down the app
  const aiQueue = useRef([]); 
  const isFetching = useRef(false);
  const [queueSize, setQueueSize] = useState(0); // Just for the little lightning icon

  // Load saved high score & Start AI
  useEffect(() => {
    const savedScore = localStorage.getItem('silly-high-score');
    if (savedScore) setHighScore(parseInt(savedScore));
    
    // 1. STARTUP: Fetch the first 10 messages immediately
    fetchAiBatch(10, "hype up a new player");
  }, []);

  // Save High Score
  useEffect(() => {
    if (count > highScore) {
      setHighScore(count);
      localStorage.setItem('silly-high-score', count.toString());
    }
  }, [count, highScore]);

  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 
    'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-600'
  ];

  // --- THE SMART BUFFERING LOGIC ---
  const fetchAiBatch = async (amount, context = "") => {
    if (isFetching.current) return; // Don't download twice at the same time
    isFetching.current = true;

    try {
      // We ask Pollinations for multiple phrases separated by "|"
      // This gets us 5-10 messages in ONE request instead of 10 separate requests
      const prompt = `Give me ${amount} distinct, short, intense, weird, funny compliments for a clicking game. ${context}. Separate them with a pipe character |. Do not use numbers. No quotes.`;
      const safePrompt = encodeURIComponent(prompt);
      
      const response = await fetch(`https://text.pollinations.ai/${safePrompt}`);
      const text = await response.text();
      
      if (text) {
        // Split the text by "|" to get our list of messages
        const newMessages = text.split('|').map(t => t.trim()).filter(t => t.length > 0);
        
        // Add them to the pile
        aiQueue.current = [...aiQueue.current, ...newMessages];
        setQueueSize(aiQueue.current.length);
      }
    } catch (error) {
      console.error("Buffer Error:", error);
    } finally {
      isFetching.current = false;
    }
  };

  const handleTouch = (e) => {
    const newCount = count + 1;
    setCount(newCount);

    // --- DYNAMIC INTERVAL (The "Unstoppable" Logic) ---
    // The higher the score, the less often we interrupt you
    let interval = 10; 
    if (newCount > 100) interval = 20;
    if (newCount > 300) interval = 25;
    if (newCount > 1000) interval = 50;

    // Time to change color/text?
    if (newCount % interval === 0) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setBgColor(randomColor);
      
      // 1. USE A MESSAGE: Take the first one off the pile
      if (aiQueue.current.length > 0) {
        const nextMessage = aiQueue.current.shift(); // Remove first item
        setAiText(nextMessage);
        setQueueSize(aiQueue.current.length);
      } else {
        // If we ran out (internet slow?), use a default
        setAiText("Speed Demon!");
        fetchAiBatch(3, "panic mode player is fast"); 
      }

      // 2. REFILL: If we have less than 3 left, order 5 more!
      if (aiQueue.current.length < 3) {
        fetchAiBatch(5, `player score is ${newCount}, keep hype high`);
      }
    }

    // Click Ripple Effect
    const x = e.clientX || (e.touches && e.touches[0].clientX) || window.innerWidth / 2;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || window.innerHeight / 2;
    setClickEffect({ x, y, id: Date.now() });
    setTimeout(() => setClickEffect(null), 300);
  };

  const resetGame = (e) => {
    e.stopPropagation(); 
    setCount(0);
    setBgColor('bg-blue-500');
    setAiText("Tap to start!");
    // Refill buffer on reset so the next game is ready
    fetchAiBatch(5, "player restarted the game");
  };

  return (
    <div 
      onClick={handleTouch}
      className={`relative h-screen w-full ${bgColor} transition-colors duration-500 flex flex-col items-center justify-center overflow-hidden touch-manipulation select-none`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Top Bar */}
      <div className="absolute top-10 w-full px-6 flex justify-between items-center text-white/80 font-bold text-xl">
        <div className="flex items-center space-x-2">
          <Trophy size={24} />
          <span>{highScore}</span>
        </div>
        
        {/* Debug: Shows how many messages are waiting in the queue */}
        <div className="flex items-center space-x-1 text-xs opacity-60">
          <Zap size={14} className={queueSize > 0 ? "text-yellow-300 fill-yellow-300" : "text-gray-400"} />
          <span>Buffered: {queueSize}</span>
        </div>
      </div>

      {/* Ripple Effect */}
      {clickEffect && (
        <div 
          className="absolute rounded-full bg-white opacity-30 animate-ping pointer-events-none"
          style={{ left: clickEffect.x - 50, top: clickEffect.y - 50, width: 100, height: 100 }}
        />
      )}

      {/* Main Counter */}
      <div className="z-10 flex flex-col items-center px-4 text-center">
        <span className="text-white text-[9rem] sm:text-[12rem] font-black leading-none drop-shadow-lg transition-all duration-75 active:scale-95">
          {count}
        </span>
        
        {/* AI Text Area */}
        <div className="h-32 flex flex-col items-center justify-center mt-4 w-full max-w-md">
          <span className="text-white/95 text-3xl sm:text-4xl font-bold animate-pulse transition-all duration-300 leading-tight">
            {aiText}
          </span>
        </div>
      </div>

      {/* Reset Button */}
      <button 
        onClick={resetGame}
        className="absolute bottom-10 p-4 rounded-full bg-white/20 hover:bg-white/40 text-white transition backdrop-blur-sm z-20 active:scale-90"
        aria-label="Reset"
      >
        <RotateCcw size={32} />
      </button>
    </div>
  );
}