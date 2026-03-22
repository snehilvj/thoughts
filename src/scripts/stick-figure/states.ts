import type { Skeleton } from './skeleton';
import { applyRestPose, HEAD_RADIUS } from './skeleton';
import type { ZzzParticle } from './renderer';

export type FigureState =
  | 'idle'
  | 'waving'
  | 'jumping'
  | 'dancing'
  | 'sitting'
  | 'surprised'
  | 'sleeping'
  | 'shielding'; // eyes shielded (theme toggle)

export interface StateController {
  current: FigureState;
  stateTime: number;
  zzzParticles: ZzzParticle[];
  transition(newState: FigureState): void;
  update(skeleton: Skeleton, dt: number, baseX: number, baseY: number): void;
}

export function createStateController(): StateController {
  const controller: StateController = {
    current: 'idle',
    stateTime: 0,
    zzzParticles: [],

    transition(newState: FigureState) {
      if (this.current === newState) return;
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
        case 'jumping':
          updateJumping(skeleton, this, baseX, baseY);
          break;
        case 'dancing':
          updateDancing(skeleton, this, baseX, baseY);
          break;
        case 'sitting':
          updateSitting(skeleton, this, baseX, baseY);
          break;
        case 'surprised':
          updateSurprised(skeleton, this, baseX, baseY);
          break;
        case 'sleeping':
          updateSleeping(skeleton, this, baseX, baseY);
          break;
        case 'shielding':
          updateShielding(skeleton, this, baseX, baseY);
          break;
      }
    },
  };

  return controller;
}

// --- Idle: gentle breathing ---
function updateIdle(skeleton: Skeleton, time: number, baseX: number, baseY: number): void {
  applyRestPose(skeleton, baseX, baseY);
  const breath = Math.sin(time * 2) * 2;
  skeleton.head.targetY += breath;
  skeleton.neck.targetY += breath * 0.5;
  skeleton.leftShoulder.targetY += breath * 0.3;
  skeleton.rightShoulder.targetY += breath * 0.3;

  skeleton.mouthSmile = 0.3;
  skeleton.eyeOpenness = 1;
  skeleton.mouthOpen = 0;
}

// --- Waving: right arm up, oscillating ---
function updateWaving(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  applyRestPose(skeleton, baseX, baseY);
  const breath = Math.sin(ctrl.stateTime * 2) * 2;
  skeleton.head.targetY += breath;
  skeleton.neck.targetY += breath * 0.3;

  const t = ctrl.stateTime;

  // Raise right arm and wave
  skeleton.rightShoulder.targetY -= 4;
  skeleton.rightElbow.targetX = baseX + 20;
  skeleton.rightElbow.targetY = skeleton.neck.targetY - 16;
  skeleton.rightHand.targetX = baseX + 26 + Math.sin(t * 12) * 10;
  skeleton.rightHand.targetY = skeleton.neck.targetY - 28 + Math.cos(t * 12) * 4;

  skeleton.mouthSmile = 0.9;
  skeleton.eyeOpenness = 1;
  skeleton.mouthOpen = 0;

  if (ctrl.stateTime > 1.8) {
    ctrl.transition('idle');
  }
}

// --- Jumping: whole body moves up then down with bounce ---
function updateJumping(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  const t = ctrl.stateTime;
  // Parabolic jump curve: up for 0.3s, down for 0.3s
  let jumpOffset = 0;
  if (t < 0.15) {
    // Crouch
    jumpOffset = t / 0.15 * 6;
  } else if (t < 0.5) {
    // Airborne
    const airT = (t - 0.15) / 0.35;
    jumpOffset = -30 * Math.sin(airT * Math.PI);
  } else if (t < 0.7) {
    // Landing squash
    const landT = (t - 0.5) / 0.2;
    jumpOffset = Math.sin(landT * Math.PI) * 4;
  }

  applyRestPose(skeleton, baseX, baseY + jumpOffset);

  // Arms go up during jump
  if (t > 0.15 && t < 0.5) {
    skeleton.leftElbow.targetY -= 20;
    skeleton.leftHand.targetY -= 30;
    skeleton.rightElbow.targetY -= 20;
    skeleton.rightHand.targetY -= 30;
    skeleton.leftElbow.targetX -= 5;
    skeleton.rightElbow.targetX += 5;
    skeleton.leftHand.targetX -= 8;
    skeleton.rightHand.targetX += 8;
  }

  skeleton.mouthSmile = 0.8;
  skeleton.eyeOpenness = 1.1;
  skeleton.mouthOpen = t > 0.15 && t < 0.5 ? 0.6 : 0;

  if (ctrl.stateTime > 0.8) {
    ctrl.transition('idle');
  }
}

// --- Dancing: rhythmic arm/leg movement ---
function updateDancing(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  applyRestPose(skeleton, baseX, baseY);
  const t = ctrl.stateTime;
  const beat = Math.sin(t * 8);
  const beat2 = Math.cos(t * 8);

  // Body bobs
  const bob = Math.abs(beat) * 4;
  skeleton.hip.targetY -= bob;
  skeleton.neck.targetY -= bob;
  skeleton.head.targetY -= bob;

  // Arms swing opposite
  skeleton.leftElbow.targetX -= 8 + beat * 10;
  skeleton.leftElbow.targetY -= 10 + beat * 8;
  skeleton.leftHand.targetX -= 10 + beat * 14;
  skeleton.leftHand.targetY -= 16 + beat * 10;

  skeleton.rightElbow.targetX += 8 + beat2 * 10;
  skeleton.rightElbow.targetY -= 10 + beat2 * 8;
  skeleton.rightHand.targetX += 10 + beat2 * 14;
  skeleton.rightHand.targetY -= 16 + beat2 * 10;

  // Legs shift
  skeleton.leftKnee.targetX += beat * 4;
  skeleton.rightKnee.targetX += beat2 * 4;

  // Head tilts with rhythm
  skeleton.head.targetX += beat * 3;

  skeleton.mouthSmile = 0.7;
  skeleton.eyeOpenness = 0.9;
  skeleton.mouthOpen = 0;

  // Dancing continues as long as typing continues (reset by interaction handler)
  // Auto-stop after 3s if no new keypress
  if (ctrl.stateTime > 3) {
    ctrl.transition('idle');
  }
}

// --- Sitting: legs bend, body lowers ---
function updateSitting(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  applyRestPose(skeleton, baseX, baseY);
  const sitAmount = Math.min(ctrl.stateTime * 4, 1); // Ease into sit over 0.25s

  // Lower body
  const drop = sitAmount * 18;
  skeleton.hip.targetY += drop;
  skeleton.neck.targetY += drop;
  skeleton.head.targetY += drop;
  skeleton.leftShoulder.targetY += drop;
  skeleton.rightShoulder.targetY += drop;
  skeleton.leftElbow.targetY += drop;
  skeleton.rightElbow.targetY += drop;
  skeleton.leftHand.targetY += drop;
  skeleton.rightHand.targetY += drop;

  // Knees come forward
  skeleton.leftKnee.targetX -= sitAmount * 10;
  skeleton.leftKnee.targetY -= sitAmount * 4;
  skeleton.rightKnee.targetX += sitAmount * 10;
  skeleton.rightKnee.targetY -= sitAmount * 4;

  // Feet flat out
  skeleton.leftFoot.targetX -= sitAmount * 16;
  skeleton.rightFoot.targetX += sitAmount * 16;

  // Hands rest on knees
  skeleton.leftHand.targetX = skeleton.leftKnee.targetX;
  skeleton.leftHand.targetY = skeleton.leftKnee.targetY - 2;
  skeleton.rightHand.targetX = skeleton.rightKnee.targetX;
  skeleton.rightHand.targetY = skeleton.rightKnee.targetY - 2;

  skeleton.mouthSmile = 0.15;
  skeleton.eyeOpenness = 0.8;
  skeleton.mouthOpen = 0;

  // Sit for 4 seconds then idle
  if (ctrl.stateTime > 4) {
    ctrl.transition('idle');
  }
}

// --- Surprised: eyes wide, O mouth, small hop ---
function updateSurprised(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  const t = ctrl.stateTime;
  const hop = t < 0.3 ? -8 * Math.sin((t / 0.3) * Math.PI) : 0;

  applyRestPose(skeleton, baseX, baseY + hop);

  // Arms out in surprise
  skeleton.leftElbow.targetX -= 10;
  skeleton.leftElbow.targetY -= 8;
  skeleton.leftHand.targetX -= 16;
  skeleton.leftHand.targetY -= 14;
  skeleton.rightElbow.targetX += 10;
  skeleton.rightElbow.targetY -= 8;
  skeleton.rightHand.targetX += 16;
  skeleton.rightHand.targetY -= 14;

  skeleton.mouthSmile = 0;
  skeleton.eyeOpenness = 1.3;
  skeleton.mouthOpen = 0.8;

  if (ctrl.stateTime > 1.2) {
    ctrl.transition('idle');
  }
}

// --- Sleeping: head droops, eyes closed, zzz ---
function updateSleeping(
  skeleton: Skeleton,
  ctrl: StateController,
  baseX: number,
  baseY: number,
): void {
  applyRestPose(skeleton, baseX, baseY);

  // Head droops
  skeleton.head.targetY += 7;
  skeleton.head.targetX += 4;
  skeleton.neck.targetY += 3;

  // Arms hang limp
  skeleton.leftHand.targetY += 8;
  skeleton.leftElbow.targetY += 4;
  skeleton.rightHand.targetY += 8;
  skeleton.rightElbow.targetY += 4;

  skeleton.eyeOpenness = 0;
  skeleton.mouthSmile = 0;
  skeleton.mouthOpen = 0;

  // Spawn zzz particles
  const interval = 1.2;
  const mod = ctrl.stateTime % interval;
  if (mod < 0.06 && ctrl.stateTime > 0.15) {
    const chars = ['z', 'Z', 'z'];
    ctrl.zzzParticles.push({
      x: skeleton.head.x + HEAD_RADIUS,
      y: skeleton.head.y - HEAD_RADIUS,
      opacity: 1,
      char: chars[Math.floor(Math.random() * chars.length)],
      vx: 0.3 + Math.random() * 0.4,
      vy: -0.7 - Math.random() * 0.4,
    });
  }

  for (const p of ctrl.zzzParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.opacity -= 0.01;
  }
  ctrl.zzzParticles = ctrl.zzzParticles.filter((p) => p.opacity > 0);
}

// --- Shielding: arm over eyes (theme toggle reaction) ---
function updateShielding(skeleton: Skeleton, ctrl: StateController, baseX: number, baseY: number): void {
  applyRestPose(skeleton, baseX, baseY);
  const breath = Math.sin(ctrl.stateTime * 2) * 1;
  skeleton.head.targetY += breath;

  // Left arm shields eyes
  skeleton.leftElbow.targetX = baseX - 6;
  skeleton.leftElbow.targetY = skeleton.head.targetY - 2;
  skeleton.leftHand.targetX = baseX + 8;
  skeleton.leftHand.targetY = skeleton.head.targetY - 4;

  skeleton.eyeOpenness = 0.2;
  skeleton.mouthSmile = -0.2;
  skeleton.mouthOpen = 0;

  if (ctrl.stateTime > 1.5) {
    // Blink and recover
    skeleton.eyeOpenness = ctrl.stateTime < 1.7 ? 0 : 1;
    if (ctrl.stateTime > 2) {
      ctrl.transition('idle');
    }
  }
}
