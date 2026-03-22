import type { GardenData } from './types';

const STORAGE_KEY = 'thoughts-garden';

export function getGardenData(): GardenData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as GardenData;
    }
  } catch {
    // corrupted data, start fresh
  }
  return { visits: 0, firstVisit: Date.now(), lastVisit: 0 };
}

export function getVisitCount(): number {
  return getGardenData().visits;
}
