import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Terminal, Skull } from 'lucide-react';
import { CyberSynth } from './lib/audio';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = 400;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<CyberSynth | null>(null);
  
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState("TRK_00::AURAL_HEX");
  const [glitchTrigger, setGlitchTrigger] = useState(0);

  // Initialize Audio
  useEffect(() => {
    synthRef.current = new CyberSynth();
    return () => {
      synthRef.current?.pause();
    };
  }, []);

  const toggleAudio = () => {
    if (!synthRef.current) return;
    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      synthRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipAudio = () => {
    if (!synthRef.current) return;
    synthRef.current.skip();
    setTrackName(synthRef.current.getTrackName());
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setIsStarted(true);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
    if (!isPlaying) toggleAudio();
  };

  const stateRef = useRef({ snake, food, dir, gameOver, isStarted });
  useEffect(() => {
    stateRef.current = { snake, food, dir, gameOver, isStarted };
  }, [snake, food, dir, gameOver, isStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { dir, isStarted, gameOver } = stateRef.current;
      
      if (!isStarted || gameOver) {
        if (e.key === 'Enter') startGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp': case 'w': if (dir.y !== 1) setDir({ x: 0, y: -1 }); break;
        case 'ArrowDown': case 's': if (dir.y !== -1) setDir({ x: 0, y: 1 }); break;
        case 'ArrowLeft': case 'a': if (dir.x !== 1) setDir({ x: -1, y: 0 }); break;
        case 'ArrowRight': case 'd': if (dir.x !== -1) setDir({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const { snake, food, dir, gameOver, isStarted } = stateRef.current;
      if (gameOver || !isStarted) return;

      const head = snake[0];
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      // Wall Collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return;
      }
      
      // Self Collision
      if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return;
      }

      const newSnake = [newHead, ...snake];
      
      // Food Consumption
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setGlitchTrigger(prev => prev + 1); // Trigger visual glitch
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        });
      } else {
        newSnake.pop();
      }
      
      setSnake(newSnake);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    const pulse = Math.sin(Date.now() / 150) * 2;
    ctx.fillRect(food.x * CELL_SIZE + 2 - pulse/2, food.y * CELL_SIZE + 2 - pulse/2, CELL_SIZE - 4 + pulse, CELL_SIZE - 4 + pulse);

    // Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const ratio = index / snake.length;
      const opacity = isHead ? 1 : Math.max(0.15, 1 - ratio);
      
      ctx.shadowBlur = isHead ? 15 : 12 * opacity;
      ctx.shadowColor = `rgba(0, 255, 255, ${opacity})`;
      ctx.fillStyle = isHead ? '#ffffff' : `rgba(0, 255, 255, ${opacity})`;
      
      const shrink = isHead ? 0 : ratio * 10;
      const size = Math.max(4, CELL_SIZE - 2 - shrink);
      const offset = 1 + (CELL_SIZE - 2 - size) / 2;
      
      ctx.fillRect(segment.x * CELL_SIZE + offset, segment.y * CELL_SIZE + offset, size, size);
    });
    ctx.shadowBlur = 0;

  }, [snake, food]);

  return (
    <div className="crt min-h-screen bg-[#000] text-[#0ff] font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-[#f0f] selection:text-[#000]">
      <div className="noise"></div>
      <div className="scanline"></div>
      
      <div className="tear flicker w-full max-w-[400px] flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-end mb-4 z-10 border-b-2 border-[#0ff] pb-2">
          <div>
            <h1 className="text-2xl glitch font-bold tracking-widest flex items-center gap-2">
              <Terminal size={24} className="text-[#f0f] animate-pulse" />
              N30N_S3RP3NT
            </h1>
            <p className="text-xs mt-1 uppercase">
              <span className="text-[#ff0]">[SYS.STAT]</span> {gameOver ? 'COMPROMISED' : isStarted ? 'ACTIVE' : 'STANDBY'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-70 uppercase">0xSCORE_BUFFER</div>
            <div className={`text-3xl font-bold ${glitchTrigger % 2 === 0 ? 'neon-text-cyan' : 'neon-text-magenta'}`}>
              {score.toString().padStart(4, '0')}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className={`relative z-10 w-full ${gameOver ? 'neon-border-magenta' : 'neon-border'} bg-[#000] p-1`}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className={`block ${glitchTrigger > 0 ? 'animate-pulse' : ''}`}
            style={{ width: '100%', maxWidth: '400px', height: 'auto', aspectRatio: '1/1' }}
          />
          
          {/* Overlays */}
          {!isStarted && !gameOver && (
            <div className="absolute inset-0 bg-[#000]/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-[2px]">
              <Terminal size={48} className="text-[#0ff] mb-4 opacity-50 animate-bounce" />
              <p className="text-xl mb-4 glitch">AWAITING INPUT</p>
              <button 
                onClick={startGame}
                className="neon-border px-6 py-2 hover:bg-[#0ff] hover:text-[#000] uppercase text-sm tracking-widest cursor-pointer"
              >
                [ EXECUTE_INIT ]
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-[#000]/90 flex flex-col items-center justify-center text-center p-6 border-4 border-[#f0f] backdrop-blur-[4px]">
              <Skull size={48} className="text-[#f0f] mb-4 glitch-magenta" />
              <p className="text-2xl mb-2 neon-text-magenta font-bold">FATAL ERROR</p>
              <p className="text-2xl mb-6 glitch font-bold neon-text-cyan">ENTITY DESTROYED. FINAL SCORE: {score}</p>
              <button 
                onClick={startGame}
                className="neon-border-magenta px-6 py-2 hover:bg-[#f0f] hover:text-[#000] uppercase text-sm tracking-widest text-[#f0f] cursor-pointer"
              >
                [ REBOOT_SEQUENCE ]
              </button>
            </div>
          )}
        </div>

        {/* Audio Player */}
        <div className="w-full mt-6 neon-border p-4 bg-[#000]/80 backdrop-blur-md z-10 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[#0ff]/30 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#ff0]">/// AUDIO_SUBSYSTEM</span>
            <span className={`text-[10px] px-2 py-0.5 border ${isPlaying ? 'border-[#0ff] text-[#0ff]' : 'border-[#f0f] text-[#f0f]'}`}>
              {isPlaying ? 'STREAMING' : 'MUTED'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <div className={`text-sm font-bold truncate ${isPlaying ? 'glitch' : 'opacity-50'}`}>
                {trackName}
              </div>
              <div className="text-[10px] opacity-70 mt-1 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 bg-[#f0f] ${isPlaying ? 'animate-pulse' : ''}`}></span>
                PROCEDURAL_GEN_ACTIVE
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              <button 
                onClick={toggleAudio}
                className="p-2 neon-border hover:bg-[#0ff] hover:text-[#000] flex items-center justify-center cursor-pointer group"
                title={isPlaying ? "Mute" : "Play"}
              >
                {isPlaying ? <Pause size={18} className="drop-shadow-[0_0_8px_#0ff] group-hover:drop-shadow-none" /> : <Play size={18} className="drop-shadow-[0_0_8px_#0ff] group-hover:drop-shadow-none" />}
              </button>
              <button 
                onClick={skipAudio}
                className="p-2 neon-border hover:bg-[#0ff] hover:text-[#000] flex items-center justify-center cursor-pointer group"
                title="Skip Track"
              >
                <SkipForward size={18} className="drop-shadow-[0_0_8px_#0ff] group-hover:drop-shadow-none" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="fixed top-10 left-10 text-[#f0f] opacity-20 font-bold text-6xl -z-10 select-none pointer-events-none transform -rotate-90 glitch-magenta">
        0xDEADBEEF
      </div>
      <div className="fixed bottom-10 right-10 text-[#0ff] opacity-20 font-bold text-6xl -z-10 select-none pointer-events-none glitch">
        SYS.ERR
      </div>
      <div className="fixed top-1/2 left-4 text-[#ff0] opacity-10 font-bold text-sm -z-10 select-none pointer-events-none writing-vertical-rl">
        MEMORY_DUMP: {Math.random().toString(16).substring(2)}
      </div>
    </div>
  );
}
