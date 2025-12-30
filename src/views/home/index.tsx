// Next, React
import { FC, useState, useEffect, useRef, useMemo } from 'react';
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
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; colorFrom: string; colorTo: string; points: number; popped?: boolean; type?: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' }>>([]);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; createdAt: number }>>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastPopTime, setLastPopTime] = useState(0);
  const [powerUpActive, setPowerUpActive] = useState<{ type: 'slow' | 'double' | null; expires: number }>({ type: null, expires: 0 });
  const [comboFlash, setComboFlash] = useState(false);
  const [fallSpeed, setFallSpeed] = useState(1.5);
  const [achievements, setAchievements] = useState<Set<string>>(new Set());
  const [screenShake, setScreenShake] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [timeBonus, setTimeBonus] = useState(0);
  const [totalPops, setTotalPops] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [chainReaction, setChainReaction] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [gameElapsedTime, setGameElapsedTime] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameAreaDimensions = useRef<{ width: number; height: number }>({ width: 400, height: 700 });
  
  const difficultySettings: Record<string, { 
    duration: number; 
    spawnRate: number; 
    target: number; 
    label: string;
    fallSpeed: number;
    speedRamp: number;
    missPenalty: number;
  }> = {
    easy: { duration: 45, spawnRate: 1200, target: 300, label: 'EASY', fallSpeed: 0.5, speedRamp: 0.005, missPenalty: 0.04 },
    medium: { duration: 35, spawnRate: 800, target: 500, label: 'MEDIUM', fallSpeed: 1.8, speedRamp: 0.015, missPenalty: 0.12 },
    hard: { duration: 30, spawnRate: 500, target: 800, label: 'HARD', fallSpeed: 2.4, speedRamp: 0.02, missPenalty: 0.16 },
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

  // Extracted reusable inline styles
  const commonStyles = {
    scaleIn: { animation: 'scaleIn 0.4s ease-out' },
    scaleInDelay1: { animation: 'scaleIn 0.3s ease-out 0.1s backwards' },
    scaleInDelay2: { animation: 'scaleIn 0.3s ease-out 0.2s backwards' },
    scaleInDelay3: { animation: 'scaleIn 0.3s ease-out 0.3s backwards' },
    dropShadow: { filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.2))' },
    dropShadowYellow: { filter: 'drop-shadow(0 4px 16px rgba(234,179,8,0.4))' },
    dropShadowSmall: { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' },
    textShadow: { textShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    textShadowStrong: { textShadow: '0 2px 6px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.2)' },
  };

  // Measure and store game area dimensions
  useEffect(() => {
    const measureGameArea = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        gameAreaDimensions.current = {
          width: rect.width,
          height: rect.height,
        };
      }
    };

    // Measure on mount and resize
    measureGameArea();
    window.addEventListener('resize', measureGameArea);
    
    // Also measure when game starts (in case layout changes)
    if (gameStarted) {
      measureGameArea();
    }

    return () => {
      window.removeEventListener('resize', measureGameArea);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || !difficulty || showTutorial) return;

    const spawnInterval = setInterval(() => {
      const rand = Math.random();
      let bubbleType: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' = 'normal';
      let color = colors[Math.floor(Math.random() * colors.length)];
      let size = Math.random() * 30 + 40;
      let points = color.points;
      let colorFrom = color.from;
      let colorTo = color.to;

      // Special bubbles: 5% golden, 3% bomb, 2% power-ups each
      if (rand < 0.05) {
        bubbleType = 'golden';
        colorFrom = '#fbbf24';
        colorTo = '#f59e0b';
        points = 100;
        size = 50;
      } else if (rand < 0.08) {
        bubbleType = 'bomb';
        colorFrom = '#1f2937';
        colorTo = '#111827';
        points = -50;
        size = 45;
      } else if (rand < 0.10) {
        bubbleType = 'slow';
        colorFrom = '#3b82f6';
        colorTo = '#1d4ed8';
        points = 0;
        size = 40;
      } else if (rand < 0.12) {
        bubbleType = 'double';
        colorFrom = '#8b5cf6';
        colorTo = '#6d28d9';
        points = 0;
        size = 40;
      }

      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10,
          y: -10,
          size,
          colorFrom,
          colorTo,
          points,
          type: bubbleType,
        },
      ]);
    }, difficultySettings[difficulty].spawnRate);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, gameWon, difficulty, showTutorial]);

  // Bubble movement using requestAnimationFrame
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Calculate movement based on delta time (normalize to ~60fps)
      const frameMultiplier = deltaTime / 16.67; // Normalize to 60fps
      const speed = (powerUpActive.type === 'slow' ? fallSpeed * 0.3 : fallSpeed) * frameMultiplier;
      
      setBubbles((prev) => {
        // First, move all bubbles
        const moved = prev
          .filter((b) => !b.popped)
          .map((b) => ({ ...b, y: b.y + speed }));

        // Detect bubbles that just exited the screen (y >= 100)
        const exitedBubbles = moved.filter(
          (b) => b.y >= 100 && (b.type === 'normal' || b.type === 'golden' || !b.type)
        );

        if (exitedBubbles.length > 0) {
          // Reset combo when normal/golden bubbles exit
          setCombo(0);
          setComboMultiplier(1);
          
          // Increase fall speed on missed bubbles (difficulty-specific penalty)
          if (difficulty) {
            const missPenalty = difficultySettings[difficulty].missPenalty;
            setFallSpeed((prevSpeed) => Math.min(prevSpeed + missPenalty, 3.5));
          }
        }

        // Filter out bubbles that have exited
        return moved.filter((b) => b.y < 105);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, gameOver, gameWon, showTutorial, fallSpeed, powerUpActive, difficulty]);

  // Combo timeout - reset if no pop for 2 seconds
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial) return;
    const comboTimeout = setTimeout(() => {
      if (combo > 0) {
          setCombo(0);
        setComboMultiplier(1);
      }
    }, 2000);
    return () => clearTimeout(comboTimeout);
  }, [lastPopTime, gameStarted, gameOver, gameWon, showTutorial, combo]);

  // Power-up expiration
  useEffect(() => {
    if (powerUpActive.type && powerUpActive.expires > 0) {
      const checkInterval = setInterval(() => {
        if (Date.now() > powerUpActive.expires) {
          setPowerUpActive({ type: null, expires: 0 });
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [powerUpActive]);

  // Initialize timer when tutorial is dismissed
  useEffect(() => {
    if (!gameStarted || !difficulty || showTutorial) return;
    
    const duration = difficultySettings[difficulty].duration;
    if (timeLeft === 0 || timeLeft === duration) {
      setTimeLeft(duration);
    }
  }, [gameStarted, difficulty, showTutorial]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || !difficulty || showTutorial || gameOver || gameWon) return;

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
  }, [gameStarted, difficulty, showTutorial, gameOver, gameWon]);

  // Track game elapsed time for gradual speed increase
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial) return;

    const timeTracker = setInterval(() => {
      setGameElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timeTracker);
  }, [gameStarted, gameOver, gameWon, showTutorial]);

  // Gradual speed increase over time (every 5 seconds) - difficulty-specific ramp
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial || !difficulty) return;

    const speedRamp = difficultySettings[difficulty].speedRamp;
    const speedIncreaseInterval = setInterval(() => {
      setFallSpeed((prevSpeed) => Math.min(prevSpeed + speedRamp, 3.5));
    }, 5000); // Every 5 seconds

    return () => clearInterval(speedIncreaseInterval);
  }, [gameStarted, gameOver, gameWon, showTutorial, difficulty]);

  // Speed increase on high combos (optional - every 10 combo)
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial) return;

    if (combo > 0 && combo % 10 === 0 && combo <= 50) {
      setFallSpeed((prevSpeed) => Math.min(prevSpeed + 0.03, 3.5));
    }
  }, [combo, gameStarted, gameOver, gameWon, showTutorial]);

  // Particle animation and cleanup using requestAnimationFrame
  // Particles move based on their velocity and are removed after 800ms
  // Velocity is converted from pixels to percentage for responsive positioning
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaSeconds = deltaTime / 1000;
      const particleLifetime = 800; // 800ms lifetime

      setParticles((prev) => {
        const now = performance.now();
        return prev
          .filter((p) => now - p.createdAt < particleLifetime)
          .map((p) => {
            // Convert velocity to percentage-based movement
            // Assuming viewport width ~400px, velocity is in pixels, convert to percentage
            const vxPercent = (p.vx * deltaSeconds) / 4; // Approximate conversion
            const vyPercent = (p.vy * deltaSeconds) / 7; // Approximate conversion for height
            return {
              ...p,
              x: Math.max(0, Math.min(100, p.x + vxPercent)),
              y: Math.max(0, Math.min(100, p.y + vyPercent)),
            };
          });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    if (!difficulty) return;
    const target = difficultySettings[difficulty].target;
    if (score >= target && gameStarted && !gameOver) {
      setGameWon(true);
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2000);
    }
  }, [score, gameStarted, gameOver, difficulty]);

  // Achievement system
  useEffect(() => {
    if (!gameStarted || !difficulty) return;
    const target = difficultySettings[difficulty].target;
    const currentAchievements = new Set(achievements);
    const newlyUnlocked: string[] = [];
    
    if (combo >= 10 && !achievements.has('combo10')) {
      currentAchievements.add('combo10');
      newlyUnlocked.push('combo10');
    }
    if (combo >= 20 && !achievements.has('combo20')) {
      currentAchievements.add('combo20');
      newlyUnlocked.push('combo20');
    }
    if (maxCombo >= 30 && !achievements.has('combo30')) {
      currentAchievements.add('combo30');
      newlyUnlocked.push('combo30');
    }
    if (totalPops >= 50 && !achievements.has('pops50')) {
      currentAchievements.add('pops50');
      newlyUnlocked.push('pops50');
    }
    if (totalPops >= 100 && !achievements.has('pops100')) {
      currentAchievements.add('pops100');
      newlyUnlocked.push('pops100');
    }
    if (score >= target * 0.5 && target > 0 && !achievements.has('halfway')) {
      currentAchievements.add('halfway');
      newlyUnlocked.push('halfway');
    }
    if (chainReaction >= 3 && !achievements.has('chain3')) {
      currentAchievements.add('chain3');
      newlyUnlocked.push('chain3');
    }

    if (newlyUnlocked.length > 0) {
      setAchievements(currentAchievements);
      setNewAchievements((prev) => [...prev, ...newlyUnlocked]);
      setTimeout(() => {
        setNewAchievements((prev) => prev.filter(a => !newlyUnlocked.includes(a)));
      }, 2000);
    }
  }, [combo, maxCombo, totalPops, score, chainReaction, gameStarted, achievements, difficulty]);

  // Time bonus calculation
  useEffect(() => {
    if (gameWon && timeLeft > 0) {
      const bonus = timeLeft * 10;
      setTimeBonus(bonus);
      setScore((prev) => prev + bonus);
    }
  }, [gameWon, timeLeft]);

  const createParticles = (x: number, y: number, color: string, count: number) => {
    const now = performance.now();
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: now + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      color,
      createdAt: now,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Helper: Apply combo logic
  // Combo increases if bubbles are popped within 2 seconds of each other
  // Golden bubbles add +3 to combo, chain reactions add their count
  // If combo breaks (time > 2s), reset to 1 or chain count if applicable
  const applyComboLogic = (
    timeSinceLastPop: number,
    currentCombo: number,
    bubbleType: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' | undefined,
    chainCount: number
  ): { newCombo: number; shouldFlash: boolean } => {
    let newCombo = currentCombo;
    let shouldFlash = false;

    if (timeSinceLastPop < 2000 && (bubbleType === 'normal' || bubbleType === 'golden')) {
      newCombo = currentCombo + 1 + (chainCount > 0 ? chainCount : 0);
      shouldFlash = true;
    } else if (bubbleType === 'golden') {
      newCombo = currentCombo + 3;
      shouldFlash = true;
    } else if (chainCount > 0) {
      newCombo = chainCount;
    } else {
      newCombo = 1;
    }

    return { newCombo, shouldFlash };
  };

  // Helper: Apply power-up effects
  const applyPowerUp = (
    bubbleType: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' | undefined,
    currentPowerUp: { type: 'slow' | 'double' | null; expires: number },
    now: number
  ): { powerUp: { type: 'slow' | 'double' | null; expires: number }; shouldActivate: boolean } => {
    if (bubbleType === 'slow') {
      return {
        powerUp: { type: 'slow', expires: now + 5000 },
        shouldActivate: true,
      };
    }
    if (bubbleType === 'double') {
      return {
        powerUp: { type: 'double', expires: now + 5000 },
        shouldActivate: true,
      };
    }
    return { powerUp: currentPowerUp, shouldActivate: false };
  };

  // Helper: Calculate final score with multipliers and bonuses
  const calculateScore = (
    basePoints: number,
    bubbleType: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' | undefined,
    combo: number,
    powerUpType: 'slow' | 'double' | null,
    chainCount: number
  ): { finalPoints: number; multiplier: number } => {
    // Calculate combo multiplier (1x, 2x at 5, 3x at 10, 4x at 15, 5x at 20+)
    const comboMultiplier = Math.min(1 + Math.floor(combo / 5), 5);
    
    // Apply power-up multiplier
    const finalMultiplier = powerUpType === 'double' ? comboMultiplier * 2 : comboMultiplier;
    
    // Calculate chain bonus
    const chainBonus = chainCount > 0 ? chainCount * 5 : 0;
    
    // Calculate final points
    const finalPoints = bubbleType === 'golden' 
      ? basePoints 
      : (basePoints * finalMultiplier) + chainBonus;

    return { finalPoints, multiplier: finalMultiplier };
  };

  const handleBubbleClick = (id: number, x: number, y: number, colorFrom: string, colorTo: string, points: number, bubbleType?: 'normal' | 'golden' | 'bomb' | 'slow' | 'double') => {
    if (gameOver || gameWon) return;

    const now = Date.now();
    const timeSinceLastPop = now - lastPopTime;
    
    // Handle special bubbles
    if (bubbleType === 'bomb') {
      setCombo(0);
      setComboMultiplier(1);
      setScore((prev) => Math.max(0, prev + points));
      createParticles(x, y, '#ef4444', 15);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
      setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
      return;
    }

    // Apply power-up if bubble is a power-up type
    const powerUpResult = applyPowerUp(bubbleType, powerUpActive, now);
    if (powerUpResult.shouldActivate) {
      setPowerUpActive(powerUpResult.powerUp);
      createParticles(x, y, colorFrom, 12);
      setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
      return;
    }

    // Chain reaction detection - pop nearby bubbles
    let chainCount = 0;
    setBubbles((prev) => {
      const clickedBubble = prev.find(b => b.id === id);
      if (!clickedBubble) return prev;
      
      const { width, height } = gameAreaDimensions.current;
      // Distance threshold: 15% of the smaller dimension (responsive)
      const distanceThreshold = Math.min(width, height) * 0.15;
      
      const nearbyBubbles = prev.filter(b => {
        if (b.id === id || b.popped || b.type === 'bomb') return false;
        // Convert percentage positions to pixel coordinates
        const x1 = (clickedBubble.x / 100) * width;
        const y1 = (clickedBubble.y / 100) * height;
        const x2 = (b.x / 100) * width;
        const y2 = (b.y / 100) * height;
        // Calculate actual pixel distance
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < distanceThreshold;
      });

      if (nearbyBubbles.length >= 2) {
        chainCount = nearbyBubbles.length;
        setChainReaction(chainCount);
        nearbyBubbles.forEach(nb => {
          createParticles(nb.x, nb.y, nb.colorFrom, 6);
        });
      }

      return prev.map((b) => {
        if (b.id === id) return { ...b, popped: true };
        if (nearbyBubbles.some(nb => nb.id === b.id)) return { ...b, popped: true };
        return b;
      });
    });

    // Apply combo logic
    const comboResult = applyComboLogic(timeSinceLastPop, combo, bubbleType, chainCount);
    const newCombo = comboResult.newCombo;
    
      setCombo(newCombo);
    if (comboResult.shouldFlash) {
      setComboFlash(true);
      setTimeout(() => setComboFlash(false), 300);
    }
      
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      
    // Calculate multiplier from combo
    const multiplier = Math.min(1 + Math.floor(newCombo / 5), 5);
    setComboMultiplier(multiplier);

    // Calculate final score
    const scoreResult = calculateScore(points, bubbleType, newCombo, powerUpActive.type, chainCount);
    setScore((prev) => prev + scoreResult.finalPoints);
    setTotalPops((prev) => prev + 1 + chainCount);
    setLastPopTime(now);
    createParticles(x, y, colorFrom, bubbleType === 'golden' ? 20 : (chainCount > 0 ? 15 : 10));
    
    // Visual feedback for chain reactions
    if (chainCount >= 3) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    }
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
    setCombo(0);
    setMaxCombo(0);
    setComboMultiplier(1);
    setLastPopTime(0);
    setPowerUpActive({ type: null, expires: 0 });
    setComboFlash(false);
    setFallSpeed(1.5); // Will be set correctly when difficulty is selected
    setAchievements(new Set());
    setScreenShake(false);
    setCelebration(false);
    setTimeBonus(0);
    setTotalPops(0);
    setShowTutorial(true);
    setChainReaction(0);
    setNewAchievements([]);
    setGameElapsedTime(0);
  };

  const handleDifficultySelect = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
    setFallSpeed(difficultySettings[level].fallSpeed);
    setGameStarted(true);
  };

  const WIN_SCORE = difficulty ? difficultySettings[difficulty].target : 0;

  // Memoized achievement text lookup
  const achievementTexts = useMemo(() => ({
    combo10: '🔥 Combo Master!',
    combo20: '⚡ Combo Legend!',
    combo30: '🌟 Combo God!',
    pops50: '🎯 Bubble Popper!',
    pops100: '💥 Bubble Destroyer!',
    halfway: '📈 Halfway Hero!',
    chain3: '💫 Chain Reaction!',
  }), []);

  const getAchievementText = (key: string) => {
    return achievementTexts[key as keyof typeof achievementTexts] || '🏆 Achievement!';
  };

  return (
    <div 
      className={`h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-indigo-100 via-purple-100 to-pink-100 relative ${screenShake ? 'animate-shake' : ''} ${celebration ? 'animate-celebrate' : ''}`}
    style={{
        animation: screenShake ? 'shake 0.3s ease-in-out' : celebration ? 'celebrate 0.6s ease-in-out' : 'none',
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-4px) rotate(2deg); }
        }
        @keyframes sparkle {
          0% { opacity: 0.4; transform: scale(0.6) translateY(0); }
          100% { opacity: 0; transform: scale(1.5) translateY(-30px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes comboFlash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes specialPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        @keyframes achievementPop {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
          100% { opacity: 0; transform: scale(0.9) translateY(-30px); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

        {particles.map((p) => (
          <div
            key={p.id}
          className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            animation: 'sparkle 0.6s ease-out forwards',
            boxShadow: `0 0 12px ${p.color}, 0 0 20px ${p.color}`,
          }}
        />
      ))}

      {/* Achievement Notifications */}
      {newAchievements.map((achievement, idx) => (
        <div
          key={`${achievement}-${idx}`}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white font-black px-4 py-2 rounded-xl shadow-2xl border-2 border-white/50"
            style={{
            animation: `achievementPop 2s ease-out ${idx * 0.2}s forwards`,
              transform: 'translateX(-50%)',
          }}
        >
          {getAchievementText(achievement)}
        </div>
      ))}

      {/* Celebration Confetti */}
      {celebration && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${(i * 3.33) % 100}%`,
                top: '-10px',
                background: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#3b82f6'][i % 6],
                animation: `confetti ${2 + Math.random()}s linear forwards`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tutorial Overlay - Shows before game starts */}
      {showTutorial && difficulty && gameStarted && !gameOver && !gameWon && (
        <div 
          className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the content
            if (e.target === e.currentTarget) {
              setShowTutorial(false);
            }
          }}
        >
          <div 
            className="bg-white/98 rounded-2xl p-4 sm:p-6 max-w-sm shadow-2xl border-2 border-purple-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-purple-700 mb-3 text-center">💡 Tips & Tricks</h3>
            <ul className="text-sm text-gray-700 space-y-2 mb-4">
              <li>✨ <strong>Combo System:</strong> Pop bubbles quickly to build combos!</li>
              <li>⭐ <strong>Golden Bubbles:</strong> Worth 100 points + boost combo!</li>
              <li>💣 <strong>Bomb Bubbles:</strong> Avoid them - they reset your combo!</li>
              <li>⚡ <strong>Power-ups:</strong> Collect slow-mo and double points!</li>
              <li>💫 <strong>Chain Reactions:</strong> Pop bubbles close together!</li>
            </ul>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTutorial(false);
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2.5 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95 touch-manipulation"
            >
              Got it! 🎮
            </button>
          </div>
        </div>
      )}

      {!gameStarted && !difficulty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-200/98 via-purple-200/98 to-pink-200/98 p-4 sm:p-6 backdrop-blur-sm" style={{animation: 'slideIn 0.4s ease-out'}}>
          <div className="text-7xl sm:text-9xl mb-4 sm:mb-6 animate-bounce" style={commonStyles.dropShadowSmall}>🫧</div>
          <h1 className="text-4xl sm:text-5xl font-black mb-2 sm:mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-center px-2" style={commonStyles.textShadow}>
            Bubble Pop!
          </h1>
          <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 text-center font-semibold px-4 max-w-xs">
            Pop bubbles to reach your target score!
          </p>
          
          <div className="flex flex-col gap-3 sm:gap-4 w-full px-4 sm:px-6 max-w-xs sm:max-w-sm">
            <button
              onClick={() => handleDifficultySelect('easy')}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-white font-black rounded-xl sm:rounded-2xl text-lg sm:text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-emerald-300/50 hover:border-emerald-200 hover:scale-[1.02] touch-manipulation"
              style={commonStyles.scaleInDelay1}
            >
              🟢 EASY
            </button>
            <button
              onClick={() => handleDifficultySelect('medium')}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 text-white font-black rounded-xl sm:rounded-2xl text-lg sm:text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-amber-300/50 hover:border-amber-200 hover:scale-[1.02] touch-manipulation"
              style={commonStyles.scaleInDelay2}
            >
              🟡 MEDIUM
            </button>
            <button
              onClick={() => handleDifficultySelect('hard')}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white font-black rounded-xl sm:rounded-2xl text-lg sm:text-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-red-300/50 hover:border-red-200 hover:scale-[1.02] touch-manipulation"
              style={commonStyles.scaleInDelay3}
            >
              🔴 HARD
            </button>
          </div>
      </div>
      )}

      {gameStarted && difficulty && !gameOver && !gameWon && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-white/95 via-purple-50/95 to-white/95 backdrop-blur-md border-b-2 sm:border-b-3 border-purple-400/80 shadow-md">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/90 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm flex-1 border border-blue-200/50">
              <div className="text-[9px] sm:text-xs text-blue-700 font-bold mb-0.5 sm:mb-1 uppercase tracking-wide">SCORE</div>
              <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 leading-tight">
                {score}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/90 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm flex-1 text-center border border-purple-200/50">
              <div className="text-[9px] sm:text-xs text-purple-700 font-bold mb-0.5 sm:mb-1 uppercase tracking-wide">TARGET</div>
              <div className="text-xl sm:text-2xl font-black text-purple-700 leading-tight">{WIN_SCORE}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/90 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm flex-1 text-right border border-orange-200/50">
              <div className="text-[9px] sm:text-xs text-orange-700 font-bold mb-0.5 sm:mb-1 uppercase tracking-wide">TIME</div>
              <div className={`text-xl sm:text-2xl font-black leading-tight ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            {combo > 0 && (
              <div className={`bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg px-3 py-1.5 shadow-sm border border-orange-300/50 ${comboFlash ? 'scale-[1.02]' : ''} transition-transform duration-200`}>
                <div className="text-[8px] sm:text-[9px] text-orange-700 font-bold uppercase">COMBO</div>
                <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 leading-tight">
                  {combo} × {comboMultiplier}
                </div>
              </div>
            )}
            {powerUpActive.type && (
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg px-3 py-1.5 shadow-sm border border-purple-300/50">
                <div className="text-[8px] sm:text-[9px] text-purple-700 font-bold uppercase">
                  {powerUpActive.type === 'slow' ? '⏱️ SLOW-MO' : '⚡ DOUBLE'}
                </div>
                <div className="text-xs text-purple-600 font-bold">
                  {Math.ceil((powerUpActive.expires - Date.now()) / 1000)}s
                </div>
              </div>
            )}
            <div className="flex-1"></div>
          </div>
          <div className="h-2 sm:h-2.5 bg-white/70 rounded-full overflow-hidden border border-purple-300/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min((score / WIN_SCORE) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div ref={gameAreaRef} className="flex-1 relative overflow-hidden">
        {bubbles
          .filter((b) => !b.popped)
          .map((bubble) => {
            const isSpecial = bubble.type && bubble.type !== 'normal';
            const getSpecialIcon = () => {
              if (bubble.type === 'golden') return '⭐';
              if (bubble.type === 'bomb') return '💣';
              if (bubble.type === 'slow') return '⏱️';
              if (bubble.type === 'double') return '⚡';
              return '';
            };
            const getSpecialShadow = () => {
              if (bubble.type === 'golden') return `0 0 15px rgba(251,191,36,0.5), 0 6px 18px rgba(0,0,0,0.3)`;
              if (bubble.type === 'bomb') return `0 0 15px rgba(239,68,68,0.5), 0 6px 18px rgba(0,0,0,0.4)`;
              if (bubble.type === 'slow') return `0 0 15px rgba(59,130,246,0.5), 0 6px 18px rgba(0,0,0,0.25)`;
              if (bubble.type === 'double') return `0 0 15px rgba(139,92,246,0.5), 0 6px 18px rgba(0,0,0,0.25)`;
              return `0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)`;
            };
            
            return (
              <button
                key={bubble.id}
                onClick={() => handleBubbleClick(bubble.id, bubble.x, bubble.y, bubble.colorFrom, bubble.colorTo, bubble.points, bubble.type)}
                className={`absolute rounded-full cursor-pointer touch-manipulation active:scale-90 transition-transform duration-150 hover:scale-105 ${isSpecial ? 'animate-pulse' : ''}`}
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  background: `linear-gradient(135deg, ${bubble.colorFrom}, ${bubble.colorTo})`,
                  animation: isSpecial ? 'float 2s ease-in-out infinite' : 'float 3.5s ease-in-out infinite',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: `${getSpecialShadow()}, inset 0 -2px 6px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.25)`,
                }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm drop-shadow-lg" style={commonStyles.textShadowStrong}>
                  {isSpecial ? (
                    <div className="flex flex-col items-center">
                      <div className="text-lg sm:text-xl">{getSpecialIcon()}</div>
                      {bubble.type === 'golden' && <div className="text-[10px] sm:text-xs">+{bubble.points}</div>}
                      {bubble.type === 'bomb' && <div className="text-[10px] sm:text-xs">{bubble.points}</div>}
                    </div>
                  ) : (
                    `+${bubble.points}`
                  )}
              </div>
              </button>
            );
          })}
              </div>

      {gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-100/98 via-pink-100/98 to-purple-100/98 p-4 sm:p-6 backdrop-blur-md" style={commonStyles.scaleIn}>
          <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce" style={commonStyles.dropShadowYellow}>🎉</div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-pink-600 to-purple-600 text-center px-2">
            YOU WIN!
          </h1>
          <div className="text-base sm:text-lg font-bold text-gray-700 mb-2 bg-white/90 px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl shadow-md border border-yellow-200/50">
            {difficulty?.toUpperCase()} MODE
              </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 w-full max-w-xs sm:max-w-sm">
            <div className="text-base sm:text-lg font-black text-gray-800 bg-white/90 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-md border border-pink-200/50">
              Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-pink-600">{score}</span>
            </div>
            <div className="text-base sm:text-lg font-black text-gray-800 bg-white/90 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-md border border-orange-200/50">
              Max Combo: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">{maxCombo}</span>
            </div>
          </div>
          {timeBonus > 0 && (
            <div className="text-base sm:text-lg font-black text-gray-800 mb-3 bg-gradient-to-r from-green-100 to-emerald-100 px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl shadow-md border border-green-300/50">
              ⏱️ Time Bonus: <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">+{timeBonus}</span>
            </div>
          )}
          {achievements.size > 0 && (
            <div className="mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm">
              <div className="text-sm font-bold text-gray-700 mb-2 text-center">🏆 Achievements Unlocked: {achievements.size}</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from(achievements).map((ach) => (
                  <div key={ach} className="bg-gradient-to-r from-yellow-200 to-orange-200 px-3 py-1 rounded-full text-xs font-bold text-gray-800 border border-yellow-300">
                    {getAchievementText(ach)}
                  </div>
                ))}
              </div>
            </div>
          )}
            <button
              onClick={handleRestart}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-br from-yellow-400 via-pink-400 to-purple-500 text-white font-black rounded-xl sm:rounded-2xl text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-white/60 hover:scale-[1.02] touch-manipulation"
            >
              🎮 PLAY AGAIN 🎮
            </button>
          </div>
        )}

      {gameOver && !gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-gray-200/98 via-slate-200/98 to-gray-300/98 p-4 sm:p-6 backdrop-blur-md" style={commonStyles.scaleIn}>
          <div className="text-6xl sm:text-8xl mb-4 sm:mb-6" style={commonStyles.dropShadow}>😢</div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-slate-800 text-center px-2">
            GAME OVER
          </h1>
          <div className="text-base sm:text-lg font-bold text-gray-700 mb-2 bg-white/90 px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl shadow-md border border-slate-200/50">
            {difficulty?.toUpperCase()} MODE
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm">
            <div className="text-lg sm:text-xl font-black text-gray-800 bg-white/90 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md border border-blue-200/50">
              Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{score}</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-gray-800 bg-white/90 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md border border-orange-200/50">
              Max Combo: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">{maxCombo}</span>
            </div>
          </div>
              <button
            onClick={handleRestart}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-black rounded-xl sm:rounded-2xl text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-white/60 hover:scale-[1.02] touch-manipulation"
          >
            🔄 RESTART 🔄
              </button>
        </div>
      )}
    </div>
  );
};