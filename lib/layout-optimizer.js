import { parseStyle, stringifyStyle } from './theme-engine';

// ── Constants ──────────────────────────────────────────────────────────
const LAYER_GAP = 100;
const NODE_GAP = 40;
const MARGIN = 40;
const GRID = 10;

function snap(v) {
  return Math.round(v / GRID) * GRID;
}

// ── 1. Extract Graph ───────────────────────────────────────────────────
function extractGraph(doc) {
  const vertices = new Map();
  const edges = [];
  const cells = doc.querySelectorAll('mxCell');

  for (const cell of cells) {
    if (cell.getAttribute('vertex') !== '1') continue;
    const geo = cell.querySelector('mxGeometry');
    if (!geo || geo.getAttribute('relative') === '1') continue;

    const x = parseFloat(geo.getAttribute('x')) || 0;
    const y = parseFloat(geo.getAttribute('y')) || 0;
    const w = parseFloat(geo.getAttribute('width')) || 80;
    const h = parseFloat(geo.getAttribute('height')) || 40;
    vertices.set(cell.getAttribute('id'), { id: cell.getAttribute('id'), cell, geo, x, y, w, h });
  }

  for (const cell of cells) {
    const src = cell.getAttribute('source');
    const tgt = cell.getAttribute('target');
    if (!src || !tgt) continue;
    if (src === tgt) continue; // skip self-loops
    if (!vertices.has(src) || !vertices.has(tgt)) continue;
    edges.push({ id: cell.getAttribute('id'), cell, sourceId: src, targetId: tgt });
  }

  return { vertices, edges };
}

// ── 2. Build Adjacency ─────────────────────────────────────────────────
function buildAdjacency(vertices, edges) {
  const children = new Map();
  const parents = new Map();

  for (const id of vertices.keys()) {
    children.set(id, new Set());
    parents.set(id, new Set());
  }

  for (const e of edges) {
    children.get(e.sourceId).add(e.targetId);
    parents.get(e.targetId).add(e.sourceId);
  }

  return { children, parents };
}

// ── 3. Assign Layers (longest-path BFS) ────────────────────────────────
function assignLayers(vertices, adj) {
  const { children, parents } = adj;
  const layer = new Map();

  // Find roots (inDegree === 0)
  const roots = [];
  for (const id of vertices.keys()) {
    if (parents.get(id).size === 0) roots.push(id);
  }
  // Fallback: pick lowest-inDegree vertex
  if (roots.length === 0) {
    let minDeg = Infinity;
    let minId = vertices.keys().next().value;
    for (const [id] of vertices) {
      const deg = parents.get(id).size;
      if (deg < minDeg) { minDeg = deg; minId = id; }
    }
    roots.push(minId);
  }

  for (const id of vertices.keys()) layer.set(id, 0);
  for (const r of roots) layer.set(r, 0);

  // BFS with bounded relaxation
  const queue = [...roots];
  const maxIter = vertices.size * 2;
  let iter = 0;

  while (queue.length > 0 && iter < maxIter) {
    iter++;
    const u = queue.shift();
    for (const v of children.get(u)) {
      const newLayer = layer.get(u) + 1;
      if (newLayer > layer.get(v)) {
        layer.set(v, newLayer);
        queue.push(v);
      }
    }
  }

  // Group into layer arrays
  let maxLayer = 0;
  for (const l of layer.values()) {
    if (l > maxLayer) maxLayer = l;
  }

  const layerArrays = [];
  for (let i = 0; i <= maxLayer; i++) layerArrays.push([]);
  for (const [id, l] of layer) {
    layerArrays[l].push(id);
  }

  return layerArrays;
}

// ── 4. Minimize Crossings (barycenter heuristic) ───────────────────────
function minimizeCrossings(layerArrays, adj) {
  const { children, parents } = adj;
  const SWEEPS = 4;

  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    // Down sweep
    for (let i = 0; i < layerArrays.length - 1; i++) {
      const upperPositions = new Map();
      layerArrays[i].forEach((id, pos) => upperPositions.set(id, pos));

      layerArrays[i + 1].sort((a, b) => {
        const parentsA = [...parents.get(a)].filter(p => upperPositions.has(p));
        const parentsB = [...parents.get(b)].filter(p => upperPositions.has(p));
        const baryA = parentsA.length > 0
          ? parentsA.reduce((sum, p) => sum + upperPositions.get(p), 0) / parentsA.length
          : Infinity;
        const baryB = parentsB.length > 0
          ? parentsB.reduce((sum, p) => sum + upperPositions.get(p), 0) / parentsB.length
          : Infinity;
        return baryA - baryB;
      });
    }

    // Up sweep
    for (let i = layerArrays.length - 1; i > 0; i--) {
      const lowerPositions = new Map();
      layerArrays[i].forEach((id, pos) => lowerPositions.set(id, pos));

      layerArrays[i - 1].sort((a, b) => {
        const childrenA = [...children.get(a)].filter(c => lowerPositions.has(c));
        const childrenB = [...children.get(b)].filter(c => lowerPositions.has(c));
        const baryA = childrenA.length > 0
          ? childrenA.reduce((sum, c) => sum + lowerPositions.get(c), 0) / childrenA.length
          : Infinity;
        const baryB = childrenB.length > 0
          ? childrenB.reduce((sum, c) => sum + lowerPositions.get(c), 0) / childrenB.length
          : Infinity;
        return baryA - baryB;
      });
    }
  }
}

// ── 5. Assign Coordinates ──────────────────────────────────────────────
function assignCoordinates(layerArrays, vertices) {
  // Compute width of each layer
  const layerWidths = layerArrays.map(layer => {
    let w = 0;
    for (const id of layer) {
      w += vertices.get(id).w;
    }
    w += (layer.length - 1) * NODE_GAP;
    return w;
  });

  const maxWidth = Math.max(...layerWidths, 0);

  let currentY = MARGIN;

  for (let i = 0; i < layerArrays.length; i++) {
    const layer = layerArrays[i];
    if (layer.length === 0) continue;

    // Max height in this layer
    let maxH = 0;
    for (const id of layer) {
      maxH = Math.max(maxH, vertices.get(id).h);
    }

    // Center this layer relative to widest layer
    const layerWidth = layerWidths[i];
    const startX = MARGIN + (maxWidth - layerWidth) / 2;

    let currentX = startX;
    for (const id of layer) {
      const v = vertices.get(id);
      v.x = snap(currentX);
      v.y = snap(currentY + (maxH - v.h) / 2);
      currentX += v.w + NODE_GAP;
    }

    currentY += maxH + LAYER_GAP;
  }

  return currentY; // bottom Y
}

// ── 6. Arrange Disconnected Nodes ──────────────────────────────────────
function arrangeDisconnectedNodes(vertices, connectedIds, mainBottomY) {
  const disconnected = [];
  for (const [id] of vertices) {
    if (!connectedIds.has(id)) disconnected.push(id);
  }

  if (disconnected.length === 0) return;

  const MAX_COLS = 4;
  let col = 0;
  let row = 0;
  let currentX = MARGIN;
  let currentY = mainBottomY + LAYER_GAP;
  let rowMaxH = 0;

  for (const id of disconnected) {
    const v = vertices.get(id);
    v.x = snap(currentX);
    v.y = snap(currentY);
    rowMaxH = Math.max(rowMaxH, v.h);

    col++;
    if (col >= MAX_COLS) {
      col = 0;
      row++;
      currentX = MARGIN;
      currentY += rowMaxH + NODE_GAP;
      rowMaxH = 0;
    } else {
      currentX += v.w + NODE_GAP;
    }
  }
}

// ── 7. Optimize Anchors (angle-based) ──────────────────────────────────
function angleToFace(angle, w, h) {
  // Corner angle determines face boundaries
  const cornerAngle = Math.atan2(h, w);
  const absAngle = Math.abs(angle);

  if (absAngle <= cornerAngle) return 'right';
  if (absAngle >= Math.PI - cornerAngle) return 'left';
  return angle > 0 ? 'bottom' : 'top';
}

function optimizeAnchors(edges, vertices) {
  // Group by (cellId, face, role) for fan-out distribution
  const buckets = new Map(); // key: "cellId:face:exit|entry"

  const edgeData = [];

  for (const e of edges) {
    const src = vertices.get(e.sourceId);
    const tgt = vertices.get(e.targetId);
    if (!src || !tgt) continue;

    const srcCX = src.x + src.w / 2;
    const srcCY = src.y + src.h / 2;
    const tgtCX = tgt.x + tgt.w / 2;
    const tgtCY = tgt.y + tgt.h / 2;

    const exitAngle = Math.atan2(tgtCY - srcCY, tgtCX - srcCX);
    const entryAngle = Math.atan2(srcCY - tgtCY, srcCX - tgtCX);

    const exitFace = angleToFace(exitAngle, src.w, src.h);
    const entryFace = angleToFace(entryAngle, tgt.w, tgt.h);

    const datum = { edge: e, exitFace, entryFace, srcCX, srcCY, tgtCX, tgtCY };
    edgeData.push(datum);

    // Bucket for exit
    const exitKey = `${e.sourceId}:${exitFace}:exit`;
    if (!buckets.has(exitKey)) buckets.set(exitKey, []);
    buckets.get(exitKey).push(datum);

    // Bucket for entry
    const entryKey = `${e.targetId}:${entryFace}:entry`;
    if (!buckets.has(entryKey)) buckets.set(entryKey, []);
    buckets.get(entryKey).push(datum);
  }

  // Sort each bucket by perpendicular position of the other end
  for (const [key, items] of buckets) {
    const [, face, role] = key.split(':');
    const isHorizontal = face === 'top' || face === 'bottom';

    items.sort((a, b) => {
      // Sort by position of the OTHER end perpendicular to the face
      if (role === 'exit') {
        return isHorizontal
          ? a.tgtCX - b.tgtCX
          : a.tgtCY - b.tgtCY;
      }
      return isHorizontal
        ? a.srcCX - b.srcCX
        : a.srcCY - b.srcCY;
    });
  }

  // Compute anchor positions per bucket
  const exitAnchors = new Map(); // key: edgeId → { exitX, exitY }
  const entryAnchors = new Map(); // key: edgeId → { entryX, entryY }

  for (const [key, items] of buckets) {
    const [, face, role] = key.split(':');
    const count = items.length;

    for (let i = 0; i < count; i++) {
      const spread = (i + 1) / (count + 1);
      const datum = items[i];
      const edgeId = datum.edge.id;

      if (role === 'exit') {
        const anchors = faceToAnchor(face, spread);
        exitAnchors.set(edgeId, anchors);
      } else {
        const anchors = faceToAnchor(face, spread);
        entryAnchors.set(edgeId, anchors);
      }
    }
  }

  // Apply anchors to edge cells
  let modified = 0;
  for (const datum of edgeData) {
    const { edge } = datum;
    const style = parseStyle(edge.cell.getAttribute('style') || '');

    const exit = exitAnchors.get(edge.id);
    const entry = entryAnchors.get(edge.id);

    if (exit) {
      style.exitX = String(exit.x);
      style.exitY = String(exit.y);
      delete style.exitDx;
      delete style.exitDy;
    }
    if (entry) {
      style.entryX = String(entry.x);
      style.entryY = String(entry.y);
      delete style.entryDx;
      delete style.entryDy;
    }

    edge.cell.setAttribute('style', stringifyStyle(style));

    // Remove intermediate waypoints
    const geo = edge.cell.querySelector('mxGeometry');
    if (geo) {
      const pointsArray = geo.querySelector('Array[as="points"]');
      if (pointsArray) {
        geo.removeChild(pointsArray);
      }
    }

    modified++;
  }

  return modified;
}

function faceToAnchor(face, spread) {
  switch (face) {
    case 'top':    return { x: spread, y: 0 };
    case 'bottom': return { x: spread, y: 1 };
    case 'left':   return { x: 0, y: spread };
    case 'right':  return { x: 1, y: spread };
    default:       return { x: 0.5, y: 0.5 };
  }
}

// ── 8. Apply Geometry Back to XML ──────────────────────────────────────
function applyGeometry(vertices) {
  for (const v of vertices.values()) {
    v.geo.setAttribute('x', String(v.x));
    v.geo.setAttribute('y', String(v.y));
  }
}

// ── Overlap Fix (lightweight) ───────────────────────────────────────────
const MAX_ROUNDS = 5;
const CONTAIN_EPS = 4;     // tolerance for visual containment check
const CONTAIN_MIN_COUNT = 2; // min contained nodes to mark as visual container

export function overlapFix(xml) {
  if (!xml || typeof xml !== 'string') {
    return { xml, changed: false, applied: [] };
  }

  let doc;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return { xml, changed: false, applied: [] };
    }
  } catch {
    return { xml, changed: false, applied: [] };
  }

  // Collect all vertex nodes with parent info
  const cells = doc.querySelectorAll('mxCell');
  const allNodes = [];

  for (const cell of cells) {
    if (cell.getAttribute('vertex') !== '1') continue;
    const geo = cell.querySelector('mxGeometry');
    if (!geo || geo.getAttribute('relative') === '1') continue;

    const w = parseFloat(geo.getAttribute('width'));
    const h = parseFloat(geo.getAttribute('height'));
    // Skip zero-dimension elements (labels, waypoints, points)
    if (!w || w <= 0 || !h || h <= 0) continue;

    allNodes.push({
      id: cell.getAttribute('id'),
      parentId: cell.getAttribute('parent') || '1',
      geo,
      x: parseFloat(geo.getAttribute('x')) || 0,
      y: parseFloat(geo.getAttribute('y')) || 0,
      w,
      h,
    });
  }

  // --- Container detection (two passes) ---

  // Pass 1: XML containers — vertices whose id appears as another vertex's parent
  const vertexIds = new Set(allNodes.map(n => n.id));
  const containerIds = new Set();
  for (const n of allNodes) {
    if (vertexIds.has(n.parentId)) {
      containerIds.add(n.parentId);
    }
  }

  // Pass 2: Visual containers — large shapes that geometrically contain ≥2
  // smaller siblings (handles LLM-generated flat XML without proper grouping)
  const siblingsByParent = new Map();
  for (const n of allNodes) {
    if (containerIds.has(n.id)) continue;
    if (!siblingsByParent.has(n.parentId)) siblingsByParent.set(n.parentId, []);
    siblingsByParent.get(n.parentId).push(n);
  }

  for (const [, siblings] of siblingsByParent) {
    for (const candidate of siblings) {
      let containedCount = 0;
      for (const other of siblings) {
        if (other === candidate) continue;
        if (candidate.w <= other.w || candidate.h <= other.h) continue;
        if (candidate.x - CONTAIN_EPS <= other.x &&
            candidate.y - CONTAIN_EPS <= other.y &&
            candidate.x + candidate.w + CONTAIN_EPS >= other.x + other.w &&
            candidate.y + candidate.h + CONTAIN_EPS >= other.y + other.h) {
          containedCount++;
        }
      }
      if (containedCount >= CONTAIN_MIN_COUNT) {
        containerIds.add(candidate.id);
      }
    }
  }

  // Group leaf (non-container) vertices by parent —
  // only siblings in the same coordinate space are compared
  const groups = new Map();
  for (const n of allNodes) {
    if (containerIds.has(n.id)) continue;
    if (!groups.has(n.parentId)) groups.set(n.parentId, []);
    groups.get(n.parentId).push(n);
  }

  let totalFixes = 0;

  for (const [, nodes] of groups) {
    if (nodes.length < 2) continue;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let fixedThisRound = 0;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          // Skip if one fully contains the other (even if neither was flagged
          // as a container — catches single-child wrappers)
          if ((a.x <= b.x && a.y <= b.y &&
               a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h) ||
              (b.x <= a.x && b.y <= a.y &&
               b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h)) {
            continue;
          }

          // Separation on each axis (negative = overlapping)
          const sepX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
          const sepY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);

          // Only fix true overlaps (both axes negative), not "too close"
          if (sepX >= 0 || sepY >= 0) continue;

          const penX = -sepX;
          const penY = -sepY;

          // Push apart along the axis with smaller penetration
          if (penX < penY) {
            if (a.x + a.w / 2 <= b.x + b.w / 2) {
              b.x = snap(a.x + a.w + GRID);
            } else {
              a.x = snap(b.x + b.w + GRID);
            }
          } else {
            if (a.y + a.h / 2 <= b.y + b.h / 2) {
              b.y = snap(a.y + a.h + GRID);
            } else {
              a.y = snap(b.y + b.h + GRID);
            }
          }

          fixedThisRound++;
        }
      }

      totalFixes += fixedThisRound;
      if (fixedThisRound === 0) break;
    }
  }

  if (totalFixes === 0) {
    return { xml, changed: false, applied: [] };
  }

  // Write back geometry for leaf nodes only
  for (const [, nodes] of groups) {
    for (const n of nodes) {
      n.geo.setAttribute('x', String(n.x));
      n.geo.setAttribute('y', String(n.y));
    }
  }

  const resultXml = new XMLSerializer().serializeToString(doc);
  return {
    xml: resultXml,
    changed: true,
    applied: [{ name: 'overlapFix', message: `已修复 ${totalFixes} 处重叠` }],
  };
}

// ── Main Entry (full re-layout) ────────────────────────────────────────
export function layoutOptimize(xml) {
  if (!xml || typeof xml !== 'string') {
    return { xml, changed: false, applied: [] };
  }

  let doc;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return { xml, changed: false, applied: [] };
    }
  } catch {
    return { xml, changed: false, applied: [] };
  }

  const { vertices, edges } = extractGraph(doc);

  if (vertices.size < 2) {
    return { xml, changed: false, applied: [] };
  }

  const applied = [];

  if (edges.length === 0) {
    // No edges: grid-arrange all vertices
    arrangeDisconnectedNodes(vertices, new Set(), MARGIN);
    applyGeometry(vertices);
    const resultXml = new XMLSerializer().serializeToString(doc);
    applied.push({ name: 'layout', message: `已重新排列 ${vertices.size} 个节点` });
    return { xml: resultXml, changed: true, applied };
  }

  // Build adjacency and run layout
  const adj = buildAdjacency(vertices, edges);
  const layerArrays = assignLayers(vertices, adj);
  minimizeCrossings(layerArrays, adj);
  const bottomY = assignCoordinates(layerArrays, vertices);

  // Collect connected vertex IDs
  const connectedIds = new Set();
  for (const layer of layerArrays) {
    for (const id of layer) connectedIds.add(id);
  }

  // Arrange any disconnected vertices below main layout
  arrangeDisconnectedNodes(vertices, connectedIds, bottomY);

  // Apply geometry updates
  applyGeometry(vertices);

  const totalLayers = layerArrays.filter(l => l.length > 0).length;
  applied.push({
    name: 'layout',
    message: `已重新排列 ${vertices.size} 个节点为 ${totalLayers} 层`,
  });

  // Optimize anchors
  const anchorCount = optimizeAnchors(edges, vertices);
  if (anchorCount > 0) {
    applied.push({
      name: 'anchors',
      message: `已优化 ${anchorCount} 条连线锚点`,
    });
  }

  const resultXml = new XMLSerializer().serializeToString(doc);
  return { xml: resultXml, changed: resultXml !== xml, applied };
}
