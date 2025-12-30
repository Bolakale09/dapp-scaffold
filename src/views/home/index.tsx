// Next, React
import { FC, useState, useEffect } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white overflow-hidden">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-2 sm:py-3 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[10px] sm:text-[11px]">
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
      <main className="flex flex-1 items-center justify-center px-2 sm:px-4 py-2 sm:py-3 min-h-0 overflow-hidden">
        <div className="relative w-full h-full max-w-sm mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake "feed card" top bar inside the phone */}
          <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] text-slate-400 flex-shrink-0">
            <span className="rounded-full bg-white/5 px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[8px] sm:text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-32px)] sm:h-[calc(100%-26px)] flex-col items-center justify-start px-2 sm:px-3 pb-2 sm:pb-3 pt-0.5 sm:pt-1 overflow-hidden">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-4 sm:h-5 items-center justify-center border-t border-white/10 px-2 text-[8px] sm:text-[9px] text-slate-500 flex-shrink-0">
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
    { name: 'red', from: '#f87171', to: '#dc2626', points: 10 },
    { name: 'orange', from: '#fb923c', to: '#ea580c', points: 15 },
    { name: 'yellow', from: '#facc15', to: '#ca8a04', points: 20 },
    { name: 'green', from: '#4ade80', to: '#16a34a', points: 25 },
    { name: 'blue', from: '#60a5fa', to: '#2563eb', points: 30 },
    { name: 'purple', from: '#a78bfa', to: '#7c3aed', points: 35 },
    { name: 'pink', from: '#f472b6', to: '#db2777', points: 40 },
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
    <div className="h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 relative">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); }
          50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.8); }
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
            transform: `translate(${p.vx * 10}px, ${p.vy * 10}px)`,
            opacity: 0.9,
            animation: 'sparkle 0.8s ease-out forwards',
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}

      {!gameStarted && !difficulty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-blue-300/95 via-purple-300/95 to-pink-300/95 p-8">
          <div className="text-9xl mb-6 animate-bounce drop-shadow-lg">🫧</div>
          <h1 className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 drop-shadow-lg text-center">
            Bubble Pop!
          </h1>
          <p className="text-lg text-gray-800 mb-10 text-center font-bold px-4">
            Pop bubbles to reach your target score!
          </p>
          
          <div className="flex flex-col gap-5 w-full px-6 max-w-sm">
            <button
              onClick={() => handleDifficultySelect('easy')}
              className="w-full px-8 py-5 bg-gradient-to-br from-green-300 via-green-400 to-green-600 text-white font-black rounded-2xl text-2xl shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-2 border-green-200 hover:from-green-400 hover:to-green-700 transform hover:scale-105"
            >
              🟢 EASY
            </button>
            <button
              onClick={() => handleDifficultySelect('medium')}
              className="w-full px-8 py-5 bg-gradient-to-br from-yellow-300 via-orange-400 to-orange-600 text-white font-black rounded-2xl text-2xl shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-2 border-yellow-200 hover:from-yellow-400 hover:to-orange-700 transform hover:scale-105"
            >
              🟡 MEDIUM
            </button>
            <button
              onClick={() => handleDifficultySelect('hard')}
              className="w-full px-8 py-5 bg-gradient-to-br from-red-400 via-red-500 to-red-700 text-white font-black rounded-2xl text-2xl shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-2 border-red-200 hover:from-red-500 hover:to-red-800 transform hover:scale-105"
            >
              🔴 HARD
            </button>
          </div>
        </div>
      )}

      {gameStarted && difficulty && !gameOver && !gameWon && (
        <div className="flex-shrink-0 px-5 py-4 bg-gradient-to-r from-white/90 via-purple-50/90 to-white/90 backdrop-blur-sm border-b-4 border-purple-400 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="bg-white/80 rounded-xl p-3 shadow-md flex-1">
              <div className="text-xs text-purple-600 font-black mb-1 uppercase tracking-wide">SCORE</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {score}
              </div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 shadow-md flex-1 text-center">
              <div className="text-xs text-purple-600 font-black mb-1 uppercase tracking-wide">TARGET</div>
              <div className="text-3xl font-black text-purple-600">{WIN_SCORE}</div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 shadow-md flex-1 text-right">
              <div className="text-xs text-purple-600 font-black mb-1 uppercase tracking-wide">TIME</div>
              <div className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
          <div className="h-3 bg-white/60 rounded-full overflow-hidden border-2 border-purple-300 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full shadow-lg"
              style={{ width: `${(score / WIN_SCORE) * 100}%` }}
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
              className="absolute rounded-full cursor-pointer touch-manipulation active:scale-75 transition-transform duration-100 hover:scale-110"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                background: `linear-gradient(135deg, ${bubble.colorFrom}, ${bubble.colorTo})`,
                transform: 'translate(-50%, -50%)',
                animation: 'float 3s ease-in-out infinite',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: `0 8px 20px rgba(0,0,0,0.25), inset -2px -2px 5px rgba(0,0,0,0.2)`,
              }}
            >
              <div className="w-full h-full rounded-full opacity-95 flex items-center justify-center text-white font-black text-sm drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                +{bubble.points}
              </div>
            </button>
          ))}
      </div>

      {gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-200/97 via-pink-200/97 to-purple-200/97 p-8 backdrop-blur-sm">
          <div className="text-9xl mb-6 animate-bounce drop-shadow-xl">🎉</div>
          <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-pink-600 to-purple-600 drop-shadow-lg text-center">
            YOU WIN!
          </h1>
          <div className="text-2xl font-black text-gray-800 mb-3 bg-white/80 px-6 py-2 rounded-xl shadow-lg">
            {difficulty?.toUpperCase()} MODE
          </div>
          <div className="text-2xl font-black text-gray-800 mb-8 bg-white/80 px-6 py-3 rounded-xl shadow-lg">
            Final Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-pink-600">{score}</span>
          </div>
          <button
            onClick={handleRestart}
            className="px-10 py-5 bg-gradient-to-br from-yellow-400 via-pink-400 to-purple-500 text-white font-black rounded-2xl text-2xl shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-3 border-white hover:scale-105 transform"
          >
            🎮 PLAY AGAIN 🎮
          </button>
        </div>
      )}

      {gameOver && !gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-gray-300/97 via-slate-300/97 to-gray-400/97 p-8 backdrop-blur-sm">
          <div className="text-9xl mb-6 drop-shadow-xl">😢</div>
          <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-slate-800 drop-shadow-lg text-center">
            GAME OVER
          </h1>
          <div className="text-2xl font-black text-gray-800 mb-3 bg-white/80 px-6 py-2 rounded-xl shadow-lg">
            {difficulty?.toUpperCase()} MODE
          </div>
          <div className="text-2xl font-black text-gray-800 mb-8 bg-white/80 px-6 py-3 rounded-xl shadow-lg">
            Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{score}</span>
          </div>
          <button
            onClick={handleRestart}
            className="px-10 py-5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-black rounded-2xl text-2xl shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-3 border-white hover:scale-105 transform"
          >
            🔄 RESTART 🔄
          </button>
        </div>
      )}
    </div>
  );
};