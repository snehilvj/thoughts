import type { Skeleton } from './skeleton';
import { setBasePosition } from './skeleton';

export type FigureState = 'idle' | 'waving' | 'sleeping';

export interface StateController {
  current: FigureState;
  stateTime: number;
  zzzParticles: ZzzParticle[];
  transition(newState: FigureState): void;
  update(skeleton: Skeleton, dt: number, baseX: number, baseY: number): void;
}

interface ZzzParticle {
  x: number;
  y: number;
  opacity: number;
  char: string;
  vx: number;
  vy: number;
}

export function createStateController(): StateController {
  const controller: StateController = {
    current: 'idle',
    stateTime: 0,
    zzzParticles: [],

    transition(newState: FigureState) {
      this.current = newState;
      this.stateTime = 0;
      if (newState !== 'sleeping') {
        this.zzzParticles = [];
      }
    },

    update(skeleton: Skeleton, dt: number, baseX: number, baseY: number) {
      this.stateTime += dt;

      switch (this.current) {
        case 'idle':
          updateIdle(skeleton, this.stateTime, baseX, baseY);
          break;
        case 'waving':
          updateWaving(skeleton, this, baseX, baseY);
          break;
        case 'sleeping':
          updateSleeping(skeleton, this, baseX, baseY);
          break;
      }
    },
  };

  return controller;
}

function updateIdle(skeleton: Skeleton, time: number, baseX: number, baseY: number): void {
  // Breathing: subtle head bob
  const breathOffset = Math.sin(time * 2) * 1.5;
  setBasePosition(skeleton, baseX, baseY);
  skeleton.head.targetY += breathOffset;
  skeleton.neck.targetY += breathOffset * 0.5;

  skeleton.mouthSmile = 0.3;
  skeleton.eyeOpenness = 1;
}

function updateWaving(skeleton: Skeleton, controller: StateController, baseX: number, baseY: number): void {
  setBasePosition(skeleton, baseX, baseY);

  // Breathing continues
  const breathOffset = Math.sin(controller.stateTime * 2) * 1.5;
  skeleton.head.targetY += breathOffset;
  skeleton.neck.targetY += breathOffset * 0.5;

  // Wave the right arm
  const waveProgress = controller.stateTime;
  const waveAngle = Math.sin(waveProgress * 10) * 0.5;

  // Raise right arm up and wave
  skeleton.rightElbow.targetX = baseX + 12;
  skeleton.rightElbow.targetY = skeleton.neck.targetY - 10;
  skeleton.rightHand.targetX = baseX + 18 + Math.sin(waveProgress * 10) * 8;
  skeleton.rightHand.targetY = skeleton.neck.targetY - 18 + waveAngle * 3;

  skeleton.mouthSmile = 0.8; // Big smile while waving

  // Return to idle after ~1.5 seconds
  if (controller.stateTime > 1.5) {
    controller.transition('idle');
  }
}

function updateSleeping(
  skeleton: Skeleton,
  controller: StateController,
  baseX: number,
  baseY: number,
): void {
  setBasePosition(skeleton, baseX, baseY);

  // Head droops
  skeleton.head.targetY += 5;
  skeleton.head.targetX += 3;
  skeleton.neck.targetY += 2;

  // Arms hang loose
  skeleton.leftHand.targetY += 5;
  skeleton.rightHand.targetY += 5;

  skeleton.eyeOpenness = 0;
  skeleton.mouthSmile = 0;

  // Spawn zzz particles periodically
  const spawnInterval = 1.5;
  const timeMod = controller.stateTime % spawnInterval;
  if (timeMod < 0.05 && controller.stateTime > 0.1) {
    const chars = ['z', 'Z', 'z'];
    controller.zzzParticles.push({
      x: skeleton.head.x + 10,
      y: skeleton.head.y - HEAD_RADIUS_FOR_ZZZ,
      opacity: 1,
      char: chars[Math.floor(Math.random() * chars.length)],
      vx: 0.3 + Math.random() * 0.3,
      vy: -0.8 - Math.random() * 0.3,
    });
  }

  // Update zzz particles
  for (const p of controller.zzzParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.opacity -= 0.008;
  }
  controller.zzzParticles = controller.zzzParticles.filter((p) => p.opacity > 0);
}

const HEAD_RADIUS_FOR_ZZZ = 10;
