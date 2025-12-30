# Bubble Pop Game - Component Documentation

## Overview

A mobile-first, React-based bubble-popping game built with TypeScript and Tailwind CSS. The game features progressive difficulty, smooth animations, sound design, and optimized performance for mobile devices.

## Features

### Core Gameplay
- **Bubble Popping**: Click/tap bubbles to pop them and earn points
- **Combo System**: Build combos by popping bubbles quickly (within 2 seconds)
- **Chain Reactions**: Pop nearby bubbles together for bonus points
- **Special Bubbles**:
  - ⭐ **Golden Bubbles**: Worth 100 points + boost combo by +3
  - 💣 **Bomb Bubbles**: Reset combo and deduct 50 points
  - ⏱️ **Slow-Mo Power-up**: Reduces bubble speed by 70% for 5 seconds
  - ⚡ **Double Points Power-up**: Doubles combo multiplier for 5 seconds

### Difficulty Levels
- **Easy**: 45s, target 300 points, slower speed (0.4-1.2)
- **Medium**: 35s, target 500 points, moderate speed (1.4-2.5)
- **Hard**: 30s, target 800 points, fast speed (1.9-3.5)

### Progressive Difficulty System
- **Phase 1 (0-40% of game)**: Spawn rate increases (more bubbles)
- **Phase 2 (40-80% of game)**: Speed increases smoothly
- **Phase 3 (80-100% of game)**: Multi-bubble patterns (2-3 bubbles at once)
- Uses smooth easeInOutCubic curves (no sudden jumps)

### Sound Design
- **Pop Sound**: Plays on every bubble click
- **Combo Sound**: Increasing pitch based on combo level
- **Warning Sound**: Low tone when bubbles near bottom (throttled to 1/second)
- **Game Over Sound**: Descending somber tones
- All sounds are low-volume (8-15%) and non-intrusive

### Visual Features
- **Achievement System**: Unlocks for milestones (combo 10/20/30, pops 50/100, etc.)
- **Particle Effects**: Visual feedback on bubble pops
- **Screen Shake**: For bomb bubbles and large chain reactions
- **Celebration Effects**: Confetti on game win
- **Tutorial Overlay**: Gameplay tips before starting

## Technical Implementation

### Performance Optimizations
- **60 FPS Cap**: Game logic capped at 60 FPS for consistent performance
- **requestAnimationFrame**: Smooth animations synced with browser refresh
- **Pixel-based Positioning**: Bubbles use pixel-based Y coordinates for accuracy
- **Memoized Values**: Achievement texts memoized to prevent recreation
- **Ref-based State**: Score ref for spawn logic to avoid interval restarts

### Mobile-First Design
- **Safe Area Support**: Respects device notches/home indicators
- **Bottom Exclusion Zone**: 9% bottom area avoided for important actions
- **70vh Playable Area**: Minimum 70% viewport height on mobile
- **Compact HUD**: Single-row layout on mobile (< 420px width)
- **Touch Optimized**: Large tap targets, no hover dependencies

### Code Structure

#### State Management
```typescript
// Game state
- score, gameOver, gameWon, gameStarted
- difficulty, timeLeft, bubbles, particles

// Game mechanics
- combo, maxCombo, comboMultiplier
- powerUpActive, fallSpeed, currentSpawnRate
- achievements, chainReaction, totalPops

// UI state
- showTutorial, screenShake, celebration
- comboFlash, newAchievements
```

#### Helper Functions
- `applyComboLogic()`: Calculates combo based on timing and bubble type
- `applyPowerUp()`: Handles power-up activation
- `calculateScore()`: Computes final score with multipliers and bonuses
- `createParticles()`: Generates particle effects
- `getAchievementText()`: Returns achievement text (memoized)

#### Progressive Difficulty Functions
- `easeInOutCubic()`: Smooth curve function
- `calculateSpawnRate()`: Phase 1 - increases spawn frequency
- `calculateSpeed()`: Phase 2 - increases bubble speed
- `calculateMultiBubbleChance()`: Phase 3 - multi-bubble patterns

#### Sound Functions
- `playPopSound()`: Short pop on bubble click
- `playComboSound()`: Pitch increases with combo level
- `playWarningSound()`: Low tone for bubbles near bottom
- `playGameOverSound()`: Descending tones on game end

### Animation Loops

#### Bubble Movement (60 FPS capped)
- Uses `requestAnimationFrame` with frame interval limiting
- Pixel-based Y positioning for accurate movement
- Detects bubbles exiting playable area
- Triggers warning sounds and miss penalties

#### Particle Animation (60 FPS capped)
- Particle cleanup and movement
- Converts pixel velocity to percentage for responsive display
- 800ms particle lifetime

### Spawn System
- Dynamic spawn rate based on game progress (smooth curve)
- Multi-bubble spawns in final 20% of game (2-3 bubbles)
- Power-ups delayed until score ≥ 10
- Special bubble probabilities:
  - Golden: 5%
  - Bomb: 3%
  - Power-ups: 2% each (after score 10)

## Game Mechanics

### Scoring
- Base points: 10-40 (based on bubble color)
- Combo multiplier: 1x-5x (increases every 5 combo)
- Power-up multiplier: 2x when double points active
- Chain bonus: +5 points per chained bubble
- Golden bubbles: Fixed 100 points (not affected by multipliers)
- Time bonus: +10 points per second remaining on win

### Combo System
- Combo increases if bubbles popped within 2 seconds
- Golden bubbles add +3 to combo
- Chain reactions add their count to combo
- Combo resets if:
  - No pop for 2 seconds
  - Bomb bubble is clicked
  - Normal/golden bubble exits screen

### Speed System
- Base speed: Difficulty-specific (0.4-1.9)
- Progressive increase: Smooth curve over game duration
- Miss penalty: Small increase when bubbles exit (70% reduced)
- Max speed caps: Easy (1.2), Medium (2.5), Hard (3.5)
- Slow-mo power-up: Reduces speed by 70%

### Chain Reactions
- Detects bubbles within 15% of clicked bubble
- Requires at least 2 nearby bubbles to trigger
- All nearby bubbles pop simultaneously
- Adds chain count to combo
- Screen shake for chains of 3+

## File Structure

```
index.tsx
├── HomeView Component (wrapper)
└── GameSandbox Component (main game)
    ├── State Management (30+ state variables)
    ├── Difficulty Settings
    ├── Helper Functions
    │   ├── applyComboLogic()
    │   ├── applyPowerUp()
    │   ├── calculateScore()
    │   └── createParticles()
    ├── Progressive Difficulty Functions
    ├── Sound Functions
    ├── Event Handlers
    │   ├── handleBubbleClick()
    │   ├── handleDifficultySelect()
    │   ├── handleStartGame()
    │   └── handleRestart()
    └── useEffect Hooks
        ├── Dimension Measurement
        ├── Bubble Spawning
        ├── Bubble Movement (60 FPS)
        ├── Particle Animation (60 FPS)
        ├── Timer & Difficulty Progression
        └── Achievement Tracking
```

## Performance Characteristics

- **Frame Rate**: Capped at 60 FPS for game logic
- **Animation**: Uses requestAnimationFrame for smooth rendering
- **Memory**: Particles auto-cleanup after 800ms
- **CPU**: Logic only runs when needed (frame interval limiting)
- **Mobile**: Optimized for devices under 420px width

## Browser Compatibility

- Modern browsers with Web Audio API support
- requestAnimationFrame support required
- CSS Grid and Flexbox support
- Tailwind CSS required

## Customization

### Adjusting Difficulty
Modify `difficultySettings` object:
```typescript
{
  duration: number,      // Game time in seconds
  spawnRate: number,    // Initial spawn interval (ms)
  target: number,       // Target score to win
  fallSpeed: number,     // Base bubble speed
  speedRamp: number,    // Speed increase rate (unused - now uses curves)
  missPenalty: number   // Speed penalty on miss
}
```

### Adjusting Sound Volume
Modify volume parameters in sound functions:
```typescript
playTone(frequency, duration, volume, type)
// Default volumes: 0.08-0.15 (8-15%)
```

### Adjusting Visual Effects
- Glow intensity: Modify `getSpecialShadow()` function
- Particle count: Modify `createParticles()` calls
- Animation speeds: Modify keyframe durations

## Known Limitations

- Power-ups require score ≥ 10 to spawn
- Multi-bubble patterns only in final 20% of game
- Warning sound throttled to 1/second
- Audio context requires user interaction to initialize (browser security)

## Future Enhancements

Potential improvements:
- High score persistence (localStorage)
- More power-up types
- Additional achievement types
- Custom difficulty settings
- Sound on/off toggle
- Pause functionality

## License

Part of the Scrolly No-Code Game Jam entry.

