import type { Branch, LeafNode, BlossomNode, SeededRandom, GrowthResult, Creature } from './types';
import {
  SCENE_WIDTH, GROUND_Y, TREE_BASE_X, TREE_BASE_Y,
  TREE_PARAMS, ECOSYSTEM_CONFIG, SVG_NS, getStage,
} from './constants';

// Mulberry32 seeded PRNG
export function createRng(seed: number): SeededRandom {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Generate the tree structure deterministically from visit count
export function generateTree(visits: number): GrowthResult {
  const stage = getStage(visits);
  const params = TREE_PARAMS[stage];
  const rng = createRng(42); // Fixed seed for deterministic tree shape

  // Consume some RNG values based on visits to add variation
  for (let i = 0; i < visits; i++) rng();

  const rngTree = createRng(7777); // Separate seed for tree structure (always same shape for same stage)

  const tree = buildBranch(
    TREE_BASE_X,
    TREE_BASE_Y,
    -Math.PI / 2, // straight up
    params.trunkHeight,
    params.trunkThickness,
    0,
    params.maxDepth,
    params,
    rngTree,
  );

  // Generate creatures
  const creatures = generateCreatures(visits, stage, tree, rng);

  return { tree, creatures, stage };
}

function buildBranch(
  x: number, y: number,
  angle: number,
  length: number,
  thickness: number,
  depth: number,
  maxDepth: number,
  params: typeof TREE_PARAMS[number],
  rng: SeededRandom,
): Branch {
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  const branch: Branch = {
    x, y, angle, length, thickness, depth,
    children: [],
    leaves: [],
    blossoms: [],
  };

  if (depth >= maxDepth || length < 8) {
    // Terminal branch — add leaves and blossoms
    const leafCount = Math.floor(rng() * 3) + 1;
    for (let i = 0; i < leafCount; i++) {
      if (rng() < params.leafChance) {
        branch.leaves.push({
          x: endX + (rng() - 0.5) * 20,
          y: endY + (rng() - 0.5) * 15,
          angle: (rng() - 0.5) * Math.PI * 0.6,
          scale: 0.6 + rng() * 0.5,
        });
      }
    }
    if (params.blossomChance > 0) {
      const blossomCount = Math.floor(rng() * 3) + 1;
      for (let i = 0; i < blossomCount; i++) {
        if (rng() < params.blossomChance) {
          branch.blossoms.push({
            x: endX + (rng() - 0.5) * 25,
            y: endY + (rng() - 0.5) * 20,
            scale: 0.5 + rng() * 0.6,
          });
        }
      }
    }
    return branch;
  }

  // Branch splitting
  const childCount = depth === 0 ? (rng() > 0.4 ? 3 : 2) : (rng() > 0.5 ? 2 : 1);
  const spreadAngle = depth === 0 ? 0.7 : 0.5 + rng() * 0.3;

  for (let i = 0; i < childCount; i++) {
    const t = childCount === 1 ? 0 : (i / (childCount - 1)) * 2 - 1; // -1 to 1
    const childAngle = angle + t * spreadAngle + (rng() - 0.5) * 0.2;
    const childLength = length * (params.branchFactor + (rng() - 0.5) * 0.1);
    const childThickness = thickness * 0.65;

    branch.children.push(
      buildBranch(endX, endY, childAngle, childLength, childThickness, depth + 1, maxDepth, params, rng)
    );
  }

  // Some leaves along the branch at later depths
  if (depth >= 2 && rng() < params.leafChance * 0.5) {
    const midX = lerp(x, endX, 0.3 + rng() * 0.4);
    const midY = lerp(y, endY, 0.3 + rng() * 0.4);
    branch.leaves.push({
      x: midX + (rng() - 0.5) * 10,
      y: midY + (rng() - 0.5) * 10,
      angle: (rng() - 0.5) * Math.PI * 0.5,
      scale: 0.5 + rng() * 0.4,
    });
  }

  return branch;
}

function generateCreatures(visits: number, stage: number, tree: Branch, rng: SeededRandom): Creature[] {
  const creatures: Creature[] = [];
  const config = ECOSYSTEM_CONFIG;

  // Collect branch endpoints for creature placement
  const branchEnds: { x: number; y: number; branch: Branch }[] = [];
  collectBranchEnds(tree, branchEnds);

  // Birds
  if (visits >= config.birds.minVisits) {
    let count = 0;
    for (let v = config.birds.minVisits; v <= visits && count < config.birds.maxCount; v++) {
      if (rng() < config.birds.chance) count++;
    }
    for (let i = 0; i < count && i < branchEnds.length; i++) {
      const bp = branchEnds[Math.floor(rng() * branchEnds.length)];
      creatures.push({
        type: 'bird', x: bp.x, y: bp.y - 8, scale: 0.8 + rng() * 0.4,
        branchRef: bp.branch, state: 'idle',
      });
    }
  }

  // Squirrels (on trunk or thick branches)
  if (visits >= config.squirrels.minVisits) {
    let count = 0;
    for (let v = config.squirrels.minVisits; v <= visits && count < config.squirrels.maxCount; v++) {
      if (rng() < config.squirrels.chance) count++;
    }
    for (let i = 0; i < count; i++) {
      const trunkY = TREE_BASE_Y - (rng() * tree.length * 0.6 + tree.length * 0.2);
      creatures.push({
        type: 'squirrel', x: TREE_BASE_X + (rng() > 0.5 ? 1 : -1) * (tree.thickness * 0.3 + 3),
        y: trunkY, scale: 0.7 + rng() * 0.3, branchRef: tree, state: 'idle',
      });
    }
  }

  // Insects
  if (visits >= config.insects.minVisits) {
    let count = 0;
    for (let v = config.insects.minVisits; v <= visits && count < config.insects.maxCount; v++) {
      if (rng() < config.insects.chance) count++;
    }
    for (let i = 0; i < count && i < branchEnds.length; i++) {
      const bp = branchEnds[Math.floor(rng() * branchEnds.length)];
      creatures.push({
        type: 'insect', x: bp.x + (rng() - 0.5) * 30, y: bp.y + (rng() - 0.5) * 20,
        scale: 0.3 + rng() * 0.3, state: 'idle',
      });
    }
  }

  // Nests
  if (visits >= config.nests.minVisits) {
    let count = 0;
    for (let v = config.nests.minVisits; v <= visits && count < config.nests.maxCount; v++) {
      if (rng() < config.nests.chance) count++;
    }
    for (let i = 0; i < count && i < branchEnds.length; i++) {
      const idx = Math.floor(rng() * branchEnds.length);
      const bp = branchEnds[idx];
      creatures.push({
        type: 'nest', x: bp.x, y: bp.y, scale: 0.6 + rng() * 0.3,
        branchRef: bp.branch, state: 'idle',
      });
    }
  }

  return creatures;
}

function collectBranchEnds(branch: Branch, result: { x: number; y: number; branch: Branch }[]) {
  const endX = branch.x + Math.cos(branch.angle) * branch.length;
  const endY = branch.y + Math.sin(branch.angle) * branch.length;

  if (branch.children.length === 0) {
    result.push({ x: endX, y: endY, branch });
  } else {
    // Also add fork points
    if (branch.depth >= 1) {
      result.push({ x: endX, y: endY, branch });
    }
    for (const child of branch.children) {
      collectBranchEnds(child, result);
    }
  }
}

// ===================== SVG RENDERING =====================

function createSvgElement(tag: string, attrs: Record<string, string | number>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

// Render the seed (stage 0)
function renderSeed(layer: SVGGElement) {
  const g = createSvgElement('g', { class: 'seed-group' }) as SVGGElement;
  // Origami seed: two triangles forming a diamond
  const x = TREE_BASE_X;
  const y = GROUND_Y - 8;
  g.appendChild(createSvgElement('polygon', {
    points: `${x},${y - 12} ${x + 8},${y} ${x},${y + 4}`,
    fill: 'var(--garden-seed)',
  }));
  g.appendChild(createSvgElement('polygon', {
    points: `${x},${y - 12} ${x - 8},${y} ${x},${y + 4}`,
    fill: 'var(--garden-seed-fold)',
  }));
  // Fold crease
  g.appendChild(createSvgElement('line', {
    x1: x, y1: y - 12, x2: x, y2: y + 4,
    stroke: 'var(--garden-trunk-fold)', 'stroke-width': '0.5', opacity: '0.4',
  }));
  layer.appendChild(g);
}

// Render ground
function renderGround(layer: SVGGElement, stage: number) {
  const g = createSvgElement('g', {}) as SVGGElement;

  // Ground plane — geometric origami-style
  g.appendChild(createSvgElement('polygon', {
    points: `0,${GROUND_Y} ${SCENE_WIDTH},${GROUND_Y} ${SCENE_WIDTH},600 0,600`,
    fill: 'var(--garden-ground)',
  }));

  // Ground fold accent triangles
  const foldCount = 3 + stage;
  for (let i = 0; i < foldCount; i++) {
    const cx = (i + 0.5) * (SCENE_WIDTH / foldCount);
    const w = SCENE_WIDTH / foldCount * 0.6;
    g.appendChild(createSvgElement('polygon', {
      points: `${cx - w / 2},${GROUND_Y} ${cx + w / 2},${GROUND_Y} ${cx},${GROUND_Y + 15}`,
      fill: 'var(--garden-ground-accent)',
      opacity: '0.5',
    }));
  }

  // Grass tufts
  if (stage >= 1) {
    const grassCount = 4 + stage * 2;
    const rng = createRng(999);
    for (let i = 0; i < grassCount; i++) {
      const gx = rng() * SCENE_WIDTH;
      const h = 6 + rng() * 10;
      const lean = (rng() - 0.5) * 4;
      g.appendChild(createSvgElement('polygon', {
        points: `${gx - 2},${GROUND_Y} ${gx + lean},${GROUND_Y - h} ${gx + 2},${GROUND_Y}`,
        fill: 'var(--garden-grass)',
      }));
      g.appendChild(createSvgElement('polygon', {
        points: `${gx},${GROUND_Y} ${gx + lean},${GROUND_Y - h} ${gx + 2},${GROUND_Y}`,
        fill: 'var(--garden-grass-fold)',
      }));
    }
  }

  layer.appendChild(g);
}

// Render a single branch as an origami trapezoid
function renderBranch(branch: Branch, parentLayer: SVGGElement, delayIndex: { count: number }) {
  if (branch.length <= 0) return;

  const endX = branch.x + Math.cos(branch.angle) * branch.length;
  const endY = branch.y + Math.sin(branch.angle) * branch.length;

  const g = createSvgElement('g', {
    class: 'branch-group',
    style: `animation-delay: ${delayIndex.count * 0.05}s; transform-origin: ${branch.x}px ${branch.y}px;`,
  }) as SVGGElement;
  delayIndex.count++;

  // Branch as tapered parallelogram with fold
  const perpAngle = branch.angle + Math.PI / 2;
  const baseHalf = branch.thickness / 2;
  const tipHalf = branch.thickness * 0.35;

  const bx1 = branch.x + Math.cos(perpAngle) * baseHalf;
  const by1 = branch.y + Math.sin(perpAngle) * baseHalf;
  const bx2 = branch.x - Math.cos(perpAngle) * baseHalf;
  const by2 = branch.y - Math.sin(perpAngle) * baseHalf;
  const tx1 = endX + Math.cos(perpAngle) * tipHalf;
  const ty1 = endY + Math.sin(perpAngle) * tipHalf;
  const tx2 = endX - Math.cos(perpAngle) * tipHalf;
  const ty2 = endY - Math.sin(perpAngle) * tipHalf;

  // Center line for fold
  const midBx = (bx1 + bx2) / 2;
  const midBy = (by1 + by2) / 2;
  const midTx = (tx1 + tx2) / 2;
  const midTy = (ty1 + ty2) / 2;

  // Right face (lighter)
  g.appendChild(createSvgElement('polygon', {
    points: `${midBx},${midBy} ${bx1},${by1} ${tx1},${ty1} ${midTx},${midTy}`,
    fill: 'var(--garden-trunk)',
  }));
  // Left face (darker fold)
  g.appendChild(createSvgElement('polygon', {
    points: `${midBx},${midBy} ${bx2},${by2} ${tx2},${ty2} ${midTx},${midTy}`,
    fill: 'var(--garden-trunk-fold)',
  }));
  // Fold crease
  g.appendChild(createSvgElement('line', {
    x1: midBx, y1: midBy, x2: midTx, y2: midTy,
    stroke: 'var(--garden-trunk-highlight)', 'stroke-width': '0.3', opacity: '0.3',
  }));

  branch.element = g;
  parentLayer.appendChild(g);

  // Render leaves
  for (const leaf of branch.leaves) {
    renderLeaf(leaf, parentLayer, delayIndex);
  }

  // Render blossoms
  for (const blossom of branch.blossoms) {
    renderBlossom(blossom, parentLayer, delayIndex);
  }

  // Recurse children
  for (const child of branch.children) {
    renderBranch(child, parentLayer, delayIndex);
  }
}

// Render origami leaf (two-triangle diamond)
function renderLeaf(leaf: LeafNode, layer: SVGGElement, delayIndex: { count: number }) {
  const g = createSvgElement('g', {
    class: 'leaf-group',
    style: `animation-delay: ${delayIndex.count * 0.05}s`,
  }) as SVGGElement;
  delayIndex.count++;

  const s = leaf.scale * 12;
  const { x, y, angle } = leaf;

  // Rotate the leaf
  g.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle * 180 / Math.PI})`);

  // Right half
  g.appendChild(createSvgElement('polygon', {
    points: `0,${-s} ${s * 0.6},0 0,${s}`,
    fill: 'var(--garden-leaf)',
  }));
  // Left half (fold)
  g.appendChild(createSvgElement('polygon', {
    points: `0,${-s} ${-s * 0.5},0 0,${s}`,
    fill: 'var(--garden-leaf-fold)',
  }));
  // Fold crease
  g.appendChild(createSvgElement('line', {
    x1: 0, y1: -s, x2: 0, y2: s,
    stroke: 'var(--garden-trunk-fold)', 'stroke-width': '0.3', opacity: '0.3',
  }));

  leaf.element = g;
  layer.appendChild(g);
}

// Render origami blossom (5-petal radial)
function renderBlossom(blossom: BlossomNode, layer: SVGGElement, delayIndex: { count: number }) {
  const g = createSvgElement('g', {
    class: 'blossom-group',
    style: `animation-delay: ${delayIndex.count * 0.05}s`,
  }) as SVGGElement;
  delayIndex.count++;

  const s = blossom.scale * 8;
  g.setAttribute('transform', `translate(${blossom.x}, ${blossom.y})`);

  // 5 petals arranged radially
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const tipX = Math.cos(a) * s * 1.5;
    const tipY = Math.sin(a) * s * 1.5;
    const leftA = a - 0.4;
    const rightA = a + 0.4;
    const baseL = { x: Math.cos(leftA) * s * 0.4, y: Math.sin(leftA) * s * 0.4 };
    const baseR = { x: Math.cos(rightA) * s * 0.4, y: Math.sin(rightA) * s * 0.4 };

    // Right half of petal
    g.appendChild(createSvgElement('polygon', {
      points: `0,0 ${tipX},${tipY} ${baseR.x},${baseR.y}`,
      fill: 'var(--garden-blossom)',
    }));
    // Left half (fold)
    g.appendChild(createSvgElement('polygon', {
      points: `0,0 ${tipX},${tipY} ${baseL.x},${baseL.y}`,
      fill: 'var(--garden-blossom-fold)',
    }));
  }

  // Center dot
  g.appendChild(createSvgElement('circle', {
    cx: 0, cy: 0, r: s * 0.25,
    fill: 'var(--garden-blossom-center)',
  }));

  blossom.element = g;
  layer.appendChild(g);
}

// ===================== PUBLIC RENDER FUNCTION =====================

export function renderTree(visits: number): GrowthResult {
  const result = generateTree(visits);
  const { tree, stage } = result;

  const treeLayer = document.getElementById('layer-tree') as unknown as SVGGElement;
  const groundLayer = document.getElementById('layer-ground') as unknown as SVGGElement;

  if (!treeLayer || !groundLayer) return result;

  // Clear existing
  treeLayer.innerHTML = '';
  groundLayer.innerHTML = '';

  // Render ground
  renderGround(groundLayer, stage);

  // Render tree
  if (stage === 0) {
    renderSeed(treeLayer);
  } else {
    const delayIndex = { count: 0 };
    renderBranch(tree, treeLayer, delayIndex);
  }

  return result;
}
