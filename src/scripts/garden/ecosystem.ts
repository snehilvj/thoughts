import type { Creature, CloudNode, WeatherState } from './types';
import { createRng } from './tree-renderer';
import { SVG_NS, SCENE_WIDTH, GROUND_Y } from './constants';

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// ===================== CREATURE RENDERING =====================

function renderBird(creature: Creature, layer: SVGGElement) {
  const g = el('g', {
    class: 'creature-group creature-bird',
  }) as SVGGElement;
  const s = creature.scale;
  g.setAttribute('transform', `translate(${creature.x}, ${creature.y}) scale(${s})`);

  // Origami crane: body triangle
  g.appendChild(el('polygon', {
    points: '0,-6 12,2 -12,2',
    fill: 'var(--garden-bird)',
  }));
  // Body fold
  g.appendChild(el('polygon', {
    points: '0,-6 -12,2 0,2',
    fill: 'var(--garden-bird-fold)',
  }));
  // Right wing
  g.appendChild(el('polygon', {
    points: '12,2 20,-4 8,4',
    fill: 'var(--garden-bird)',
  }));
  // Left wing
  g.appendChild(el('polygon', {
    points: '-12,2 -20,-4 -8,4',
    fill: 'var(--garden-bird-fold)',
  }));
  // Tail
  g.appendChild(el('polygon', {
    points: '0,2 -4,8 4,8',
    fill: 'var(--garden-bird)',
  }));
  // Beak
  g.appendChild(el('polygon', {
    points: '0,-6 3,-10 -1,-7',
    fill: 'var(--garden-blossom-center)',
  }));

  creature.element = g;
  layer.appendChild(g);
}

function renderSquirrel(creature: Creature, layer: SVGGElement) {
  const g = el('g', {
    class: 'creature-group creature-squirrel',
  }) as SVGGElement;
  const s = creature.scale;
  g.setAttribute('transform', `translate(${creature.x}, ${creature.y}) scale(${s})`);

  // Body
  g.appendChild(el('polygon', {
    points: '0,-8 6,0 4,8 -4,8 -6,0',
    fill: 'var(--garden-squirrel)',
  }));
  // Body fold
  g.appendChild(el('polygon', {
    points: '0,-8 -6,0 -4,8 0,8 0,0',
    fill: 'var(--garden-squirrel-fold)',
  }));
  // Tail (curved via polygon)
  g.appendChild(el('polygon', {
    points: '-2,6 -8,0 -12,-4 -10,2 -4,8',
    fill: 'var(--garden-squirrel)',
  }));
  // Tail fold
  g.appendChild(el('polygon', {
    points: '-8,0 -12,-4 -10,-6 -6,-2',
    fill: 'var(--garden-squirrel-fold)',
  }));
  // Head
  g.appendChild(el('polygon', {
    points: '0,-8 4,-12 -4,-12',
    fill: 'var(--garden-squirrel)',
  }));
  // Ear
  g.appendChild(el('polygon', {
    points: '3,-12 5,-15 1,-12',
    fill: 'var(--garden-squirrel-fold)',
  }));
  // Eye
  g.appendChild(el('circle', {
    cx: 2, cy: -10, r: 0.8,
    fill: 'var(--garden-sky)',
  }));

  creature.element = g;
  layer.appendChild(g);
}

function renderInsect(creature: Creature, layer: SVGGElement) {
  const g = el('g', {
    class: 'creature-group creature-insect',
  }) as SVGGElement;
  const s = creature.scale;
  g.setAttribute('transform', `translate(${creature.x}, ${creature.y}) scale(${s})`);

  // Body
  g.appendChild(el('polygon', {
    points: '0,-4 3,0 0,5 -3,0',
    fill: 'var(--garden-insect)',
  }));
  // Body fold
  g.appendChild(el('polygon', {
    points: '0,-4 -3,0 0,5',
    fill: 'var(--garden-insect-fold)',
  }));
  // Wings
  g.appendChild(el('polygon', {
    points: '3,0 8,-3 5,2',
    fill: 'var(--garden-insect)',
    opacity: '0.6',
  }));
  g.appendChild(el('polygon', {
    points: '-3,0 -8,-3 -5,2',
    fill: 'var(--garden-insect-fold)',
    opacity: '0.6',
  }));

  creature.element = g;
  layer.appendChild(g);
}

function renderNest(creature: Creature, layer: SVGGElement) {
  const g = el('g', {
    class: 'creature-group',
  }) as SVGGElement;
  const s = creature.scale;
  g.setAttribute('transform', `translate(${creature.x}, ${creature.y}) scale(${s})`);

  // Bowl shape
  g.appendChild(el('polygon', {
    points: '-10,-2 10,-2 7,6 -7,6',
    fill: 'var(--garden-nest)',
  }));
  // Fold
  g.appendChild(el('polygon', {
    points: '0,-2 10,-2 7,6 0,6',
    fill: 'var(--garden-nest-fold)',
  }));
  // Weave lines
  for (let i = 0; i < 3; i++) {
    g.appendChild(el('line', {
      x1: -8 + i * 3, y1: -1 + i * 2,
      x2: 8 - i * 3, y2: -1 + i * 2,
      stroke: 'var(--garden-trunk)', 'stroke-width': '0.5', opacity: '0.4',
    }));
  }
  // Eggs
  g.appendChild(el('circle', { cx: -2, cy: 1, r: 2, fill: 'var(--garden-petal)' }));
  g.appendChild(el('circle', { cx: 2, cy: 2, r: 1.8, fill: 'var(--garden-petal-fold)' }));

  creature.element = g;
  layer.appendChild(g);
}

export function renderCreatures(creatures: Creature[]) {
  const layer = document.getElementById('layer-creatures') as unknown as SVGGElement;
  if (!layer) return;
  layer.innerHTML = '';

  for (const c of creatures) {
    switch (c.type) {
      case 'bird': renderBird(c, layer); break;
      case 'squirrel': renderSquirrel(c, layer); break;
      case 'insect': renderInsect(c, layer); break;
      case 'nest': renderNest(c, layer); break;
    }
  }
}

// ===================== WEATHER =====================

function renderCloud(cloud: CloudNode, layer: SVGGElement) {
  const g = el('g', {
    class: 'cloud-group',
    style: `animation-duration: ${25 + cloud.speed * 20}s; animation-delay: ${-cloud.x / 900 * 25}s`,
  }) as SVGGElement;

  const s = cloud.scale;
  g.setAttribute('transform', `translate(${cloud.x}, ${cloud.y}) scale(${s})`);

  // Overlapping geometric shapes
  g.appendChild(el('polygon', {
    points: '-20,5 -10,-8 10,-10 25,-5 30,5 -25,5',
    fill: 'var(--garden-cloud)',
  }));
  g.appendChild(el('polygon', {
    points: '-15,5 -5,-5 15,-7 20,0 25,5',
    fill: 'var(--garden-cloud-fold)',
  }));
  // Fold crease
  g.appendChild(el('line', {
    x1: -10, y1: -5, x2: 20, y2: -3,
    stroke: 'var(--garden-cloud)', 'stroke-width': '0.5', opacity: '0.3',
  }));

  cloud.element = g;
  layer.appendChild(g);
}

function renderRain(layer: SVGGElement) {
  const rng = createRng(Date.now());
  const dropCount = 30;

  for (let i = 0; i < dropCount; i++) {
    const x = rng() * SCENE_WIDTH;
    const delay = rng() * 2;
    const duration = 0.8 + rng() * 0.6;

    layer.appendChild(el('line', {
      x1: x, y1: 0, x2: x - 3, y2: 12,
      stroke: 'var(--garden-rain)', 'stroke-width': '1.5',
      class: 'rain-drop',
      style: `animation-duration: ${duration}s; animation-delay: ${delay}s`,
    }));
  }
}

function renderLightning(layer: SVGGElement) {
  const x = 200 + Math.random() * 400;
  const bolt = el('polyline', {
    points: `${x},20 ${x - 15},80 ${x + 10},100 ${x - 5},160 ${x + 8},180 ${x - 10},250`,
    stroke: 'var(--garden-lightning)',
    'stroke-width': '2',
    fill: 'none',
    class: 'lightning',
    opacity: '0.9',
  });
  layer.appendChild(bolt);
  setTimeout(() => bolt.remove(), 500);
}

export function initWeather(visits: number): WeatherState {
  const skyLayer = document.getElementById('layer-sky') as unknown as SVGGElement;
  const particleLayer = document.getElementById('layer-particles') as unknown as SVGGElement;
  if (!skyLayer || !particleLayer) return { clouds: [], raining: false, lightning: false };

  // Clear sky
  skyLayer.innerHTML = '';

  // Sky background gradient
  skyLayer.appendChild(el('rect', {
    x: 0, y: 0, width: SCENE_WIDTH, height: GROUND_Y,
    fill: 'var(--garden-sky)',
  }));

  // Clouds (always possible)
  const clouds: CloudNode[] = [];
  const rng = createRng(Date.now() % 10000);
  const cloudCount = Math.floor(rng() * 4) + 1;

  for (let i = 0; i < cloudCount; i++) {
    const cloud: CloudNode = {
      x: rng() * SCENE_WIDTH,
      y: 30 + rng() * 80,
      scale: 0.8 + rng() * 1.2,
      speed: 0.3 + rng() * 0.7,
    };
    clouds.push(cloud);
    renderCloud(cloud, skyLayer);
  }

  // Rain chance (visits >= 30)
  const raining = visits >= 30 && Math.random() < 0.05;
  if (raining) {
    renderRain(particleLayer);
  }

  // Lightning chance (visits >= 50, only during rain)
  const lightning = raining && visits >= 50 && Math.random() < 0.3;
  if (lightning) {
    // Schedule random lightning strikes
    const strikeCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < strikeCount; i++) {
      setTimeout(() => renderLightning(skyLayer), 2000 + Math.random() * 8000);
    }
  }

  return { clouds, raining, lightning };
}
