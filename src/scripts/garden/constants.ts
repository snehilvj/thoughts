// Scene dimensions (SVG viewBox)
export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const GROUND_Y = 560;
export const TREE_BASE_X = 400;
export const TREE_BASE_Y = GROUND_Y;

// Growth stage thresholds
export const STAGES = [
  { minVisits: 0, label: 'seed' },
  { minVisits: 3, label: 'sprout' },
  { minVisits: 11, label: 'sapling' },
  { minVisits: 21, label: 'young' },
  { minVisits: 31, label: 'growing' },
  { minVisits: 41, label: 'adolescent' },
  { minVisits: 51, label: 'maturing' },
  { minVisits: 61, label: 'blooming' },
  { minVisits: 71, label: 'full bloom' },
  { minVisits: 86, label: 'mature' },
  { minVisits: 100, label: 'eternal' },
] as const;

export function getStage(visits: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (visits >= STAGES[i].minVisits) return i;
  }
  return 0;
}

// Tree generation parameters per stage
export const TREE_PARAMS = [
  // stage 0: seed
  { trunkHeight: 0, trunkThickness: 0, maxDepth: 0, branchFactor: 0, leafChance: 0, blossomChance: 0 },
  // stage 1: sprout
  { trunkHeight: 40, trunkThickness: 4, maxDepth: 1, branchFactor: 0.6, leafChance: 0.3, blossomChance: 0 },
  // stage 2: sapling
  { trunkHeight: 70, trunkThickness: 6, maxDepth: 2, branchFactor: 0.65, leafChance: 0.4, blossomChance: 0 },
  // stage 3: young
  { trunkHeight: 110, trunkThickness: 8, maxDepth: 3, branchFactor: 0.68, leafChance: 0.5, blossomChance: 0 },
  // stage 4: growing
  { trunkHeight: 150, trunkThickness: 11, maxDepth: 3, branchFactor: 0.7, leafChance: 0.6, blossomChance: 0 },
  // stage 5: adolescent
  { trunkHeight: 190, trunkThickness: 14, maxDepth: 4, branchFactor: 0.7, leafChance: 0.6, blossomChance: 0 },
  // stage 6: maturing
  { trunkHeight: 220, trunkThickness: 16, maxDepth: 4, branchFactor: 0.72, leafChance: 0.5, blossomChance: 0.2 },
  // stage 7: blooming
  { trunkHeight: 250, trunkThickness: 18, maxDepth: 5, branchFactor: 0.73, leafChance: 0.4, blossomChance: 0.4 },
  // stage 8: full bloom
  { trunkHeight: 280, trunkThickness: 20, maxDepth: 5, branchFactor: 0.74, leafChance: 0.35, blossomChance: 0.5 },
  // stage 9: mature
  { trunkHeight: 310, trunkThickness: 22, maxDepth: 5, branchFactor: 0.75, leafChance: 0.3, blossomChance: 0.55 },
  // stage 10: eternal
  { trunkHeight: 330, trunkThickness: 24, maxDepth: 6, branchFactor: 0.76, leafChance: 0.3, blossomChance: 0.6 },
];

// Ecosystem spawn thresholds: [minVisits, maxCount, spawnChancePerVisit]
export const ECOSYSTEM_CONFIG = {
  birds: { minVisits: 25, maxCount: 4, chance: 0.15 },
  squirrels: { minVisits: 40, maxCount: 2, chance: 0.10 },
  insects: { minVisits: 20, maxCount: 8, chance: 0.20 },
  nests: { minVisits: 45, maxCount: 3, chance: 0.08 },
  clouds: { minVisits: 0, maxCount: 5, chance: 0.30 },
} as const;

// Petal pool size
export const PETAL_POOL_SIZE = 20;

// SVG namespace
export const SVG_NS = 'http://www.w3.org/2000/svg';
