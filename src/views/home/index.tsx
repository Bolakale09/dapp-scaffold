// Next, React
import { FC, useState, useEffect } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const GameSandbox: FC = () => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; colorFrom: string; colorTo: string; points: number; popped?: boolean }>>([]);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string }>>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const difficultySettings: Record<string, { duration: number; spawnRate: number; target: number; label: string }> = {
    easy: { duration: 45, spawnRate: 1200, target: 300, label: 'EASY' },
    medium: { duration: 35, spawnRate: 800, target: 500, label: 'MEDIUM' },
    hard: { duration: 30, spawnRate: 500, target: 800, label: 'HARD' },
  };

  const colors = [
    { name: 'red', from: '#ef4444', to: '#dc2626', points: 10 },
    { name: 'orange', from: '#f97316', to: '#ea580c', points: 15 },
    { name: 'yellow', from: '#eab308', to: '#ca8a04', points: 20 },
    { name: 'lime', from: '#84cc16', to: '#65a30d', points: 22 },
    { name: 'green', from: '#22c55e', to: '#16a34a', points: 25 },
    { name: 'cyan', from: '#06b6d4', to: '#0891b2', points: 28 },
    { name: 'blue', from: '#3b82f6', to: '#2563eb', points: 30 },
    { name: 'indigo', from: '#6366f1', to: '#4f46e5', points: 32 },
    { name: 'purple', from: '#a855f7', to: '#9333ea', points: 35 },
    { name: 'fuchsia', from: '#d946ef', to: '#c026d3', points: 37 },
    { name: 'pink', from: '#ec4899', to: '#db2777', points: 40 },
    { name: 'rose', from: '#f43f5e', to: '#e11d48', points: 12 },
  ];

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || !difficulty) return;

    const spawnInterval = setInterval(() => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 30 + 40;
      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10,
          y: -10,
          size,
          colorFrom: color.from,
          colorTo: color.to,
          points: color.points,
        },
      ]);
    }, difficultySettings[difficulty].spawnRate);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, gameWon, difficulty]);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;

    const moveInterval = setInterval(() => {
      setBubbles((prev) =>
        prev
          .filter((b) => !b.popped && b.y < 105)
          .map((b) => ({ ...b, y: b.y + 1.5 }))
      );
    }, 16);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, gameWon]);

  useEffect(() => {
    if (!gameStarted || !difficulty) return;

    const duration = difficultySettings[difficulty].duration;
    setTimeLeft(duration);

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameStarted, difficulty]);

  useEffect(() => {
    if (!difficulty) return;
    const target = difficultySettings[difficulty].target;
    if (score >= target && gameStarted && !gameOver) {
      setGameWon(true);
    }
  }, [score, gameStarted, gameOver, difficulty]);

  const createParticles = (x: number, y: number, color: string, count: number) => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      color,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  };

  const handleBubbleClick = (id: number, x: number, y: number, colorFrom: string, colorTo: string, points: number) => {
    if (gameOver || gameWon) return;

    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
    setScore((prev) => prev + points);
    createParticles(x, y, colorFrom, 8);
  };

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(false);
    setDifficulty(null);
    setBubbles([]);
    setParticles([]);
    setTimeLeft(0);
  };

  const handleDifficultySelect = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
    setGameStarted(true);
  };

  const WIN_SCORE = difficulty ? difficultySettings[difficulty].target : 0;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 relative">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-10px) rotate(5deg); }
        }
        @keyframes sparkle {
          0% { opacity: 0.2; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(1.2) translateY(20px); }
        }
        .bubble {
          animation: float 3.5s ease-in-out infinite;
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            animation: 'sparkle 0.8s ease-out forwards',
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}

      {!gameStarted && !difficulty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 px-4 py-4">
          {/* Top Section - Title & Bubbles */}
          <div className="flex flex-col items-center gap-2">
            {/* Bubble Icon */}
            <div className="text-5xl">🫧</div>
            
            {/* Title */}
            <h1 className="text-3xl font-black text-white text-center leading-tight" style={{textShadow: '0 2px 8px rgba(0,0,0,0.3)'}}>
              BUBBLE POP
            </h1>
            
            {/* Divider */}
            <div className="h-0.5 w-16 bg-white/60 rounded-full"></div>
            
            {/* Description */}
            <p className="text-xs text-white/95 text-center font-semibold">
              Pop bubbles to reach your target score!
            </p>

            {/* Select Play Statement */}
            <p className="text-sm font-black text-white/90 mt-1">
              SELECT PLAY
            </p>
          </div>

          {/* Middle Section - Buttons in Row */}
          <div className="flex gap-2 justify-center w-full px-2">
            <button
              onClick={() => handleDifficultySelect('easy')}
              className="flex-1 px-2 py-2 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-white/30"
            >
              <div className="text-lg">🟢</div>
              <div className="font-black text-xs">EASY</div>
              <div className="text-[8px] text-white/80">45s</div>
            </button>

            <button
              onClick={() => handleDifficultySelect('medium')}
              className="flex-1 px-2 py-2 bg-gradient-to-br from-amber-400 to-orange-600 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-white/30"
            >
              <div className="text-lg">🟡</div>
              <div className="font-black text-xs">MEDIUM</div>
              <div className="text-[8px] text-white/80">35s</div>
            </button>

            <button
              onClick={() => handleDifficultySelect('hard')}
              className="flex-1 px-2 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-white/30"
            >
              <div className="text-lg">🔴</div>
              <div className="font-black text-xs">HARD</div>
              <div className="text-[8px] text-white/80">30s</div>
            </button>
          </div>

          {/* Bottom spacer */}
          <div></div>
        </div>
      )}

      {gameStarted && difficulty && !gameOver && !gameWon && (
        <div className="flex-shrink-0 px-2 py-2 bg-white/85 backdrop-blur-sm border-b-2 border-purple-300 shadow-md">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="bg-blue-50 rounded-lg px-2 py-1 shadow-sm flex-1">
              <div className="text-[7px] text-blue-800 font-bold uppercase">💎 Score</div>
              <div className="text-lg font-black text-blue-700 leading-tight">{score}</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-2 py-1 shadow-sm flex-1 text-center">
              <div className="text-[7px] text-purple-800 font-bold uppercase">🎯 Target</div>
              <div className="text-lg font-black text-purple-700 leading-tight">{WIN_SCORE}</div>
            </div>
            <div className="bg-red-50 rounded-lg px-2 py-1 shadow-sm flex-1 text-right">
              <div className="text-[7px] text-red-800 font-bold uppercase">⏱️ Time</div>
              <div className={`text-lg font-black leading-tight ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-red-700'}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-purple-300">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${Math.min((score / WIN_SCORE) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {bubbles
          .filter((b) => !b.popped)
          .map((bubble) => (
            <button
              key={bubble.id}
              onClick={() => handleBubbleClick(bubble.id, bubble.x, bubble.y, bubble.colorFrom, bubble.colorTo, bubble.points)}
              className="absolute rounded-full cursor-pointer touch-manipulation active:scale-75 transition-transform duration-100 bubble"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                background: `linear-gradient(135deg, ${bubble.colorFrom}, ${bubble.colorTo})`,
                WebkitTapHighlightColor: 'transparent',
                boxShadow: `0 10px 25px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(0,0,0,0.15)`,
              }}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-sm drop-shadow-lg" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                +{bubble.points}
              </div>
            </button>
          ))}
      </div>

      {gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between bg-gradient-to-b from-yellow-200/95 via-pink-200/95 to-purple-200/95 p-4">
          <div className="text-5xl mb-2">🎉</div>
          
          <h1 className="text-3xl font-black text-white text-center leading-tight mb-2" style={{textShadow: '0 2px 8px rgba(0,0,0,0.3)'}}>
            YOU WIN!
          </h1>

          <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-xl shadow-md mb-2 border border-white/60">
            <p className="text-xs font-black text-purple-700">{difficulty?.toUpperCase()} MODE</p>
          </div>

          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-md mb-4 border border-white/60">
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-pink-600">
              {score} PTS
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all border-3 border-white/50"
          >
            🎮 PLAY AGAIN 🎮
          </button>
        </div>
      )}

      {gameOver && !gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between bg-gradient-to-b from-gray-300/95 via-slate-300/95 to-gray-400/95 p-4">
          <div className="text-5xl mb-2">😢</div>
          
          <h1 className="text-3xl font-black text-white text-center leading-tight mb-2" style={{textShadow: '0 2px 8px rgba(0,0,0,0.3)'}}>
            GAME OVER
          </h1>

          <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-xl shadow-md mb-2 border border-white/60">
            <p className="text-xs font-black text-gray-700">{difficulty?.toUpperCase()} LEVEL</p>
          </div>

          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-md mb-4 border border-white/60">
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {score} PTS
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all border-3 border-white/50"
          >
            🔄 RESTART 🔄
          </button>
        </div>
      )}
    </div>
  );
};