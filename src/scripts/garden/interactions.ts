import type { Creature } from './types';
import { SVG_NS, SCENE_WIDTH } from './constants';

let creatures: Creature[] = [];
let onWindGust: (() => void) | null = null;
let onPetalDrop: ((x: number, y: number, count: number) => void) | null = null;

export function setCreaturesRef(c: Creature[]) {
  creatures = c;
}

export function setWindGustCallback(cb: () => void) {
  onWindGust = cb;
}

export function setPetalDropCallback(cb: (x: number, y: number, count: number) => void) {
  onPetalDrop = cb;
}

function shakeBranch(branchEl: SVGGElement) {
  branchEl.classList.add('shake');

  // Find branch position from transform
  const transform = branchEl.getAttribute('transform') || '';
  const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  const x = match ? parseFloat(match[1]) : 400;
  const y = match ? parseFloat(match[2]) : 300;

  // Drop petals from this branch
  if (onPetalDrop) {
    onPetalDrop(x, y, 2 + Math.floor(Math.random() * 3));
  }

  // Scare nearby creatures
  scareNearbyCreatures(x, y, 80);

  setTimeout(() => branchEl.classList.remove('shake'), 600);
}

function scareNearbyCreatures(x: number, y: number, radius: number) {
  for (const creature of creatures) {
    if (!creature.element || creature.state === 'fleeing') continue;

    const dx = creature.x - x;
    const dy = creature.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      if (creature.type === 'bird') {
        scaredBirdFly(creature);
      } else if (creature.type === 'insect') {
        scaredInsectScatter(creature);
      }
    }
  }
}

function scaredBirdFly(creature: Creature) {
  if (!creature.element || creature.state === 'fleeing') return;
  creature.state = 'fleeing';

  creature.element.classList.add('bird-flee');

  setTimeout(() => {
    if (!creature.element) return;
    creature.element.classList.remove('bird-flee');
    creature.element.classList.add('bird-return');
    creature.state = 'idle';

    setTimeout(() => {
      creature.element?.classList.remove('bird-return');
    }, 1000);
  }, 2500 + Math.random() * 2000);
}

function scaredInsectScatter(creature: Creature) {
  if (!creature.element || creature.state === 'fleeing') return;
  creature.state = 'fleeing';

  const el = creature.element;
  const dx = (Math.random() - 0.5) * 60;
  const dy = -(Math.random() * 40 + 10);

  el.style.transition = 'transform 0.4s ease-out';
  const currentTransform = el.getAttribute('transform') || '';
  el.setAttribute('transform', `${currentTransform} translate(${dx}, ${dy})`);

  setTimeout(() => {
    el.style.transition = 'transform 0.8s ease-in-out';
    el.setAttribute('transform', currentTransform);
    creature.state = 'idle';
  }, 800 + Math.random() * 500);
}

export function attachInteractions() {
  const scene = document.getElementById('garden-scene');
  if (!scene) return;

  // Click on branches
  scene.addEventListener('click', (e) => {
    const target = e.target as SVGElement;
    const branchGroup = target.closest('.branch-group') as SVGGElement | null;
    const birdGroup = target.closest('.creature-bird') as SVGGElement | null;
    const blossomGroup = target.closest('.blossom-group') as SVGGElement | null;

    if (birdGroup) {
      // Find the creature for this element
      const birdCreature = creatures.find(c => c.element === birdGroup);
      if (birdCreature) {
        scaredBirdFly(birdCreature);
      }
      e.stopPropagation();
      return;
    }

    if (branchGroup) {
      shakeBranch(branchGroup);
      e.stopPropagation();
      return;
    }

    if (blossomGroup) {
      // Shake the blossom and drop a petal
      blossomGroup.classList.add('shake');
      const transform = blossomGroup.getAttribute('transform') || '';
      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match && onPetalDrop) {
        onPetalDrop(parseFloat(match[1]), parseFloat(match[2]), 1);
      }
      setTimeout(() => blossomGroup.classList.remove('shake'), 600);
      e.stopPropagation();
      return;
    }

    // Click on sky area (above ground) — wind gust
    const svgRect = scene.getBoundingClientRect();
    const svgY = (e.clientY - svgRect.top) / svgRect.height * 600;
    if (svgY < 540) {
      triggerWindGust();
    }
  });
}

function triggerWindGust() {
  const treeLayer = document.getElementById('layer-tree');
  if (!treeLayer) return;

  treeLayer.classList.add('wind-gust');
  if (onWindGust) onWindGust();

  setTimeout(() => {
    treeLayer.classList.remove('wind-gust');
  }, 1000);
}
