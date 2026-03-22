export interface GardenData {
  visits: number;
  firstVisit: number;
  lastVisit: number;
}

export interface Branch {
  x: number;
  y: number;
  angle: number;
  length: number;
  thickness: number;
  depth: number;
  children: Branch[];
  leaves: LeafNode[];
  blossoms: BlossomNode[];
  element?: SVGGElement;
}

export interface LeafNode {
  x: number;
  y: number;
  angle: number;
  scale: number;
  element?: SVGGElement;
}

export interface BlossomNode {
  x: number;
  y: number;
  scale: number;
  element?: SVGGElement;
}

export interface Creature {
  type: 'bird' | 'squirrel' | 'insect' | 'nest';
  x: number;
  y: number;
  scale: number;
  branchRef?: Branch;
  element?: SVGGElement;
  state: 'idle' | 'active' | 'fleeing';
}

export interface WeatherState {
  clouds: CloudNode[];
  raining: boolean;
  lightning: boolean;
}

export interface CloudNode {
  x: number;
  y: number;
  scale: number;
  speed: number;
  element?: SVGGElement;
}

export interface FallingPetal {
  x: number;
  y: number;
  rotation: number;
  fallSpeed: number;
  driftFreq: number;
  driftAmp: number;
  rotSpeed: number;
  element?: SVGGElement;
  active: boolean;
}

export interface GrowthResult {
  tree: Branch;
  creatures: Creature[];
  stage: number;
}

export type SeededRandom = () => number;
