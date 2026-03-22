import type { Skeleton } from './skeleton';
import { HEAD_RADIUS } from './skeleton';
import type { StateController } from './states';

export interface InteractionState {
  mouseX: number;
  mouseY: number;
  lastInteractionTime: number;
  scrollVelocity: number;
  destroy(): void;
}

const IDLE_TIMEOUT = 30_000; // 30 seconds
const LEAN_RANGE = 400; // pixels
const DANCE_RESET_MS = 600; // keep dancing for this long after last keypress

export function setupInteractions(
  canvas: HTMLCanvasElement,
  skeleton: Skeleton,
  stateController: StateController,
  getCanvasRect: () => DOMRect,
): InteractionState {
  let lastDanceKeyTime = 0;

  const state: InteractionState = {
    mouseX: 0,
    mouseY: 0,
    lastInteractionTime: Date.now(),
    scrollVelocity: 0,
    destroy() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    },
  };

  function resetIdleTimer() {
    state.lastInteractionTime = Date.now();
    if (stateController.current === 'sleeping') {
      stateController.transition('idle');
    }
  }

  // --- Hit test helper ---
  function hitTestFigure(clientX: number, clientY: number): boolean {
    const rect = getCanvasRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    const dx = cx - skeleton.head.x;
    const dy = cy - skeleton.head.y;
    const headHit = Math.sqrt(dx * dx + dy * dy) < HEAD_RADIUS * 3.5;

    const bdx = cx - skeleton.hip.x;
    const bdy = cy - skeleton.hip.y;
    const bodyHit = Math.abs(bdx) < 30 && bdy > -50 && bdy < 50;

    return headHit || bodyHit;
  }

  // --- Mouse ---
  function onMouseMove(e: MouseEvent) {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    resetIdleTimer();
  }

  function onClick(e: MouseEvent) {
    resetIdleTimer();
    if (hitTestFigure(e.clientX, e.clientY)) {
      if (stateController.current !== 'waving' && stateController.current !== 'jumping') {
        stateController.transition('waving');
      }
    } else {
      // Click elsewhere — brief head turn toward click
      // (handled via mouse position already tracking)
    }
  }

  function onDblClick(e: MouseEvent) {
    resetIdleTimer();
    if (hitTestFigure(e.clientX, e.clientY)) {
      stateController.transition('jumping');
    }
  }

  // --- Touch ---
  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    resetIdleTimer();
  }

  let lastTapTime = 0;
  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    state.mouseX = touch.clientX;
    state.mouseY = touch.clientY;
    resetIdleTimer();

    if (hitTestFigure(touch.clientX, touch.clientY)) {
      const now = Date.now();
      if (now - lastTapTime < 350) {
        // Double tap
        stateController.transition('jumping');
      } else {
        if (stateController.current !== 'waving' && stateController.current !== 'jumping') {
          stateController.transition('waving');
        }
      }
      lastTapTime = now;
    }
  }

  // --- Keyboard ---
  function onKeyDown(e: KeyboardEvent) {
    resetIdleTimer();

    if (e.key === 'Escape') {
      stateController.transition('sitting');
      return;
    }

    if (e.key === ' ' && !isTypingInInput(e)) {
      stateController.transition('jumping');
      return;
    }

    if (e.key.startsWith('Arrow')) {
      // Small lean in arrow direction
      if (e.key === 'ArrowLeft') skeleton.targetLeanAngle = -0.15;
      else if (e.key === 'ArrowRight') skeleton.targetLeanAngle = 0.15;
      return;
    }

    // Printable keys -> dance
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      lastDanceKeyTime = Date.now();
      if (stateController.current !== 'dancing') {
        stateController.transition('dancing');
      } else {
        // Reset dance timer so it keeps going
        stateController.stateTime = Math.min(stateController.stateTime, 1);
      }
    }
  }

  // --- Scroll ---
  let lastScrollY = window.scrollY;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  function onScroll() {
    resetIdleTimer();
    const dy = window.scrollY - lastScrollY;
    state.scrollVelocity = dy;
    lastScrollY = window.scrollY;

    // Fast scroll -> surprised
    if (Math.abs(dy) > 80 && stateController.current === 'idle') {
      stateController.transition('surprised');
    }

    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      state.scrollVelocity = 0;
    }, 150);
  }

  // --- Register ---
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onClick);
  document.addEventListener('dblclick', onDblClick);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });

  return state;
}

function isTypingInInput(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable === true;
}

export function updateFromPointer(
  skeleton: Skeleton,
  interaction: InteractionState,
  canvasRect: DOMRect,
): void {
  // Eye tracking
  const headScreenX = canvasRect.left + skeleton.head.x;
  const headScreenY = canvasRect.top + skeleton.head.y;
  const dx = interaction.mouseX - headScreenX;
  const dy = interaction.mouseY - headScreenY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    skeleton.pupilOffsetX = dx / dist;
    skeleton.pupilOffsetY = dy / dist;
  }

  // Body lean toward pointer when close
  const hipScreenX = canvasRect.left + skeleton.hip.x;
  const hipDx = interaction.mouseX - hipScreenX;
  const hipDist = Math.abs(hipDx);

  if (hipDist < LEAN_RANGE) {
    const strength = (1 - hipDist / LEAN_RANGE) * 0.1;
    skeleton.targetLeanAngle = hipDx > 0 ? strength : -strength;
  } else {
    skeleton.targetLeanAngle = 0;
  }

  // Scroll lean
  if (Math.abs(interaction.scrollVelocity) > 5) {
    const scrollLean = Math.sign(interaction.scrollVelocity) * Math.min(Math.abs(interaction.scrollVelocity) * 0.002, 0.08);
    skeleton.targetLeanAngle += scrollLean;
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
