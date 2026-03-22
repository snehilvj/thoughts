import type { FallingPetal, LeafNode } from './types';
import { SVG_NS, GROUND_Y, PETAL_POOL_SIZE, SCENE_WIDTH } from './constants';

let animationId: number | null = null;
let petalPool: FallingPetal[] = [];
let leaves: { element: SVGGElement; offset: number }[] = [];
let windMultiplier = 1;
let particleLayer: SVGGElement | null = null;
let ambientPetals = false;

function createPetalElement(): SVGGElement {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'petal-particle');

  // Small origami petal (two triangles)
  const right = document.createElementNS(SVG_NS, 'polygon');
  right.setAttribute('points', '0,-3 4,0 0,3');
  right.setAttribute('fill', 'var(--garden-petal)');
  g.appendChild(right);

  const left = document.createElementNS(SVG_NS, 'polygon');
  left.setAttribute('points', '0,-3 -3,0 0,3');
  left.setAttribute('fill', 'var(--garden-petal-fold)');
  g.appendChild(left);

  return g;
}

export function initPetalPool() {
  particleLayer = document.getElementById('layer-particles') as unknown as SVGGElement;
  if (!particleLayer) return;

  petalPool = [];
  for (let i = 0; i < PETAL_POOL_SIZE; i++) {
    const element = createPetalElement();
    element.style.display = 'none';
    particleLayer.appendChild(element);

    petalPool.push({
      x: 0, y: -20,
      rotation: 0,
      fallSpeed: 0.5 + Math.random() * 1,
      driftFreq: 0.5 + Math.random() * 1.5,
      driftAmp: 15 + Math.random() * 25,
      rotSpeed: 1 + Math.random() * 3,
      element: element,
      active: false,
    });
  }
}

function activatePetal(x: number, y: number) {
  const petal = petalPool.find(p => !p.active);
  if (!petal || !petal.element) return;

  petal.active = true;
  petal.x = x + (Math.random() - 0.5) * 20;
  petal.y = y;
  petal.rotation = Math.random() * 360;
  petal.fallSpeed = 0.4 + Math.random() * 0.8;
  petal.driftFreq = 0.5 + Math.random() * 1.5;
  petal.driftAmp = 12 + Math.random() * 20;
  petal.rotSpeed = 1 + Math.random() * 3;
  petal.element.style.display = '';
}

function recyclePetal(petal: FallingPetal) {
  petal.active = false;
  if (petal.element) {
    petal.element.style.display = 'none';
  }
}

export function dropPetals(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    activatePetal(x, y);
  }
}

export function collectLeafElements() {
  leaves = [];
  const leafEls = document.querySelectorAll('.leaf-group');
  leafEls.forEach((el, i) => {
    leaves.push({
      element: el as SVGGElement,
      offset: i * 0.7 + Math.random() * 2,
    });
  });
}

export function setAmbientPetals(enabled: boolean) {
  ambientPetals = enabled;
}

export function triggerWindBurst() {
  windMultiplier = 3;
  // Extra petals during wind
  if (ambientPetals) {
    for (let i = 0; i < 5; i++) {
      activatePetal(
        100 + Math.random() * (SCENE_WIDTH - 200),
        100 + Math.random() * 200
      );
    }
  }
}

let lastAmbientSpawn = 0;

function animationLoop(timestamp: number) {
  const t = timestamp * 0.001;

  // Decay wind multiplier
  if (windMultiplier > 1) {
    windMultiplier = Math.max(1, windMultiplier - 0.02);
  }

  // Sway leaves
  for (const leaf of leaves) {
    const swayAngle = Math.sin(t * 0.5 + leaf.offset) * 2 * windMultiplier;
    const currentTransform = leaf.element.getAttribute('transform') || '';
    // Only modify rotation, keep existing translate/rotate from initial placement
    const baseTransform = currentTransform.replace(/\s*rotate\([^)]*\)\s*$/, '');
    leaf.element.setAttribute('transform', `${baseTransform} rotate(${swayAngle})`);
  }

  // Update falling petals
  for (const petal of petalPool) {
    if (!petal.active || !petal.element) continue;

    petal.y += petal.fallSpeed * windMultiplier;
    petal.x += Math.sin(t * petal.driftFreq) * petal.driftAmp * 0.02 * windMultiplier;
    petal.rotation += petal.rotSpeed * windMultiplier;

    if (petal.y > GROUND_Y + 10) {
      recyclePetal(petal);
      continue;
    }

    petal.element.setAttribute(
      'transform',
      `translate(${petal.x}, ${petal.y}) rotate(${petal.rotation})`
    );
  }

  // Ambient petal spawning (full bloom)
  if (ambientPetals && t - lastAmbientSpawn > 1.5) {
    lastAmbientSpawn = t;
    if (Math.random() < 0.4) {
      activatePetal(
        200 + Math.random() * 400,
        100 + Math.random() * 150
      );
    }
  }

  animationId = requestAnimationFrame(animationLoop);
}

export function startPhysics() {
  if (animationId !== null) return;

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (animationId === null) {
        animationId = requestAnimationFrame(animationLoop);
      }
    }
  });

  animationId = requestAnimationFrame(animationLoop);
}

export function stopPhysics() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
