import { createSkeleton, updateSkeleton } from './skeleton';
import { draw, setupCanvas, type ThemeColors } from './renderer';
import { createStateController } from './states';
import { setupInteractions, updateFromPointer, checkIdleTimeout } from './interactions';

const LOGICAL_WIDTH = 150;
const LOGICAL_HEIGHT = 180;

export function init(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // Setup canvas with correct DPR
  setupCanvas(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // Figure anchor: center-x, positioned so feet are near bottom
  const baseX = LOGICAL_WIDTH / 2;
  const baseY = LOGICAL_HEIGHT - 60;

  const skeleton = createSkeleton(baseX, baseY);
  const stateController = createStateController();

  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  const interaction = setupInteractions(canvas, skeleton, stateController, getCanvasRect);

  let colors = readThemeColors();

  // Theme change observer
  const themeObserver = new MutationObserver(() => {
    colors = readThemeColors();
    // Trigger shielding reaction
    if (stateController.current === 'idle' || stateController.current === 'sleeping') {
      stateController.transition('shielding');
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  let lastTime = performance.now();
  let animationId = 0;
  let paused = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loop(now: number) {
    if (paused) {
      animationId = requestAnimationFrame(loop);
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    checkIdleTimeout(interaction, stateController);
    stateController.update(skeleton, dt, baseX, baseY);
    updateFromPointer(skeleton, interaction, getCanvasRect());
    updateSkeleton(skeleton, dt);
    draw(ctx!, skeleton, colors, stateController.zzzParticles);

    animationId = requestAnimationFrame(loop);
  }

  if (reducedMotion) {
    stateController.update(skeleton, 0, baseX, baseY);
    updateSkeleton(skeleton, 1);
    draw(ctx, skeleton, colors, []);
  } else {
    animationId = requestAnimationFrame(loop);
  }

  // Pause when tab hidden
  function onVisibilityChange() {
    paused = document.hidden;
    if (!paused) lastTime = performance.now();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Re-setup canvas on resize (handles orientation change + DPR change)
  function onResize() {
    setupCanvas(canvas, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(animationId);
    interaction.destroy();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', onResize);
  };
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    stroke: styles.getPropertyValue('--color-text').trim() || '#1a1a2e',
    accent: styles.getPropertyValue('--color-accent').trim() || '#e2a052',
    bg: styles.getPropertyValue('--color-bg').trim() || '#faf9f6',
  };
}
