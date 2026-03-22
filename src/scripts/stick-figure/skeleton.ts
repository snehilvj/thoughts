export interface Joint {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface Skeleton {
  hip: Joint;
  neck: Joint;
  head: Joint;
  leftElbow: Joint;
  leftHand: Joint;
  rightElbow: Joint;
  rightHand: Joint;
  leftKnee: Joint;
  leftFoot: Joint;
  rightKnee: Joint;
  rightFoot: Joint;
  pupilOffsetX: number;
  pupilOffsetY: number;
  mouthSmile: number; // 0 = neutral, 1 = big smile, -1 = frown
  eyeOpenness: number; // 1 = fully open, 0 = closed
  leanAngle: number;
  targetLeanAngle: number;
}

const HEAD_RADIUS = 10;
const BODY_LENGTH = 25;
const UPPER_ARM = 15;
const LOWER_ARM = 13;
const UPPER_LEG = 18;
const LOWER_LEG = 16;

export { HEAD_RADIUS, BODY_LENGTH, UPPER_ARM, LOWER_ARM, UPPER_LEG, LOWER_LEG };

export function createSkeleton(baseX: number, baseY: number): Skeleton {
  const hipY = baseY;
  const neckY = hipY - BODY_LENGTH;
  const headY = neckY - HEAD_RADIUS;

  return {
    hip: joint(baseX, hipY),
    neck: joint(baseX, neckY),
    head: joint(baseX, headY),
    leftElbow: joint(baseX - UPPER_ARM * 0.7, neckY + 10),
    leftHand: joint(baseX - UPPER_ARM * 0.7 - LOWER_ARM * 0.5, neckY + 20),
    rightElbow: joint(baseX + UPPER_ARM * 0.7, neckY + 10),
    rightHand: joint(baseX + UPPER_ARM * 0.7 + LOWER_ARM * 0.5, neckY + 20),
    leftKnee: joint(baseX - 8, hipY + UPPER_LEG),
    leftFoot: joint(baseX - 10, hipY + UPPER_LEG + LOWER_LEG),
    rightKnee: joint(baseX + 8, hipY + UPPER_LEG),
    rightFoot: joint(baseX + 10, hipY + UPPER_LEG + LOWER_LEG),
    pupilOffsetX: 0,
    pupilOffsetY: 0,
    mouthSmile: 0.3,
    eyeOpenness: 1,
    leanAngle: 0,
    targetLeanAngle: 0,
  };
}

function joint(x: number, y: number): Joint {
  return { x, y, targetX: x, targetY: y };
}

export function updateSkeleton(skeleton: Skeleton, dt: number): void {
  const speed = Math.min(dt * 8, 1);
  const joints: (keyof Skeleton)[] = [
    'hip', 'neck', 'head',
    'leftElbow', 'leftHand', 'rightElbow', 'rightHand',
    'leftKnee', 'leftFoot', 'rightKnee', 'rightFoot',
  ];

  for (const key of joints) {
    const j = skeleton[key] as Joint;
    j.x = lerp(j.x, j.targetX, speed);
    j.y = lerp(j.y, j.targetY, speed);
  }

  skeleton.leanAngle = lerp(skeleton.leanAngle, skeleton.targetLeanAngle, speed * 0.5);
}

export function setBasePosition(skeleton: Skeleton, baseX: number, baseY: number): void {
  const hipY = baseY;
  const neckY = hipY - BODY_LENGTH;
  const headY = neckY - HEAD_RADIUS;

  skeleton.hip.targetX = baseX;
  skeleton.hip.targetY = hipY;
  skeleton.neck.targetX = baseX;
  skeleton.neck.targetY = neckY;
  skeleton.head.targetX = baseX;
  skeleton.head.targetY = headY;

  skeleton.leftElbow.targetX = baseX - UPPER_ARM * 0.7;
  skeleton.leftElbow.targetY = neckY + 10;
  skeleton.leftHand.targetX = baseX - UPPER_ARM * 0.7 - LOWER_ARM * 0.5;
  skeleton.leftHand.targetY = neckY + 20;

  skeleton.rightElbow.targetX = baseX + UPPER_ARM * 0.7;
  skeleton.rightElbow.targetY = neckY + 10;
  skeleton.rightHand.targetX = baseX + UPPER_ARM * 0.7 + LOWER_ARM * 0.5;
  skeleton.rightHand.targetY = neckY + 20;

  skeleton.leftKnee.targetX = baseX - 8;
  skeleton.leftKnee.targetY = hipY + UPPER_LEG;
  skeleton.leftFoot.targetX = baseX - 10;
  skeleton.leftFoot.targetY = hipY + UPPER_LEG + LOWER_LEG;

  skeleton.rightKnee.targetX = baseX + 8;
  skeleton.rightKnee.targetY = hipY + UPPER_LEG;
  skeleton.rightFoot.targetX = baseX + 10;
  skeleton.rightFoot.targetY = hipY + UPPER_LEG + LOWER_LEG;
}
