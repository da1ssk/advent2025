# Day 02: Building a Golf Swing Simulator with TypeScript

🌐 [日本語](./README.md)

Advent Calendar 2025 - Day 2 article.

## Overview

I created a web app that physically simulates a golf swing using TypeScript. It uses a double pendulum model (2 degrees of freedom: shoulder and wrist) and simulates swing motion through torque control. It handles ball impact, distance calculation, and trajectory visualization.

https://github.com/user-attachments/assets/d3fd6002-2208-4287-b4e5-d09c3cef978c

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Canvas API** - Swing animation and trajectory rendering
- **Lagrangian Mechanics** - Double pendulum equations of motion
- **Runge-Kutta Method (RK4)** - Physics simulation via numerical integration
- **HTML/CSS** - Modern dark theme UI

## Tools Used

- **Cursor + Claude Opus 4.5** - Code generation, debugging & optimization
- **Vercel** - Deployment & hosting

## Directory Structure

```
02/
├── index.html      # Main HTML
├── style.css       # Stylesheet
├── main.ts         # TypeScript source
├── dist/           # Compiled JS
├── package.json
└── tsconfig.json
```

## Setup

```bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Start local server
npx serve
# or
python3 -m http.server 8080
```

## Key Features

1. **2-DOF Swing Model** - Physical simulation of shoulder and wrist joints
2. **Torque Control** - Adjustable torque strength and timing for shoulder and wrist
3. **Ball Impact Detection** - Detects the moment club head hits the ball
4. **Distance Calculation** - Trajectory calculation with air resistance (carry + run)
5. **Trajectory Visualization** - Real-time display of ball flight path
6. **Optimization** - Two-phase optimization (random search + hill climbing) finds optimal parameters
7. **Phase Slider** - Review any moment of the swing

## Physics Model

### Double Pendulum

- **L1 (Arm)**: 0.55m, 4.5kg
- **L2 (Club)**: 0.95m, 0.35kg (7-iron equivalent)
- **Coefficient of Restitution (COR)**: 0.78
- **Loft Angle**: 34°

### Swing Parameters

- **Shoulder Torque**: 30-150 Nm
- **Wrist Torque**: -50 to 80 Nm (negative maintains lag)
- **Initial State**: Arm -120°, Wrist cock 45°

## Code Highlights

### Equations of Motion (Lagrangian)

```typescript
static computeAccelerations(
  theta1: number, omega1: number,
  theta2: number, omega2: number,
  tau1: number, tau2: number
): [number, number] {
  // Lagrangian equations of motion for double pendulum
  // Calculate angular acceleration from mass matrix and force vector
}
```

### Runge-Kutta Integration

```typescript
static rk4Step(state: State, tau1: number, tau2: number): State {
  // Update state using 4th-order Runge-Kutta method
  // More accurate numerical integration
}
```

### Trajectory Calculation

```typescript
calculateBallTrajectory(impactVx, impactVy, shaftLean) {
  // Calculate launch angle from attack angle and dynamic loft
  // Projectile motion with air resistance
  // Also calculates run (roll) after landing
}
```

## Deployment

Deployed using Vercel.

```bash
# Deploy with Vercel CLI
npx vercel --prod
```

## Notes

- Uses ES modules, so it won't work with the `file://` protocol
- Please access via a local server
- Optimization is computationally intensive and may take a few seconds to complete

## References

- [Double Pendulum - Wikipedia](https://en.wikipedia.org/wiki/Double_pendulum)
- [Golf Ball Flight Physics](https://www.golfdigest.com/story/the-physics-of-a-golf-swing)
- [TypeScript Official Documentation](https://www.typescriptlang.org/docs/)

## License

MIT

---

Created by @da1ssk, 2025

