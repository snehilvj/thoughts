import { createSkeleton, updateSkeleton } from './skeleton';
import { draw, type ThemeColors } from './renderer';
import { createStateController } from './states';
import { setupInteractions, updateFromMouse, checkIdleTimeout } from './interactions';

export function init(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = 120;
  const logicalHeight = 140;

  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  // Figure anchor point (center-bottom of canvas)
  const baseX = logicalWidth / 2;
  const baseY = logicalHeight - 40;

  const skeleton = createSkeleton(baseX, baseY);
  const stateController = createStateController();

  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  const interaction = setupInteractions(canvas, skeleton, stateController, getCanvasRect);

  let colors = readThemeColors();
  const themeObserver = new MutationObserver(() => {
    colors = readThemeColors();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  let lastTime = performance.now();
  let animationId = 0;
  let paused = false;

  // Respect reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loop(now: number) {
    if (paused) {
      animationId = requestAnimationFrame(loop);
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = now;

    // Check idle timeout
    checkIdleTimeout(interaction, stateController);

    // Update state
    stateController.update(skeleton, dt, baseX, baseY);

    // Update from mouse
    updateFromMouse(skeleton, interaction, getCanvasRect());

    // Smooth interpolation
    updateSkeleton(skeleton, dt);

    // Draw
    draw(ctx!, skeleton, colors, stateController.zzzParticles);

    animationId = requestAnimationFrame(loop);
  }

  if (reducedMotion) {
    // Just draw a single static frame
    stateController.update(skeleton, 0, baseX, baseY);
    updateSkeleton(skeleton, 1);
    draw(ctx, skeleton, colors, []);
  } else {
    animationId = requestAnimationFrame(loop);
  }

  // Pause when tab is hidden
  function onVisibilityChange() {
    paused = document.hidden;
    if (!paused) {
      lastTime = performance.now();
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    interaction.destroy();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    stroke: styles.getPropertyValue('--color-text').trim() || '#1a1a2e',
    accent: styles.getPropertyValue('--color-accent').trim() || '#e2a052',
  };
}
