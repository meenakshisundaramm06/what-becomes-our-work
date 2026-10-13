import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sources } from './data/sources.js?graph-version=14';
import { categories } from './data/categories.js?graph-version=14';
import { concepts } from './data/concepts.js?graph-version=14';
import { relations } from './data/relations.js?graph-version=14';
import { routes } from './data/routes.js?graph-version=14';
import { views } from './data/views.js?graph-version=14';
import { createKnowledgeGraph } from './graph-model.js?graph-version=14';

const graph = createKnowledgeGraph({ sources, categories, concepts, relations, routes, view: views[0] });
const brandToken = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const typeColors = {
  'research-signal': brandToken('--color-graph-research'),
  shift: brandToken('--color-graph-shift'),
  'economic mechanism': brandToken('--color-graph-shift'),
  'production mechanism': brandToken('--color-graph-shift'),
  learning: brandToken('--color-graph-learning'),
  'failure-mode': brandToken('--color-graph-risk'),
  boundary: brandToken('--color-graph-boundary'),
  'governance-practice': brandToken('--color-graph-human'),
  'trade-off': brandToken('--color-graph-risk'),
  'human-work': brandToken('--color-graph-human'),
  'market condition': brandToken('--color-graph-human'),
  'highest-agency': brandToken('--color-graph-human')
};
const graphEdgeColor = brandToken('--color-graph-edge');
const graphEdgeActiveColor = brandToken('--color-graph-edge-active');

const elements = {
  canvas: document.getElementById('graphCanvas'),
  introEyebrow: document.getElementById('introEyebrow'),
  introTitle: document.getElementById('introTitle'),
  introLede: document.getElementById('introLede'),
  routeStart: document.getElementById('routeStart'),
  routeStartLabel: document.getElementById('routeStartLabel'),
  routeStartMeta: document.getElementById('routeStartMeta'),
  categoryList: document.getElementById('categoryList'),
  tooltip: document.getElementById('nodeTooltip'),
  tooltipType: document.getElementById('tooltipType'),
  tooltipTitle: document.getElementById('tooltipTitle'),
  tooltipClaim: document.getElementById('tooltipClaim'),
  tooltipMeta: document.getElementById('tooltipMeta'),
  detail: document.getElementById('detail'),
  detailKicker: document.getElementById('detailKicker'),
  detailTitle: document.getElementById('detailTitle'),
  detailClaim: document.getElementById('detailClaim'),
  detailBody: document.getElementById('detailBody'),
  sourceWrap: document.getElementById('sourceWrap'),
  related: document.getElementById('related'),
  routeNavigator: document.getElementById('routeNavigator'),
  routeProgress: document.getElementById('routeProgress'),
  routePrevious: document.getElementById('routePrevious'),
  routeNext: document.getElementById('routeNext'),
  routeMovement: document.getElementById('routeMovement'),
  routeMovementNumber: document.getElementById('routeMovementNumber'),
  routeMovementTitle: document.getElementById('routeMovementTitle')
};

function setText(element, value) { element.textContent = value; }
function renderIntroTitle(lines) {
  elements.introTitle.replaceChildren();
  lines.forEach((line, index) => {
    if (index) elements.introTitle.append(document.createElement('br'));
    const part = line.emphasis ? document.createElement('em') : document.createElement('span');
    part.textContent = line.text;
    elements.introTitle.append(part);
  });
}

setText(elements.introEyebrow, graph.view.eyebrow);
renderIntroTitle(graph.view.titleLines);
setText(elements.introLede, graph.view.lede);
const featuredRoute = graph.routeById.get(graph.view.featuredRouteId);
if (featuredRoute) {
  setText(elements.routeStartLabel, featuredRoute.name);
  setText(elements.routeStartMeta, `${featuredRoute.conceptIds.length} connected ideas`);
} else {
  elements.routeStart.hidden = true;
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
elements.canvas.append(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(brandToken('--color-canvas'), 0.025);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0.2, 0.6, 16.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 23;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.18;
controls.target.set(0, -0.2, 0);

const baselineCameraPosition = camera.position.clone();
const baselineCameraTarget = controls.target.clone();
const detailCameraPosition = new THREE.Vector3();
const detailCameraTarget = new THREE.Vector3();
const cameraCompositionPosition = new THREE.Vector3();
const cameraCompositionTarget = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const nodeWorldPosition = new THREE.Vector3();
const projectedNodePosition = new THREE.Vector3();
const compositionPreviewCamera = new THREE.PerspectiveCamera();
let isCameraComposing = false;
let isInteracting = false;
let hasManuallyDragged = false;
let autoRotateTimer = null;
let lastFrameTime = 0;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

scene.add(new THREE.HemisphereLight(brandToken('--brand-white'), brandToken('--brand-dark-blue'), 1.7));
const keyLight = new THREE.DirectionalLight(brandToken('--brand-sync-cyan'), 2.3);
keyLight.position.set(4, 7, 8);
scene.add(keyLight);
const rimLight = new THREE.PointLight(brandToken('--brand-blue'), 16, 18, 2);
rimLight.position.set(-4, -3, -4);
scene.add(rimLight);

const nodeGroup = new THREE.Group();
const relationGroup = new THREE.Group();
nodeGroup.rotation.set(-0.11, 0.16, 0);
relationGroup.rotation.copy(nodeGroup.rotation);
scene.add(relationGroup, nodeGroup);

const nodeMeshes = new Map();
const relationLines = new Map();
const positions = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedId = null;
let hoveredId = null;
let dragStart = null;
let didDrag = false;
let activeRoute = null;
const enabledCategoryIds = new Set(categories.map(category => category.id));

function stopAutoRotate() {
  controls.autoRotate = false;
  if (autoRotateTimer) window.clearTimeout(autoRotateTimer);
  autoRotateTimer = null;
}

function setDetailComposition() {
  baselineCameraPosition.copy(camera.position);
  baselineCameraTarget.copy(controls.target);
  const canvasBounds = elements.canvas.getBoundingClientRect();
  const isNarrowViewport = window.matchMedia('(max-width: 720px)').matches;
  if (isNarrowViewport || !canvasBounds.width) {
    detailCameraPosition.copy(baselineCameraPosition);
    detailCameraTarget.copy(baselineCameraTarget);
  } else {
    const laneWidth = elements.detail.getBoundingClientRect().width + 28;
    const safeLeft = 18;
    const safeRight = Math.max(safeLeft + 80, canvasBounds.width - laneWidth);
    const safeWidth = safeRight - safeLeft;
    const initialDistance = baselineCameraPosition.distanceTo(baselineCameraTarget);

    cameraOffset.copy(baselineCameraPosition).sub(baselineCameraTarget).normalize();
    compositionPreviewCamera.copy(camera);
    compositionPreviewCamera.position.copy(baselineCameraPosition);
    compositionPreviewCamera.lookAt(baselineCameraTarget);
    compositionPreviewCamera.updateMatrixWorld();
    let bounds = getProjectedGraphBounds(compositionPreviewCamera, canvasBounds.width);
    const distanceScale = Math.min(Math.max(bounds.width / safeWidth, 1), controls.maxDistance / initialDistance);
    detailCameraTarget.copy(baselineCameraTarget);
    detailCameraPosition.copy(detailCameraTarget).addScaledVector(cameraOffset, initialDistance * distanceScale);

    compositionPreviewCamera.position.copy(detailCameraPosition);
    compositionPreviewCamera.lookAt(detailCameraTarget);
    compositionPreviewCamera.updateMatrixWorld();
    bounds = getProjectedGraphBounds(compositionPreviewCamera, canvasBounds.width);

    const desiredCenter = (safeLeft + safeRight) / 2;
    const minimumShift = bounds.maxX - safeRight;
    const maximumShift = bounds.minX - safeLeft;
    const shiftPixels = bounds.width <= safeWidth
      ? THREE.MathUtils.clamp(bounds.centerX - desiredCenter, minimumShift, maximumShift)
      : minimumShift;
    const viewWidth = 2 * detailCameraPosition.distanceTo(detailCameraTarget) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    camera.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraForward, camera.up).normalize();
    detailCameraPosition.addScaledVector(cameraRight, shiftPixels * (viewWidth / canvasBounds.width));
    detailCameraTarget.addScaledVector(cameraRight, shiftPixels * (viewWidth / canvasBounds.width));
  }
  cameraCompositionPosition.copy(detailCameraPosition);
  cameraCompositionTarget.copy(detailCameraTarget);
  isCameraComposing = !reduceMotionQuery.matches;
}

function getProjectedGraphBounds(cameraToCheck, canvasWidth) {
  const nodePadding = 26;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const mesh of nodeMeshes.values()) {
    if (!mesh.visible) continue;
    mesh.getWorldPosition(nodeWorldPosition);
    projectedNodePosition.copy(nodeWorldPosition).project(cameraToCheck);
    const screenX = (projectedNodePosition.x * 0.5 + 0.5) * canvasWidth;
    minX = Math.min(minX, screenX - nodePadding);
    maxX = Math.max(maxX, screenX + nodePadding);
  }
  return { minX, maxX, width: maxX - minX, centerX: (minX + maxX) / 2 };
}

function restoreBaselineComposition() {
  cameraCompositionPosition.copy(baselineCameraPosition);
  cameraCompositionTarget.copy(baselineCameraTarget);
  isCameraComposing = !reduceMotionQuery.matches;
}

function resumeAutoRotateAfterIdle() {
  if (autoRotateTimer) window.clearTimeout(autoRotateTimer);
  if (hasManuallyDragged || selectedId || reduceMotionQuery.matches) return;
  autoRotateTimer = window.setTimeout(() => {
    if (hasManuallyDragged || selectedId || isInteracting || isCameraComposing) {
      if (!hasManuallyDragged && !selectedId) resumeAutoRotateAfterIdle();
      return;
    }
    controls.autoRotate = true;
  }, 1200);
}

function categoryCount(categoryId) {
  return graph.visibleConcepts.filter(concept => concept.categoryId === categoryId).length;
}

function renderCategories() {
  elements.categoryList.replaceChildren();
  categories.filter(category => categoryCount(category.id) > 0).forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-toggle';
    button.type = 'button';
    button.dataset.categoryId = category.id;
    button.setAttribute('aria-pressed', String(enabledCategoryIds.has(category.id)));
    button.style.setProperty('--category-color', `var(${category.colorToken})`);
    const swatch = document.createElement('span');
    swatch.className = 'category-swatch';
    const name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = category.name;
    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = String(categoryCount(category.id));
    button.append(swatch, name, count);
    button.addEventListener('click', () => toggleCategory(category.id));
    elements.categoryList.append(button);
  });
}

function toggleCategory(categoryId) {
  if (activeRoute) endRoute();
  if (enabledCategoryIds.has(categoryId)) enabledCategoryIds.delete(categoryId);
  else enabledCategoryIds.add(categoryId);
  if (selectedId && !enabledCategoryIds.has(graph.conceptById.get(selectedId).categoryId)) clearSelection();
  hideTooltip();
  updateVisibility();
  renderCategories();
}

function renderRouteNavigator() {
  const route = activeRoute && graph.routeById.get(activeRoute.id);
  const isActive = Boolean(route);
  elements.routeNavigator.hidden = !isActive;
  elements.routeStart.setAttribute('aria-expanded', String(isActive));
  elements.routeStart.dataset.state = isActive ? 'active' : 'idle';
  elements.routeMovement.hidden = !route;
  if (!route) return;

  const step = activeRoute.index + 1;
  const conceptId = route.conceptIds[activeRoute.index];
  const movementIndex = route.movements.findIndex(movement => movement.conceptIds.includes(conceptId));
  const movement = route.movements[movementIndex];
  setText(elements.routeProgress, `${String(step).padStart(2, '0')} / ${String(route.conceptIds.length).padStart(2, '0')}`);
  setText(elements.routeMovementNumber, `Movement ${movementIndex + 1} / ${route.movements.length}`);
  setText(elements.routeMovementTitle, movement.name);
  elements.routeProgress.setAttribute('aria-label', `${route.name}, movement ${movementIndex + 1}, idea ${step} of ${route.conceptIds.length}`);
  elements.routePrevious.disabled = activeRoute.index === 0;
  elements.routeNext.disabled = step === route.conceptIds.length;
}

function startRoute(routeId) {
  const route = graph.routeById.get(routeId);
  if (!route) return;
  route.conceptIds.forEach(id => enabledCategoryIds.add(graph.conceptById.get(id).categoryId));
  updateVisibility();
  renderCategories();
  activeRoute = { id: routeId, index: 0 };
  renderRouteNavigator();
  selectConcept(route.conceptIds[0], { fromRoute: true });
}

function moveRoute(direction) {
  if (!activeRoute) return;
  const route = graph.routeById.get(activeRoute.id);
  const nextIndex = activeRoute.index + direction;
  if (nextIndex < 0) return;
  if (nextIndex >= route.conceptIds.length) {
    endRoute();
    return;
  }
  activeRoute.index = nextIndex;
  renderRouteNavigator();
  selectConcept(route.conceptIds[nextIndex], { fromRoute: true });
}

function endRoute() {
  activeRoute = null;
  renderRouteNavigator();
}

function updateVisibility() {
  for (const [id, mesh] of nodeMeshes) mesh.visible = enabledCategoryIds.has(graph.conceptById.get(id).categoryId);
  for (const line of relationLines.values()) {
    const { from, to } = line.userData.relation;
    line.visible = nodeMeshes.get(from).visible && nodeMeshes.get(to).visible;
  }
}

function hideTooltip() {
  elements.tooltip.classList.remove('is-visible');
  elements.tooltip.setAttribute('aria-hidden', 'true');
}

function showTooltip(id, event) {
  const concept = graph.conceptById.get(id);
  const relationCount = graph.neighborsById.get(id).length;
  setText(elements.tooltipType, concept.type.replaceAll('-', ' '));
  setText(elements.tooltipTitle, concept.name);
  setText(elements.tooltipClaim, concept.claim);
  setText(elements.tooltipMeta, `${relationCount} connected ${relationCount === 1 ? 'idea' : 'ideas'} · click to read`);
  const canvasBounds = elements.canvas.getBoundingClientRect();
  const constellationBounds = elements.canvas.parentElement.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - canvasBounds.left + 18, 14), canvasBounds.width - 286);
  const y = Math.min(Math.max(event.clientY - canvasBounds.top + 18, 14), canvasBounds.height - 190);
  elements.tooltip.style.transform = `translate(${canvasBounds.left - constellationBounds.left + x}px, ${canvasBounds.top - constellationBounds.top + y}px)`;
  elements.tooltip.classList.add('is-visible');
  elements.tooltip.setAttribute('aria-hidden', 'false');
}

function verticalMapPosition(index, total) {
  const progress = total === 1 ? 0.5 : index / (total - 1);
  const angle = index * 2.17 + 0.45;
  const radius = 0.6 + Math.sin(Math.PI * progress) * 2.05;
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    (0.5 - progress) * 8.5,
    Math.sin(angle) * radius * 1.35 + (0.5 - progress) * 0.95
  );
}

function createNode(concept, index) {
  const degree = graph.neighborsById.get(concept.id).length;
  const radius = 0.23 + Math.min(degree, 5) * 0.035;
  const material = new THREE.MeshPhysicalMaterial({ color: typeColors[concept.type], roughness: 0.32, metalness: 0.08, clearcoat: 0.28, clearcoatRoughness: 0.18, transparent: true, opacity: 0.94 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
  mesh.position.copy(verticalMapPosition(index, graph.visibleConcepts.length));
  mesh.userData = { id: concept.id, baseRadius: radius, phase: index * 0.87 };
  positions.set(concept.id, mesh.position.clone());
  nodeMeshes.set(concept.id, mesh);
  nodeGroup.add(mesh);
}

function createRelation(relation) {
  const points = [positions.get(relation.from), positions.get(relation.to)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: graphEdgeColor, transparent: true, opacity: 0.4 });
  const line = new THREE.Line(geometry, material);
  line.userData = { relation };
  relationLines.set(relation.id, line);
  relationGroup.add(line);
}

graph.visibleConcepts.forEach(createNode);
graph.visibleRelations.forEach(createRelation);
renderCategories();

function updateRelationLines() {
  for (const line of relationLines.values()) {
    const { relation } = line.userData;
    const position = line.geometry.attributes.position;
    position.setXYZ(0, nodeMeshes.get(relation.from).position.x, nodeMeshes.get(relation.from).position.y, nodeMeshes.get(relation.from).position.z);
    position.setXYZ(1, nodeMeshes.get(relation.to).position.x, nodeMeshes.get(relation.to).position.y, nodeMeshes.get(relation.to).position.z);
    position.needsUpdate = true;
  }
}

function clearSelection() {
  const hadSelection = selectedId !== null;
  selectedId = null;
  document.body.classList.remove('has-detail');
  elements.detail.classList.remove('is-open');
  if (hadSelection) restoreBaselineComposition();
  for (const mesh of nodeMeshes.values()) mesh.material.opacity = 0.9;
  for (const line of relationLines.values()) {
    line.material.color.set(graphEdgeColor);
    line.material.opacity = 0.4;
  }
  resumeAutoRotateAfterIdle();
}

function appendSource(source) {
  const link = document.createElement('a');
  link.className = 'source';
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.href = source.url;
  link.textContent = `${source.author} — ${source.title}`;
  elements.sourceWrap.append(link);
}

function selectConcept(id, { fromRoute = false } = {}) {
  if (activeRoute && !fromRoute) endRoute();
  const isOpeningDetail = selectedId === null;
  selectedId = id;
  const concept = graph.conceptById.get(id);
  const neighbors = graph.neighborsById.get(id);
  const relatedIds = new Set(neighbors.map(neighbor => neighbor.id));

  for (const [nodeId, mesh] of nodeMeshes) mesh.material.opacity = nodeId === id || relatedIds.has(nodeId) ? 1 : 0.28;
  for (const line of relationLines.values()) {
    const active = line.userData.relation.from === id || line.userData.relation.to === id;
    line.material.color.set(active ? graphEdgeActiveColor : graphEdgeColor);
    line.material.opacity = active ? 0.95 : 0.12;
  }

  setText(elements.detailKicker, concept.type.replaceAll('-', ' '));
  setText(elements.detailTitle, concept.name);
  setText(elements.detailClaim, concept.claim);
  setText(elements.detailBody, concept.summary);
  elements.sourceWrap.replaceChildren();
  concept.sources.map(sourceId => graph.sourceById.get(sourceId)).forEach(appendSource);
  elements.related.replaceChildren();
  neighbors.forEach(({ id: neighborId, relation, direction }) => {
    const neighbor = graph.conceptById.get(neighborId);
    const button = document.createElement('button');
    const relationText = direction === 'outgoing' ? relation.type.replaceAll('-', ' ') : `is ${relation.type.replaceAll('-', ' ')} by`;
    button.className = 'related-button';
    button.type = 'button';
    button.append(Object.assign(document.createElement('span'), { textContent: relationText }), document.createTextNode(neighbor.name));
    button.addEventListener('click', () => selectConcept(neighborId));
    elements.related.append(button);
  });
  elements.detail.classList.add('is-open');
  document.body.classList.add('has-detail');
  stopAutoRotate();
  if (isOpeningDetail) setDetailComposition();
}

function updatePointer(event) {
  const box = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
  pointer.y = -((event.clientY - box.top) / box.height) * 2 + 1;
}

function findHit(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects([...nodeMeshes.values()].filter(mesh => mesh.visible), false)[0]?.object;
}

renderer.domElement.addEventListener('pointermove', event => {
  if (dragStart && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 6) {
    didDrag = true;
    hasManuallyDragged = true;
  }
  const hit = findHit(event);
  const id = hit?.userData.id ?? null;
  if (id) showTooltip(id, event);
  else hideTooltip();
  if (hoveredId === id) return;
  hoveredId = id;
  renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
});
renderer.domElement.addEventListener('pointerdown', event => {
  dragStart = { x: event.clientX, y: event.clientY };
  didDrag = false;
  stopAutoRotate();
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointerup', event => {
  dragStart = null;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointerleave', hideTooltip);
renderer.domElement.addEventListener('click', event => {
  if (didDrag) return;
  const hit = findHit(event);
  if (hit) selectConcept(hit.userData.id);
  else hideTooltip();
});

elements.routeStart.addEventListener('click', () => startRoute(graph.view.featuredRouteId));
elements.routePrevious.addEventListener('click', () => moveRoute(-1));
elements.routeNext.addEventListener('click', () => moveRoute(1));
document.addEventListener('keydown', event => {
  if (!activeRoute || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveRoute(1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveRoute(-1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    endRoute();
    clearSelection();
  }
});

controls.addEventListener('start', () => {
  isInteracting = true;
  stopAutoRotate();
});
controls.addEventListener('end', () => {
  isInteracting = false;
  if (!selectedId) resumeAutoRotateAfterIdle();
});

reduceMotionQuery.addEventListener('change', event => {
  if (event.matches) {
    isCameraComposing = false;
    stopAutoRotate();
  } else if (!selectedId && !hasManuallyDragged) {
    resumeAutoRotateAfterIdle();
  }
});

function resize() {
  const { width, height } = elements.canvas.getBoundingClientRect();
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(elements.canvas);
resize();

function animate(time = 0) {
  const deltaSeconds = Math.min((time - lastFrameTime) / 1000 || 0, 0.05);
  lastFrameTime = time;
  const nodeSmoothing = 1 - Math.exp(-16 * deltaSeconds);
  const cameraSmoothing = 1 - Math.exp(-10 * deltaSeconds);
  for (const mesh of nodeMeshes.values()) {
    const isHovered = mesh.userData.id === hoveredId;
    const isSelected = mesh.userData.id === selectedId;
    const scale = isHovered || isSelected ? 1.24 : 1;
    const nextScale = mesh.scale.x + (scale - mesh.scale.x) * nodeSmoothing;
    mesh.scale.setScalar(nextScale);
  }
  updateRelationLines();
  controls.update();
  if (isCameraComposing && !isInteracting && !reduceMotionQuery.matches) {
    camera.position.lerp(cameraCompositionPosition, cameraSmoothing);
    controls.target.lerp(cameraCompositionTarget, cameraSmoothing);
    if (camera.position.distanceToSquared(cameraCompositionPosition) < 0.0001 && controls.target.distanceToSquared(cameraCompositionTarget) < 0.0001) {
      camera.position.copy(cameraCompositionPosition);
      controls.target.copy(cameraCompositionTarget);
      isCameraComposing = false;
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

document.getElementById('closeButton').addEventListener('click', () => {
  endRoute();
  clearSelection();
});
