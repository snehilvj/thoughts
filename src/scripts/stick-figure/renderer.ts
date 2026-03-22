import type { Skeleton } from './skeleton';
import { HEAD_RADIUS } from './skeleton';

export interface ThemeColors {
  stroke: string;
  accent: string;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  skeleton: Skeleton,
  colors: ThemeColors,
  zzzParticles: { x: number; y: number; opacity: number; char: string }[],
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.strokeStyle = colors.stroke;
  ctx.fillStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = skeleton;
  const lean = s.leanAngle;

  // Apply lean rotation around hip
  ctx.save();
  ctx.translate(s.hip.x, s.hip.y);
  ctx.rotate(lean);
  ctx.translate(-s.hip.x, -s.hip.y);

  // Body (neck to hip)
  drawLine(ctx, s.neck.x, s.neck.y, s.hip.x, s.hip.y);

  // Left arm
  drawLine(ctx, s.neck.x, s.neck.y, s.leftElbow.x, s.leftElbow.y);
  drawLine(ctx, s.leftElbow.x, s.leftElbow.y, s.leftHand.x, s.leftHand.y);

  // Right arm
  drawLine(ctx, s.neck.x, s.neck.y, s.rightElbow.x, s.rightElbow.y);
  drawLine(ctx, s.rightElbow.x, s.rightElbow.y, s.rightHand.x, s.rightHand.y);

  // Left leg
  drawLine(ctx, s.hip.x, s.hip.y, s.leftKnee.x, s.leftKnee.y);
  drawLine(ctx, s.leftKnee.x, s.leftKnee.y, s.leftFoot.x, s.leftFoot.y);

  // Right leg
  drawLine(ctx, s.hip.x, s.hip.y, s.rightKnee.x, s.rightKnee.y);
  drawLine(ctx, s.rightKnee.x, s.rightKnee.y, s.rightFoot.x, s.rightFoot.y);

  // Head
  ctx.beginPath();
  ctx.arc(s.head.x, s.head.y, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes
  const eyeSpacing = 4;
  const eyeY = s.head.y - 1;
  const eyeRadius = 2;
  const pupilRadius = 1;

  if (s.eyeOpenness > 0.1) {
    // Open eyes
    const leftEyeX = s.head.x - eyeSpacing;
    const rightEyeX = s.head.x + eyeSpacing;

    // Eye whites
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, eyeRadius * s.eyeOpenness, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, eyeRadius * s.eyeOpenness, 0, Math.PI * 2);
    ctx.stroke();

    // Pupils (offset by gaze direction)
    const maxPupilOffset = 1.5;
    const px = s.pupilOffsetX * maxPupilOffset;
    const py = s.pupilOffsetY * maxPupilOffset;

    ctx.beginPath();
    ctx.arc(leftEyeX + px, eyeY + py, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + px, eyeY + py, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closed eyes (horizontal lines)
    const leftEyeX = s.head.x - eyeSpacing;
    const rightEyeX = s.head.x + eyeSpacing;
    drawLine(ctx, leftEyeX - 2, eyeY, leftEyeX + 2, eyeY);
    drawLine(ctx, rightEyeX - 2, eyeY, rightEyeX + 2, eyeY);
  }

  // Mouth
  const mouthY = s.head.y + 4;
  ctx.beginPath();
  if (s.mouthSmile > 0) {
    ctx.arc(s.head.x, mouthY - 1, 3, 0.2, Math.PI - 0.2);
  } else if (s.mouthSmile < 0) {
    ctx.arc(s.head.x, mouthY + 2, 3, Math.PI + 0.2, -0.2);
  } else {
    drawLine(ctx, s.head.x - 3, mouthY, s.head.x + 3, mouthY);
  }
  ctx.stroke();

  ctx.restore(); // Undo lean rotation

  // Draw zzz particles (outside lean transform so they float straight up)
  if (zzzParticles.length > 0) {
    ctx.font = '10px sans-serif';
    for (const p of zzzParticles) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = colors.accent;
      ctx.fillText(p.char, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.stroke;
  }

  ctx.restore();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
