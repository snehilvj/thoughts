import type { Skeleton } from './skeleton';
import { HEAD_RADIUS } from './skeleton';
import type { StateController } from './states';

export interface InteractionState {
  mouseX: number;
  mouseY: number;
  lastInteractionTime: number;
  destroy(): void;
}

const IDLE_TIMEOUT = 30_000; // 30 seconds
const LEAN_RANGE = 300; // pixels

export function setupInteractions(
  canvas: HTMLCanvasElement,
  skeleton: Skeleton,
  stateController: StateController,
  getCanvasRect: () => DOMRect,
): InteractionState {
  const state: InteractionState = {
    mouseX: 0,
    mouseY: 0,
    lastInteractionTime: Date.now(),
    destroy() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchstart', onTouchStart);
    },
  };

  function resetIdleTimer() {
    state.lastInteractionTime = Date.now();
    if (stateController.current === 'sleeping') {
      stateController.transition('idle');
    }
  }

  function onMouseMove(e: MouseEvent) {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    resetIdleTimer();
  }

  function onClick(e: MouseEvent) {
    resetIdleTimer();

    // Check if click is on/near the figure
    const rect = getCanvasRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = (e.clientX - rect.left);
    const canvasY = (e.clientY - rect.top);

    // Hit test against the figure's head area (most clickable)
    const dx = canvasX - skeleton.head.x;
    const dy = canvasY - skeleton.head.y;
    const bodyDy = canvasY - skeleton.hip.y;
    const bodyDx = canvasX - skeleton.hip.x;

    const headHit = Math.sqrt(dx * dx + dy * dy) < HEAD_RADIUS * 3;
    const bodyHit = Math.abs(bodyDx) < 20 && bodyDy > -40 && bodyDy < 40;

    if ((headHit || bodyHit) && stateController.current !== 'waving') {
      stateController.transition('waving');
    }
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    resetIdleTimer();
  }

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    resetIdleTimer();

    // Hit test for tap on figure
    const rect = getCanvasRect();
    const canvasX = touch.clientX - rect.left;
    const canvasY = touch.clientY - rect.top;

    const dx = canvasX - skeleton.head.x;
    const dy = canvasY - skeleton.head.y;
    const bodyDx = canvasX - skeleton.hip.x;
    const bodyDy = canvasY - skeleton.hip.y;

    const headHit = Math.sqrt(dx * dx + dy * dy) < HEAD_RADIUS * 3;
    const bodyHit = Math.abs(bodyDx) < 20 && bodyDy > -40 && bodyDy < 40;

    if ((headHit || bodyHit) && stateController.current !== 'waving') {
      stateController.transition('waving');
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onClick);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchstart', onTouchStart, { passive: true });

  return state;
}

export function updateFromMouse(
  skeleton: Skeleton,
  interaction: InteractionState,
  canvasRect: DOMRect,
): void {
  // Eye tracking: compute direction from head to mouse
  const headScreenX = canvasRect.left + skeleton.head.x;
  const headScreenY = canvasRect.top + skeleton.head.y;
  const dx = interaction.mouseX - headScreenX;
  const dy = interaction.mouseY - headScreenY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    skeleton.pupilOffsetX = dx / dist;
    skeleton.pupilOffsetY = dy / dist;
  }

  // Body lean toward cursor when close
  const hipScreenX = canvasRect.left + skeleton.hip.x;
  const hipScreenY = canvasRect.top + skeleton.hip.y;
  const hipDx = interaction.mouseX - hipScreenX;
  const hipDist = Math.abs(hipDx);

  if (hipDist < LEAN_RANGE) {
    const leanStrength = (1 - hipDist / LEAN_RANGE) * 0.12;
    skeleton.targetLeanAngle = hipDx > 0 ? leanStrength : -leanStrength;
  } else {
    skeleton.targetLeanAngle = 0;
  }
}

export function checkIdleTimeout(
  interaction: InteractionState,
  stateController: StateController,
): void {
  const elapsed = Date.now() - interaction.lastInteractionTime;
  if (elapsed > IDLE_TIMEOUT && stateController.current === 'idle') {
    stateController.transition('sleeping');
  }
}
