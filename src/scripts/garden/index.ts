import { getVisitCount } from './visit-counter';
import { getStage, STAGES } from './constants';

export async function bootstrap() {
  const loader = document.getElementById('garden-loader');
  const sceneWrapper = document.getElementById('garden-scene-wrapper');
  const statsEl = document.getElementById('garden-stats');

  // Parallel dynamic imports for code splitting
  const [
    { renderTree },
    { renderCreatures, initWeather },
    { attachInteractions, setCreaturesRef, setWindGustCallback, setPetalDropCallback },
    { initPetalPool, collectLeafElements, startPhysics, setAmbientPetals, dropPetals, triggerWindBurst },
  ] = await Promise.all([
    import('./tree-renderer'),
    import('./ecosystem'),
    import('./interactions'),
    import('./paper-physics'),
  ]);

  const visits = getVisitCount();
  const stage = getStage(visits);

  // Render tree and get growth result
  const result = renderTree(visits);

  // Render creatures
  renderCreatures(result.creatures);

  // Init weather
  initWeather(visits);

  // Init petal system
  initPetalPool();
  collectLeafElements();

  // Enable ambient petals at stage 7+ (blooming)
  if (stage >= 7) {
    setAmbientPetals(true);
  }

  // Wire up interactions
  setCreaturesRef(result.creatures);
  setPetalDropCallback((x: number, y: number, count: number) => {
    dropPetals(x, y, count);
  });
  setWindGustCallback(() => {
    triggerWindBurst();
  });
  attachInteractions();

  // Start physics loop
  startPhysics();

  // Update stats
  const visitsEl = document.getElementById('garden-visits');
  const stageEl = document.getElementById('garden-stage');
  if (visitsEl) visitsEl.textContent = `visits: ${visits}`;
  if (stageEl) stageEl.textContent = `stage: ${STAGES[stage].label}`;

  // Reveal scene, hide loader
  if (sceneWrapper) sceneWrapper.classList.add('garden__scene--visible');
  if (statsEl) statsEl.classList.add('garden__stats--visible');
  if (loader) {
    loader.classList.add('garden-loader--done');
    setTimeout(() => loader.remove(), 500);
  }
}
