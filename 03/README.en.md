# Day 03: Building an 8-bit Grooves Maker with TypeScript

🌐 [日本語](./README.md)

Advent Calendar 2025 - Day 3 article.

## Overview

I created a step sequencer for creating retro game-style 8-bit music using TypeScript and the Web Audio API. It uses square waves for chiptune-style sound and allows you to create, edit, and save monophonic melodies. Features the Super Mario Bros. theme by default.

https://advent2025-day03-grooves.vercel.app/

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Web Audio API** - 8-bit sound generation with square waves
- **CSS Grid** - Responsive step sequencer UI
- **localStorage** - Pattern saving and management
- **HTML/CSS** - Retro game-inspired dark theme UI

## Tools Used

- **Cursor + Claude Sonnet 4.5** - Code generation, debugging & feature development
- **Vercel** - Deployment & hosting (planned)

## Directory Structure

```
03/
├── index.html      # Main HTML
├── style.css       # Stylesheet
├── script.ts       # TypeScript source
├── dist/           # Compiled JS
├── package.json
└── tsconfig.json
```

## Setup

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Start local server
npx serve
# or
python3 -m http.server 8080
```

## Key Features

1. **Step Sequencer** - 80-step grid based on 8th notes
2. **3-State Toggle** - Staccato (short) / Legato (sustained) / OFF
3. **Monophonic** - Only one note per step
4. **Auto-Scroll** - Playback position always centered on screen
5. **Pattern Save/Load** - Save and manage multiple named patterns
6. **Default Pattern** - Pre-loaded Super Mario Bros. theme
7. **Real-time Editing** - Click to place and edit notes

## Note Types

- **Staccato (Orange with black border)** - Short note (50% of 8th note duration)
- **Legato (Blue)** - Sustained note that holds until the next note

## Note Range

Chromatic scale from B5 to C4 (24 notes):
- B5, A#5, A5, G#5, G5, F#5, F5, E5
- D#5, D5, C#5, C5
- B4, A#4, A4, G#4, G4, F#4, F4, E4
- D#4, D4, C#4, C4

## Code Highlights

### Square Wave Generation with Web Audio API

```typescript
private playPulse(frequency: number, duration: number): void {
  const oscillator = this.audioContext.createOscillator()
  const gainNode = this.audioContext.createGain()

  oscillator.type = "square" // Square wave for retro sound
  oscillator.frequency.setValueAtTime(frequency, time)

  // Envelope (Attack + Decay)
  gainNode.gain.setValueAtTime(0.0, time)
  gainNode.gain.linearRampToValueAtTime(0.3, time + 0.005)
  gainNode.gain.linearRampToValueAtTime(0.0, time + duration)

  oscillator.connect(gainNode)
  gainNode.connect(this.audioContext.destination)
  oscillator.start(time)
  oscillator.stop(time + duration)
}
```

### Precise Timing Control

Metronome-like accurate timing using a scheduler pattern:

```typescript
private scheduler(): void {
  const lookahead: number = 0.1 // Schedule 100ms ahead
  const stepDuration: number = 60 / bpm / 2 // 8th note duration

  while (this.nextStepTime < this.audioContext.currentTime + lookahead) {
    this.playStep(this.currentStep)
    this.nextStepTime += stepDuration
    this.currentStep++

    // Loop back after last note
    if (this.currentStep > this.getLastNoteStep()) {
      this.currentStep = 0
    }
  }
}
```

### 3-State Toggle

```typescript
private toggleNote(e: MouseEvent): void {
  const currentState = this.sequence[noteIndex][stepIndex]

  // 0 (OFF) -> 1 (Staccato) -> 2 (Continuous) -> 0
  if (currentState === 0) {
    this.sequence[noteIndex][stepIndex] = 1 // Staccato
  } else if (currentState === 1) {
    this.sequence[noteIndex][stepIndex] = 2 // Continuous
  } else {
    this.sequence[noteIndex][stepIndex] = 0 // OFF
  }
}
```

### Named Pattern Saving

```typescript
private handleSave(): void {
  const name = prompt("Enter pattern name:")
  const saves = this.getSavedPatterns()

  saves[name] = {
    name: name,
    sequence: this.sequence,
    bpm: this.bpmInput.value,
    timestamp: new Date().toISOString()
  }

  localStorage.setItem("sequencer-saves", JSON.stringify(saves))
}
```

## How to Use

1. **Place Notes**: Click cells to cycle OFF → Staccato → Legato → OFF
2. **Playback**: Use "Play/Stop" button to start/stop playback
3. **Adjust Tempo**: Change BPM value (60-300)
4. **Save**: Click "Save" button to save current pattern with a name
5. **Load**: Click a pattern from the saved list to load it
6. **Clear**: Remove all notes
7. **Reset to Default**: Reload the Super Mario Bros. theme

## Deployment

Planned deployment using Vercel.

```bash
# Deploy with Vercel CLI
npx vercel --prod
```

## Notes

- Uses ES modules, so it won't work with the `file://` protocol
- Please access via a local server
- Web Audio API context activates on first user click

## References

- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Square Wave Synthesis](https://en.wikipedia.org/wiki/Square_wave)
- [TypeScript Official Documentation](https://www.typescriptlang.org/docs/)

## License

MIT

---

Created by @da1ssk, 2025
