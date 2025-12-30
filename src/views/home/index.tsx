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
  // Note: x is percentage (0-100), y is pixels from top of game area
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
  const scoreRef = useRef(0);
  const [currentSpawnRate, setCurrentSpawnRate] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const warningSoundRef = useRef<OscillatorNode | null>(null);
  const lastWarningTimeRef = useRef(0);

  // Smooth curve functions for progressive difficulty
  // Ease-in-out curve: smooth acceleration and deceleration
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Calculate progressive spawn rate (decreases = more bubbles)
  // Phase 1: Increase spawn rate first (0-40% of game time)
  const calculateSpawnRate = (elapsedTime: number, totalDuration: number, baseSpawnRate: number): number => {
    const progress = Math.min(elapsedTime / (totalDuration * 0.4), 1); // First 40% of game
    const curve = easeInOutCubic(progress);
    // Spawn rate decreases (more frequent) from base to base * 0.4
    const minSpawnRate = baseSpawnRate * 0.4;
    return baseSpawnRate - (baseSpawnRate - minSpawnRate) * curve;
  };

  // Calculate progressive speed (increases after spawn rate phase)
  // Phase 2: Increase speed (40-80% of game time)
  const calculateSpeed = (elapsedTime: number, totalDuration: number, baseSpeed: number, maxSpeed: number): number => {
    const phaseStart = totalDuration * 0.4; // Start after spawn rate phase
    const phaseEnd = totalDuration * 0.8; // End at 80% of game
    if (elapsedTime < phaseStart) return baseSpeed;
    
    const phaseProgress = Math.min((elapsedTime - phaseStart) / (phaseEnd - phaseStart), 1);
    const curve = easeInOutCubic(phaseProgress);
    return baseSpeed + (maxSpeed - baseSpeed) * curve;
  };

  // Calculate multi-bubble spawn chance (increases in final phase)
  // Phase 3: Multi-emoji patterns (80-100% of game time)
  const calculateMultiBubbleChance = (elapsedTime: number, totalDuration: number): number => {
    const phaseStart = totalDuration * 0.8; // Start at 80% of game
    if (elapsedTime < phaseStart) return 0;
    
    const phaseProgress = Math.min((elapsedTime - phaseStart) / (totalDuration - phaseStart), 1);
    const curve = easeInOutCubic(phaseProgress);
    // Max 30% chance for multi-bubble spawns
    return curve * 0.3;
  };
  
  const difficultySettings: Record<string, { 
    duration: number; 
    spawnRate: number; 
    target: number; 
    label: string;
    fallSpeed: number;
    speedRamp: number;
    missPenalty: number;
  }> = {
    easy: { duration: 45, spawnRate: 1200, target: 300, label: 'EASY', fallSpeed: 0.4, speedRamp: 0.003, missPenalty: 0.03 },
    medium: { duration: 35, spawnRate: 800, target: 500, label: 'MEDIUM', fallSpeed: 1.4, speedRamp: 0.008, missPenalty: 0.08 },
    hard: { duration: 30, spawnRate: 500, target: 800, label: 'HARD', fallSpeed: 1.9, speedRamp: 0.012, missPenalty: 0.12 },
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

  // Sound Design - Low-volume, non-intrusive
  // Initialize audio context on first use
  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Generate a simple tone
  const playTone = (frequency: number, duration: number, volume: number = 0.15, type: OscillatorType = 'sine') => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  };

  // Pop/catch sound - short, pleasant pop
  const playPopSound = () => {
    playTone(800, 0.08, 0.12, 'sine');
    // Add a quick higher tone for richness
    setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 10);
  };

  // Warning sound - when bubbles near bottom (low, urgent tone)
  const playWarningSound = () => {
    if (warningSoundRef.current) return; // Don't overlap warnings
    
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 300;
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      warningSoundRef.current = oscillator;
      setTimeout(() => {
        warningSoundRef.current = null;
      }, 200);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  };

  // Game over tone - descending, somber
  const playGameOverSound = () => {
    playTone(400, 0.3, 0.15, 'sine');
    setTimeout(() => playTone(300, 0.4, 0.12, 'sine'), 200);
  };

  // Combo sound - increasing pitch based on combo level
  const playComboSound = (comboLevel: number) => {
    // Base frequency increases with combo (400Hz + 50Hz per combo level, capped)
    const baseFreq = 400 + Math.min(comboLevel * 50, 600);
    playTone(baseFreq, 0.1, 0.12, 'sine');
    // Add harmonic for richness
    setTimeout(() => playTone(baseFreq * 1.5, 0.08, 0.08, 'sine'), 20);
  };

  // Measure and store game area dimensions
  useEffect(() => {
    const measureGameArea = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        // Use clientHeight to exclude padding (for accurate playable area measurement)
        // Fallback to rect.height if clientHeight is 0
        const innerHeight = gameAreaRef.current.clientHeight > 0 
          ? gameAreaRef.current.clientHeight 
          : rect.height;
        gameAreaDimensions.current = {
          width: rect.width,
          height: innerHeight,
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

  // Keep score ref in sync with state
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || !difficulty || showTutorial) return;

    const baseSpawnRate = difficultySettings[difficulty].spawnRate;
    const totalDuration = difficultySettings[difficulty].duration;
    let intervalId: NodeJS.Timeout;

    const spawnBubble = () => {
      // Recalculate spawn rate dynamically from elapsed time (smooth curve)
      // Use currentSpawnRate if available, otherwise calculate from elapsed time
      const calculatedRate = calculateSpawnRate(gameElapsedTime, totalDuration, baseSpawnRate);
      const currentRate = currentSpawnRate > 0 ? currentSpawnRate : calculatedRate;
      
      // Check for multi-bubble spawn (Phase 3: final 20% of game)
      const multiBubbleChance = calculateMultiBubbleChance(gameElapsedTime, totalDuration);
      const shouldSpawnMultiple = Math.random() < multiBubbleChance;
      const bubbleCount = shouldSpawnMultiple ? 2 + Math.floor(Math.random() * 2) : 1; // 2-3 bubbles

      const newBubbles = [];
      
      for (let i = 0; i < bubbleCount; i++) {
        const rand = Math.random();
        let bubbleType: 'normal' | 'golden' | 'bomb' | 'slow' | 'double' = 'normal';
        let color = colors[Math.floor(Math.random() * colors.length)];
        let size = Math.random() * 20 + 30;
        let points = color.points;
        let colorFrom = color.from;
        let colorTo = color.to;

        // Special bubbles: 5% golden, 3% bomb, 2% power-ups each (only if score >= 10)
        if (rand < 0.05) {
          bubbleType = 'golden';
          colorFrom = '#fbbf24';
          colorTo = '#f59e0b';
          points = 100;
          size = 45;
        } else if (rand < 0.08) {
          bubbleType = 'bomb';
          colorFrom = '#1f2937';
          colorTo = '#111827';
          points = -50;
          size = 40;
        } else if (rand < 0.10 && scoreRef.current >= 10) {
          bubbleType = 'slow';
          colorFrom = '#3b82f6';
          colorTo = '#1d4ed8';
          points = 0;
          size = 35;
        } else if (rand < 0.12 && scoreRef.current >= 10) {
          bubbleType = 'double';
          colorFrom = '#8b5cf6';
          colorTo = '#6d28d9';
          points = 0;
          size = 35;
        }

        const { height } = gameAreaDimensions.current;
        const spawnY = -size - 20;
        
        // For multi-bubble spawns, spread them horizontally
        const xPosition = shouldSpawnMultiple 
          ? Math.random() * 70 + 15 + (i * 20)
          : Math.random() * 80 + 10;
        
        newBubbles.push({
          id: Date.now() + Math.random() + i,
          x: xPosition,
          y: spawnY,
          size,
          colorFrom,
          colorTo,
          points,
          type: bubbleType,
        });
      }
      
      setBubbles((prev) => [...prev, ...newBubbles]);
      
      // Schedule next spawn with recalculated rate (smooth curve)
      const nextCalculatedRate = calculateSpawnRate(gameElapsedTime, totalDuration, baseSpawnRate);
      const nextRate = currentSpawnRate > 0 ? currentSpawnRate : nextCalculatedRate;
      intervalId = setTimeout(spawnBubble, nextRate);
    };

    // Start spawning
    const initialRate = currentSpawnRate > 0 ? currentSpawnRate : baseSpawnRate;
    intervalId = setTimeout(spawnBubble, initialRate);

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [gameStarted, gameOver, gameWon, difficulty, showTutorial, currentSpawnRate, gameElapsedTime]);

  // Bubble movement using requestAnimationFrame - capped at 60 FPS
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let lastLogicTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS; // ~16.67ms per frame

    const animate = (currentTime: number) => {
      // Cap logic to 60 FPS - only run game logic if enough time has passed
      const timeSinceLastLogic = currentTime - lastLogicTime;
      
      if (timeSinceLastLogic >= frameInterval) {
        const deltaTime = timeSinceLastLogic;
        lastLogicTime = currentTime;
        
        // Calculate movement based on delta time (normalize to 60fps)
        const frameMultiplier = deltaTime / frameInterval; // Normalize to target FPS
        const { height } = gameAreaDimensions.current;
        // Convert percentage-based speed to pixels: speed was designed for 0-100 range, now using 0-height pixels
        const speedInPixels = ((powerUpActive.type === 'slow' ? fallSpeed * 0.3 : fallSpeed) * (height / 100)) * frameMultiplier;
      
      setBubbles((prev) => {
        const { height } = gameAreaDimensions.current;
        // Avoid important actions in bottom 9% of screen (8-10% range)
        const bottomExclusionZone = height * 0.09;
        const playableBottom = height - bottomExclusionZone;
        
        // First, move all bubbles (speedInPixels is in pixels per frame)
        const moved = prev
          .filter((b) => !b.popped)
          .map((b) => ({ ...b, y: b.y + speedInPixels }));

        // Warning zone: bubbles within 15% of bottom (warning sound)
        const warningZone = height * 0.15;
        const bubblesNearBottom = moved.filter((b) => {
          const isNormalOrGolden = b.type === 'normal' || b.type === 'golden' || !b.type;
          return isNormalOrGolden && b.y > playableBottom - warningZone && b.y <= playableBottom;
        });

        // Play warning sound if bubbles are near bottom (throttled to once per second)
        if (bubblesNearBottom.length > 0) {
          const now = Date.now();
          if (now - lastWarningTimeRef.current > 1000) {
            playWarningSound();
            lastWarningTimeRef.current = now;
          }
        }

        // Detect bubbles that fully exited the playable area (before bottom exclusion zone)
        const exitedBubbles = moved.filter((b) => {
          const fullyExited = b.y > playableBottom + b.size;
          const isNormalOrGolden = b.type === 'normal' || b.type === 'golden' || !b.type;
          return fullyExited && isNormalOrGolden;
        });

        if (exitedBubbles.length > 0) {
          // Reset combo when normal/golden bubbles fully exit
          setCombo(0);
          setComboMultiplier(1);
          
          // Small smooth speed increase on missed bubbles (minimal penalty to avoid chaos spikes)
          if (difficulty) {
            const missPenalty = difficultySettings[difficulty].missPenalty * 0.3; // Reduced by 70% for smoothness
            const maxSpeed = difficulty === 'easy' ? 1.2 : difficulty === 'medium' ? 2.5 : 3.5;
            setFallSpeed((prevSpeed) => Math.min(prevSpeed + missPenalty, maxSpeed));
          }
        }

        // Filter out bubbles that have fully exited the playable area (with buffer)
        return moved.filter((b) => b.y < playableBottom + b.size + 10);
      });
      }

      // Always continue animation loop (even if we skipped logic this frame)
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

  // Play game over sound when game ends
  useEffect(() => {
    if (gameOver && !gameWon && gameStarted) {
      playGameOverSound();
    }
  }, [gameOver, gameWon, gameStarted]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Track game elapsed time and update progressive difficulty (smooth curves)
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || showTutorial || !difficulty) return;

    const timeTracker = setInterval(() => {
      setGameElapsedTime((prev) => {
        const newTime = prev + 1;
        const settings = difficultySettings[difficulty];
        const totalDuration = settings.duration;
        
        // Phase 1: Increase spawn rate (smooth curve)
        const newSpawnRate = calculateSpawnRate(newTime, totalDuration, settings.spawnRate);
        setCurrentSpawnRate(newSpawnRate);
        
        // Phase 2: Increase speed (smooth curve, starts after spawn rate phase)
        const maxSpeed = difficulty === 'easy' ? 1.2 : difficulty === 'medium' ? 2.5 : 3.5;
        const newSpeed = calculateSpeed(newTime, totalDuration, settings.fallSpeed, maxSpeed);
        setFallSpeed(newSpeed);
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timeTracker);
  }, [gameStarted, gameOver, gameWon, showTutorial, difficulty]);

  // Progressive difficulty now handled by smooth curves in gameElapsedTime effect
  // Removed linear speed increases to avoid chaos spikes

  // Particle animation and cleanup using requestAnimationFrame - capped at 60 FPS
  // Particles move based on their velocity and are removed after 800ms
  // Velocity is converted from pixels to percentage for responsive positioning
  useEffect(() => {
    let animationFrameId: number;
    let lastLogicTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS; // ~16.67ms per frame

    const animate = (currentTime: number) => {
      // Cap logic to 60 FPS - only run game logic if enough time has passed
      const timeSinceLastLogic = currentTime - lastLogicTime;
      
      if (timeSinceLastLogic >= frameInterval) {
        const deltaTime = timeSinceLastLogic;
        lastLogicTime = currentTime;
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
      }

      // Always continue animation loop (even if we skipped logic this frame)
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
    const { height } = gameAreaDimensions.current;
    // Convert pixel Y to percentage for particle rendering
    const yPercent = (y / height) * 100;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: now + i,
      x, // x is already percentage
      y: yPercent, // Convert pixel Y to percentage
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

    // Play pop sound for all bubble clicks
    playPopSound();

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
      
      const { width } = gameAreaDimensions.current;
      // Distance threshold: 15% of width (responsive)
      const distanceThreshold = width * 0.15;
      
      const nearbyBubbles = prev.filter(b => {
        if (b.id === id || b.popped || b.type === 'bomb') return false;
        // X is percentage, Y is pixels - convert to pixel coordinates
        const x1 = (clickedBubble.x / 100) * width;
        const y1 = clickedBubble.y; // Already in pixels
        const x2 = (b.x / 100) * width;
        const y2 = b.y; // Already in pixels
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
    
    // Play combo sound with increasing pitch
    if (newCombo > combo && newCombo > 1) {
      const comboLevel = Math.min(Math.floor(newCombo / 5), 10); // Cap at level 10
      playComboSound(comboLevel);
    }
    
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
    scoreRef.current = 0;
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
    setCurrentSpawnRate(0); // Reset spawn rate
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
    setCurrentSpawnRate(difficultySettings[level].spawnRate); // Initialize spawn rate
    setGameElapsedTime(0); // Reset elapsed time
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
      className={`h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100 relative ${screenShake ? 'animate-shake' : ''}`}
    style={{
        animation: screenShake ? 'shake 0.3s ease-in-out' : celebration ? 'celebrate 0.6s ease-in-out' : 'none',
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-2px); }
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
            boxShadow: `0 0 4px ${p.color}`, // Reduced glow - background effect only
          }}
        />
      ))}

      {/* Achievement Notifications - Muted for hierarchy */}
      {newAchievements.map((achievement, idx) => (
        <div
          key={`${achievement}-${idx}`}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800/90 text-white font-semibold px-4 py-2 rounded-lg shadow-lg border border-gray-600/50"
            style={{
            animation: `achievementPop 2s ease-out ${idx * 0.2}s forwards`,
              transform: 'translateX(-50%)',
          }}
        >
          {getAchievementText(achievement)}
        </div>
      ))}

      {/* Celebration Confetti - Limited animation */}
      {celebration && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {Array.from({ length: 15 }).map((_, i) => ( // Reduced from 30 to 15
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
          <div className="text-7xl sm:text-9xl mb-4 sm:mb-6" style={commonStyles.dropShadowSmall}>🫧</div>
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
        <div className="flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
          {/* Mobile: Single-row compact HUD - muted for hierarchy */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 mb-1.5 sm:mb-2">
            <div className="bg-gray-50/80 rounded sm:rounded-xl p-1.5 sm:p-3 flex-1 border border-gray-200/40">
              <div className="text-[8px] sm:text-xs text-gray-600 font-semibold mb-0.5 sm:mb-1 uppercase tracking-wide">SCORE</div>
              <div className="text-base sm:text-2xl font-bold text-gray-800 leading-tight">
                {score}
              </div>
            </div>
            <div className="bg-gray-50/80 rounded sm:rounded-xl p-1.5 sm:p-3 flex-1 text-center border border-gray-200/40">
              <div className="text-[8px] sm:text-xs text-gray-600 font-semibold mb-0.5 sm:mb-1 uppercase tracking-wide">TARGET</div>
              <div className="text-base sm:text-2xl font-bold text-gray-800 leading-tight">{WIN_SCORE}</div>
            </div>
            <div className="bg-gray-50/80 rounded sm:rounded-xl p-1.5 sm:p-3 flex-1 text-right border border-gray-200/40">
              <div className="text-[8px] sm:text-xs text-gray-600 font-semibold mb-0.5 sm:mb-1 uppercase tracking-wide">TIME</div>
              <div className={`text-base sm:text-2xl font-bold leading-tight ${timeLeft <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                {timeLeft}s
              </div>
            </div>
            {/* Mobile: Inline combo and power-up */}
            {combo > 0 && (
              <div className={`bg-gray-50/80 rounded px-2 py-1 border border-gray-200/40 ${comboFlash ? 'scale-[1.02]' : ''} transition-transform duration-200 sm:hidden`}>
                <div className="text-[7px] text-gray-600 font-semibold uppercase">COMBO</div>
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {combo}×{comboMultiplier}
                </div>
              </div>
            )}
            {powerUpActive.type && (
              <div className="bg-gray-50/80 rounded px-2 py-1 border border-gray-200/40 sm:hidden">
                <div className="text-[7px] text-gray-600 font-semibold uppercase">
                  {powerUpActive.type === 'slow' ? '⏱️' : '⚡'}
                </div>
                <div className="text-[9px] text-gray-700 font-semibold">
                  {Math.ceil((powerUpActive.expires - Date.now()) / 1000)}s
                </div>
              </div>
            )}
          </div>
          {/* Desktop: Second row for combo and power-up - muted */}
          <div className="hidden sm:flex items-center justify-between gap-2 mb-2">
            {combo > 0 && (
              <div className={`bg-gray-50/80 rounded-lg px-3 py-1.5 border border-gray-200/40 ${comboFlash ? 'scale-[1.02]' : ''} transition-transform duration-200`}>
                <div className="text-[9px] text-gray-600 font-semibold uppercase">COMBO</div>
                <div className="text-lg font-bold text-gray-800 leading-tight">
                  {combo} × {comboMultiplier}
                </div>
              </div>
            )}
            {powerUpActive.type && (
              <div className="bg-gray-50/80 rounded-lg px-3 py-1.5 border border-gray-200/40">
                <div className="text-[9px] text-gray-600 font-semibold uppercase">
                  {powerUpActive.type === 'slow' ? '⏱️ SLOW-MO' : '⚡ DOUBLE'}
                </div>
                <div className="text-xs text-gray-700 font-semibold">
                  {Math.ceil((powerUpActive.expires - Date.now()) / 1000)}s
                </div>
              </div>
            )}
            <div className="flex-1"></div>
          </div>
          <div className="h-1.5 sm:h-2.5 bg-gray-200/60 rounded-full overflow-hidden border border-gray-300/40">
            <div
              className="h-full bg-gray-600 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min((score / WIN_SCORE) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div ref={gameAreaRef} className="flex-1 relative overflow-hidden min-h-0" style={{ minHeight: '70vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
              // Reduced glow intensity - bubbles are main actor, keep them prominent but not overwhelming
              if (bubble.type === 'golden') return `0 0 8px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.2)`;
              if (bubble.type === 'bomb') return `0 0 8px rgba(239,68,68,0.3), 0 4px 12px rgba(0,0,0,0.25)`;
              if (bubble.type === 'slow') return `0 0 8px rgba(59,130,246,0.3), 0 4px 12px rgba(0,0,0,0.15)`;
              if (bubble.type === 'double') return `0 0 8px rgba(139,92,246,0.3), 0 4px 12px rgba(0,0,0,0.15)`;
              return `0 3px 10px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.15)`;
            };
            
            return (
              <button
                key={bubble.id}
                onClick={() => handleBubbleClick(bubble.id, bubble.x, bubble.y, bubble.colorFrom, bubble.colorTo, bubble.points, bubble.type)}
                className="absolute rounded-full cursor-pointer touch-manipulation active:scale-90 transition-transform duration-150"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}px`, // Y is now in pixels
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  background: `linear-gradient(135deg, ${bubble.colorFrom}, ${bubble.colorTo})`,
                  animation: isSpecial ? 'float 3s ease-in-out infinite' : 'float 4s ease-in-out infinite', // Slower, less distracting
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: `${getSpecialShadow()}, inset 0 -1px 2px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.1)`, // Minimal shadow for hierarchy
                }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
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
        <div 
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-100/98 via-pink-100/98 to-purple-100/98 p-4 sm:p-6 backdrop-blur-md" 
          style={{ ...commonStyles.scaleIn, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="text-6xl sm:text-8xl mb-4 sm:mb-6" style={commonStyles.dropShadowYellow}>🎉</div>
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
        <div 
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-gray-200/98 via-slate-200/98 to-gray-300/98 p-4 sm:p-6 backdrop-blur-md" 
          style={{ ...commonStyles.scaleIn, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
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