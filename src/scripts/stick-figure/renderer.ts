import type { Skeleton } from './skeleton';
import { HEAD_RADIUS } from './skeleton';

export interface ThemeColors {
  stroke: string;
  accent: string;
  bg: string;
}

export interface ZzzParticle {
  x: number;
  y: number;
  opacity: number;
  char: string;
  vx: number;
  vy: number;
}

export function setupCanvas(canvas: HTMLCanvasElement, logicalW: number, logicalH: number): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = logicalW * dpr;
  canvas.height = logicalH * dpr;
  canvas.style.width = `${logicalW}px`;
  canvas.style.height = `${logicalH}px`;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  skeleton: Skeleton,
  colors: ThemeColors,
  zzzParticles: ZzzParticle[],
): void {
  const dpr = window.devicePixelRatio || 1;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.scale(dpr, dpr);

  const s = skeleton;
  const strokeColor = colors.stroke;
  const accentColor = colors.accent;

  // Apply lean rotation around hip
  ctx.save();
  ctx.translate(s.hip.x, s.hip.y);
  ctx.rotate(s.leanAngle);
  ctx.translate(-s.hip.x, -s.hip.y);

  // --- Body ---
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Torso (neck to hip)
  line(ctx, s.neck.x, s.neck.y, s.hip.x, s.hip.y);

  // Left arm: shoulder -> elbow -> hand
  line(ctx, s.leftShoulder.x, s.leftShoulder.y, s.leftElbow.x, s.leftElbow.y);
  line(ctx, s.leftElbow.x, s.leftElbow.y, s.leftHand.x, s.leftHand.y);

  // Right arm: shoulder -> elbow -> hand
  line(ctx, s.rightShoulder.x, s.rightShoulder.y, s.rightElbow.x, s.rightElbow.y);
  line(ctx, s.rightElbow.x, s.rightElbow.y, s.rightHand.x, s.rightHand.y);

  // Shoulder line
  line(ctx, s.leftShoulder.x, s.leftShoulder.y, s.rightShoulder.x, s.rightShoulder.y);

  // Left leg: hip -> knee -> foot
  line(ctx, s.hip.x, s.hip.y, s.leftKnee.x, s.leftKnee.y);
  line(ctx, s.leftKnee.x, s.leftKnee.y, s.leftFoot.x, s.leftFoot.y);

  // Right leg: hip -> knee -> foot
  line(ctx, s.hip.x, s.hip.y, s.rightKnee.x, s.rightKnee.y);
  line(ctx, s.rightKnee.x, s.rightKnee.y, s.rightFoot.x, s.rightFoot.y);

  // Small circles at hands for "roundness"
  ctx.fillStyle = strokeColor;
  dot(ctx, s.leftHand.x, s.leftHand.y, 2.5);
  dot(ctx, s.rightHand.x, s.rightHand.y, 2.5);

  // Small circles at feet
  dot(ctx, s.leftFoot.x, s.leftFoot.y, 3);
  dot(ctx, s.rightFoot.x, s.rightFoot.y, 3);

  // --- Head ---
  // Head fill (matches page bg for a clean look)
  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.arc(s.head.x, s.head.y, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Head outline
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(s.head.x, s.head.y, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // --- Eyes ---
  const eyeSpacing = 5.5;
  const eyeY = s.head.y - 2;
  const leftEyeX = s.head.x - eyeSpacing;
  const rightEyeX = s.head.x + eyeSpacing;

  if (s.eyeOpenness > 0.1) {
    const eyeW = 3.5 * s.eyeOpenness;
    const eyeH = 4 * s.eyeOpenness;

    // Eye shapes (slightly oval)
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // White eye glints
    ctx.fillStyle = colors.bg;
    const pupilMax = 2;
    const px = s.pupilOffsetX * pupilMax;
    const py = s.pupilOffsetY * pupilMax;

    // Inner eye (white area that moves with gaze)
    const innerR = 1.8 * s.eyeOpenness;
    ctx.beginPath();
    ctx.arc(leftEyeX + px * 0.5, eyeY + py * 0.5, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + px * 0.5, eyeY + py * 0.5, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Bright pupil dots (the "glint")
    ctx.fillStyle = strokeColor;
    const dotR = 0.8;
    ctx.beginPath();
    ctx.arc(leftEyeX + px, eyeY + py, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + px, eyeY + py, dotR, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closed eyes — cute horizontal arcs
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, 3, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, 3, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }

  // --- Mouth ---
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  const mouthY = s.head.y + 6;

  if (s.mouthOpen > 0.3) {
    // Surprised O mouth
    ctx.beginPath();
    ctx.ellipse(s.head.x, mouthY, 3 * s.mouthOpen, 4 * s.mouthOpen, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (s.mouthSmile > 0.1) {
    // Smile — wider arc for bigger smile
    const smileWidth = 3 + s.mouthSmile * 2;
    ctx.beginPath();
    ctx.arc(s.head.x, mouthY - 2, smileWidth, 0.3, Math.PI - 0.3);
    ctx.stroke();
  } else if (s.mouthSmile < -0.1) {
    // Frown
    ctx.beginPath();
    ctx.arc(s.head.x, mouthY + 3, 3, Math.PI + 0.3, -0.3);
    ctx.stroke();
  } else {
    // Neutral — small line
    line(ctx, s.head.x - 3, mouthY, s.head.x + 3, mouthY);
  }

  ctx.restore(); // End lean transform

  // --- Zzz particles (outside lean so they float straight) ---
  if (zzzParticles.length > 0) {
    ctx.font = 'bold 12px sans-serif';
    for (const p of zzzParticles) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = accentColor;
      ctx.fillText(p.char, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // End dpr scale
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
