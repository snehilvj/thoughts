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
  leftShoulder: Joint;
  leftElbow: Joint;
  leftHand: Joint;
  rightShoulder: Joint;
  rightElbow: Joint;
  rightHand: Joint;
  leftKnee: Joint;
  leftFoot: Joint;
  rightKnee: Joint;
  rightFoot: Joint;
  // Expression
  pupilOffsetX: number;
  pupilOffsetY: number;
  mouthSmile: number; // -1 frown .. 0 neutral .. 1 big smile
  eyeOpenness: number; // 0 closed .. 1 fully open
  mouthOpen: number; // 0 closed .. 1 wide open (surprised O)
  // Posture
  leanAngle: number;
  targetLeanAngle: number;
}

// Scaled-up proportions for a visible, characterful figure
export const HEAD_RADIUS = 16;
const NECK_LENGTH = 6;
const BODY_LENGTH = 32;
const SHOULDER_WIDTH = 14;
const UPPER_ARM = 18;
const LOWER_ARM = 16;
const UPPER_LEG = 22;
const LOWER_LEG = 20;

export { BODY_LENGTH, SHOULDER_WIDTH, UPPER_ARM, LOWER_ARM, UPPER_LEG, LOWER_LEG };

export function createSkeleton(baseX: number, baseY: number): Skeleton {
  const s = {} as Skeleton;
  applyRestPose(s, baseX, baseY);
  // Copy targets to current positions
  const jointKeys = getJointKeys();
  for (const key of jointKeys) {
    const j = s[key] as Joint;
    j.x = j.targetX;
    j.y = j.targetY;
  }
  s.pupilOffsetX = 0;
  s.pupilOffsetY = 0;
  s.mouthSmile = 0.3;
  s.eyeOpenness = 1;
  s.mouthOpen = 0;
  s.leanAngle = 0;
  s.targetLeanAngle = 0;
  return s;
}

export function applyRestPose(skeleton: Skeleton, baseX: number, baseY: number): void {
  const hipY = baseY;
  const neckY = hipY - BODY_LENGTH;
  const headY = neckY - NECK_LENGTH - HEAD_RADIUS;

  skeleton.hip = target(skeleton.hip, baseX, hipY);
  skeleton.neck = target(skeleton.neck, baseX, neckY);
  skeleton.head = target(skeleton.head, baseX, headY);

  // Shoulders slightly out from neck
  skeleton.leftShoulder = target(skeleton.leftShoulder, baseX - SHOULDER_WIDTH, neckY + 2);
  skeleton.rightShoulder = target(skeleton.rightShoulder, baseX + SHOULDER_WIDTH, neckY + 2);

  // Arms hang naturally — hands well below shoulders
  skeleton.leftElbow = target(skeleton.leftElbow, baseX - SHOULDER_WIDTH - 5, neckY + 2 + UPPER_ARM * 0.7);
  skeleton.leftHand = target(skeleton.leftHand, baseX - SHOULDER_WIDTH - 3, neckY + 2 + UPPER_ARM * 0.7 + LOWER_ARM * 0.7);
  skeleton.rightElbow = target(skeleton.rightElbow, baseX + SHOULDER_WIDTH + 5, neckY + 2 + UPPER_ARM * 0.7);
  skeleton.rightHand = target(skeleton.rightHand, baseX + SHOULDER_WIDTH + 3, neckY + 2 + UPPER_ARM * 0.7 + LOWER_ARM * 0.7);

  // Legs slightly apart, feet grounded
  skeleton.leftKnee = target(skeleton.leftKnee, baseX - 10, hipY + UPPER_LEG);
  skeleton.leftFoot = target(skeleton.leftFoot, baseX - 12, hipY + UPPER_LEG + LOWER_LEG);
  skeleton.rightKnee = target(skeleton.rightKnee, baseX + 10, hipY + UPPER_LEG);
  skeleton.rightFoot = target(skeleton.rightFoot, baseX + 12, hipY + UPPER_LEG + LOWER_LEG);
}

function target(existing: Joint | undefined, x: number, y: number): Joint {
  if (existing) {
    existing.targetX = x;
    existing.targetY = y;
    return existing;
  }
  return { x, y, targetX: x, targetY: y };
}

export function getJointKeys(): (keyof Skeleton)[] {
  return [
    'hip', 'neck', 'head',
    'leftShoulder', 'leftElbow', 'leftHand',
    'rightShoulder', 'rightElbow', 'rightHand',
    'leftKnee', 'leftFoot', 'rightKnee', 'rightFoot',
  ];
}

export function updateSkeleton(skeleton: Skeleton, dt: number): void {
  const speed = Math.min(dt * 10, 1);
  for (const key of getJointKeys()) {
    const j = skeleton[key] as Joint;
    j.x = lerp(j.x, j.targetX, speed);
    j.y = lerp(j.y, j.targetY, speed);
  }
  skeleton.leanAngle = lerp(skeleton.leanAngle, skeleton.targetLeanAngle, speed * 0.6);
}
