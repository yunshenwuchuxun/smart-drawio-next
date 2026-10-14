import { parseXml } from './xml-runtime.js';

/**
 * XML Repair module for truncated mxGraph XML
 * Detects and repairs missing closing tags in hierarchical order
 */

const TAG_HIERARCHY = ['root', 'mxGraphModel', 'diagram', 'mxfile'];
const WRAPPER_CLOSE_PATTERN = /^(<\/(?:root|mxGraphModel|diagram|mxfile)>\s*)*$/;

/**
 * Truncate XML at the last complete content element boundary.
 * Content elements in mxGraph XML end with '/>' (self-closing) or '</mxCell>'.
 * Discards any broken trailing element (e.g. mid-attribute truncation).
 * @param {string} xml
 * @returns {{ xml: string, truncated: boolean, removedLength: number }}
 */
export function truncateToLastCompleteElement(xml) {
  const selfCloseIdx = xml.lastIndexOf('/>');
  const cellCloseIdx = xml.lastIndexOf('</mxCell>');

  let cutPoint = -1;
  if (selfCloseIdx !== -1) cutPoint = selfCloseIdx + 2;
  if (cellCloseIdx !== -1) {
    const cellEnd = cellCloseIdx + '</mxCell>'.length;
    if (cellEnd > cutPoint) cutPoint = cellEnd;
  }

  if (cutPoint === -1 || cutPoint >= xml.length) {
    return { xml, truncated: false, removedLength: 0 };
  }

  // If tail is only whitespace + wrapper closing tags, nothing is broken
  const tail = xml.slice(cutPoint).trim();
  if (WRAPPER_CLOSE_PATTERN.test(tail)) {
    return { xml, truncated: false, removedLength: 0 };
  }

  return {
    xml: xml.slice(0, cutPoint),
    truncated: true,
    removedLength: xml.length - cutPoint,
  };
}

/**
 * Detect missing closing tags in XML
 * @param {string} xml - The XML string to check
 * @returns {{ isTruncated: boolean, missingTags: string[] }}
 */
export function detectMissingTags(xml) {
  if (!xml || typeof xml !== 'string') {
    return { isTruncated: false, missingTags: [] };
  }

  const missingTags = [];

  // This is a truncation hint, never a substitute for parsing. Counting each
  // wrapper also detects an unfinished later page after a complete first page.
  const content = xml.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/g, '');
  for (const tag of TAG_HIERARCHY) {
    const openings = [...content.matchAll(new RegExp(`<${tag}(?=[\\s/>])[^<>]*>`, 'g'))]
      .filter(([match]) => !/\/\s*>$/.test(match)).length;
    const closings = [...content.matchAll(new RegExp(`</${tag}\\s*>`, 'g'))].length;
    for (let count = closings; count < openings; count++) {
      missingTags.push(`</${tag}>`);
    }
  }

  return {
    isTruncated: missingTags.length > 0,
    missingTags
  };
}

/**
 * Repair truncated XML by appending missing closing tags
 * @param {string} xml - The truncated XML string
 * @returns {{ xml: string, repaired: boolean, addedTags: string[] }}
 */
export function repairXml(xml) {
  if (!xml || typeof xml !== 'string') {
    return { xml: xml || '', repaired: false, addedTags: [], elementsTruncated: false };
  }

  const { isTruncated } = detectMissingTags(xml);

  if (!isTruncated) {
    return { xml, repaired: false, addedTags: [], elementsTruncated: false };
  }

  // Strip incomplete trailing element before appending closing tags
  const { xml: cleanXml, truncated: elementsTruncated, removedLength } = truncateToLastCompleteElement(xml);
  const { missingTags: cleanMissingTags } = detectMissingTags(cleanXml);
  const repairedXml = cleanXml.trimEnd() + cleanMissingTags.join('');

  return {
    xml: repairedXml,
    repaired: true,
    addedTags: cleanMissingTags,
    elementsTruncated,
    removedLength,
  };
}

function elementChildren(node) {
  return Array.from(node.childNodes).filter((child) => child.nodeType === 1);
}

function hasDirectText(node) {
  return Array.from(node.childNodes).some((child) => (child.nodeType === 3 || child.nodeType === 4) && child.nodeValue.trim());
}

function invalidXml(code, message, context = {}) {
  return { isValid: false, error: message, diagnostics: [{ code, message, ...context }] };
}

function validateGraphModel(model, context) {
  const children = elementChildren(model);
  const roots = children.filter((child) => child.tagName === 'root');
  if (roots.length !== 1 || children.length !== 1 || hasDirectText(model)) {
    return invalidXml('INVALID_GRAPH_ROOT', 'Each mxGraphModel must contain exactly one root element.', context);
  }

  const root = roots[0];
  if (hasDirectText(root)) {
    return invalidXml('INVALID_GRAPH_ROOT', 'Graph root cannot contain text outside its cells.', context);
  }
  const cells = new Map();
  for (const entry of elementChildren(root)) {
    const wrapped = entry.tagName === 'object' || entry.tagName === 'UserObject';
    const wrappedCells = wrapped ? elementChildren(entry).filter((child) => child.tagName === 'mxCell') : [];
    const cell = entry.tagName === 'mxCell' ? entry : wrappedCells[0];
    if (!cell || (wrapped && wrappedCells.length !== 1)) {
      return invalidXml('INVALID_GRAPH_CELL', 'Graph root children must be mxCell elements or objects wrapping one mxCell.', context);
    }

    const cellId = cell.getAttribute('id');
    const wrapperId = wrapped && entry.getAttribute('id');
    if (cellId && wrapperId && cellId !== wrapperId) {
      return invalidXml('AMBIGUOUS_CELL_ID', 'An object wrapper and its mxCell cannot have different ids.', context);
    }
    const id = cellId || wrapperId;
    if (!id || !id.trim()) {
      return invalidXml('MISSING_CELL_ID', 'Every graph cell must have an id.', context);
    }
    if (cells.has(id)) {
      return invalidXml('DUPLICATE_CELL_ID', `Duplicate cell id "${id}" in the same page.`, { ...context, cellId: id });
    }
    cells.set(id, cell);
  }

  if (root.getElementsByTagName('mxCell').length !== cells.size) {
    return invalidXml('INVALID_GRAPH_CELL', 'mxCell elements must be direct children of root or its object wrappers.', context);
  }

  if (!cells.has('0') || !cells.has('1') || cells.get('0').hasAttribute('parent') || cells.get('1').getAttribute('parent') !== '0') {
    return invalidXml('INVALID_BASE_CELLS', 'Each page must contain cell 0 without a parent and cell 1 with parent="0".', context);
  }

  for (const [id, cell] of cells) {
    if (id !== '0' && !cell.getAttribute('parent')) {
      return invalidXml('MISSING_PARENT', `Cell "${id}" must reference a parent in its page.`, { ...context, cellId: id });
    }
    for (const attribute of ['parent', 'source', 'target']) {
      if (!cell.hasAttribute(attribute)) continue;
      const reference = cell.getAttribute(attribute);
      if (!reference || !cells.has(reference)) {
        return invalidXml('DANGLING_CELL_REFERENCE', `Cell "${id}" ${attribute} references missing cell "${reference}" in its page.`, { ...context, cellId: id, attribute });
      }
      if (attribute === 'parent' && reference === id) {
        return invalidXml('CYCLIC_PARENT', `Cell "${id}" cannot be its own parent.`, { ...context, cellId: id });
      }
    }

    const vertex = cell.getAttribute('vertex') === '1';
    const edge = cell.getAttribute('edge') === '1';
    if (vertex && edge) {
      return invalidXml('INVALID_CELL_TYPE', `Cell "${id}" cannot be both a vertex and an edge.`, { ...context, cellId: id });
    }
    const geometries = elementChildren(cell).filter((child) => child.tagName === 'mxGeometry');
    if ((vertex || edge) && (geometries.length !== 1 || geometries[0].getAttribute('as') !== 'geometry')) {
      return invalidXml('INVALID_CELL_GEOMETRY', `Cell "${id}" must contain one mxGeometry with as="geometry".`, { ...context, cellId: id });
    }
    for (const geometry of geometries) {
      for (const attribute of ['x', 'y', 'width', 'height']) {
        if (!geometry.hasAttribute(attribute)) continue;
        const value = geometry.getAttribute(attribute);
        if (!value.trim() || !Number.isFinite(Number(value)) || (['width', 'height'].includes(attribute) && Number(value) < 0)) {
          return invalidXml('INVALID_GEOMETRY_VALUE', `Cell "${id}" has invalid geometry ${attribute}.`, { ...context, cellId: id, attribute });
        }
      }
    }
  }

  // Parent containment must form a tree; source/target cycles are valid graphs.
  const completed = new Set();
  for (const id of cells.keys()) {
    const path = new Set();
    let current = id;
    while (current && !completed.has(current)) {
      if (path.has(current)) {
        return invalidXml('CYCLIC_PARENT', `Cell "${id}" has a cyclic parent chain.`, { ...context, cellId: id });
      }
      path.add(current);
      current = cells.get(current).getAttribute('parent');
    }
    for (const visited of path) completed.add(visited);
  }

  return { isValid: true, error: null, diagnostics: [], cellCount: cells.size };
}

/**
 * Validate XML syntax and mxGraph structure in browsers and Node.js.
 * Compressed diagram payloads are intentionally unsupported in this phase.
 * @param {string} xml - The XML string to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateRepairedXml(xml) {
  if (!xml || typeof xml !== 'string') {
    return invalidXml('EMPTY_XML', 'Empty or invalid XML');
  }
  if (/<!DOCTYPE\b/i.test(xml)) {
    return invalidXml('UNSUPPORTED_DOCTYPE', 'DOCTYPE declarations are not supported in draw.io XML.');
  }

  try {
    // xmldom tolerates some invalid XML characters and unescaped ampersands.
    // Saxes enforces XML well-formedness before we inspect the DOM structure.

    // xmldom can recover from malformed XML. Reject every diagnostic rather
    // than accepting the recovered tree, including in runtimes without DOM.
    const doc = parseXml(xml);
    const documentRoot = doc.documentElement;
    if (!documentRoot || !['mxfile', 'mxGraphModel'].includes(documentRoot.tagName)) {
      return invalidXml('INVALID_DOCUMENT_ROOT', 'Expected mxfile or mxGraphModel as the XML document root.');
    }

    if (documentRoot.tagName === 'mxGraphModel') {
      const validation = validateGraphModel(documentRoot, { pageIndex: 0 });
      return validation.isValid ? { ...validation, pageCount: 1 } : validation;
    }

    const diagrams = elementChildren(documentRoot);
    if (!diagrams.length || diagrams.some((element) => element.tagName !== 'diagram') || hasDirectText(documentRoot)) {
      return invalidXml('INVALID_DIAGRAMS', 'mxfile must contain one or more diagram elements.');
    }
    let cellCount = 0;
    for (const [pageIndex, diagram] of diagrams.entries()) {
      const context = { pageIndex, pageId: diagram.getAttribute('id') || null };
      const models = elementChildren(diagram);
      if (!models.length && diagram.textContent.trim()) {
        return invalidXml('UNSUPPORTED_COMPRESSED_DIAGRAM', 'Compressed diagram pages are not supported yet. Import uncompressed draw.io XML.', context);
      }
      if (models.length !== 1 || models[0].tagName !== 'mxGraphModel' || hasDirectText(diagram)) {
        return invalidXml('INVALID_DIAGRAM_MODEL', 'Each diagram must contain exactly one uncompressed mxGraphModel.', context);
      }
      const result = validateGraphModel(models[0], context);
      if (!result.isValid) return result;
      cellCount += result.cellCount;
    }

    return { isValid: true, error: null, diagnostics: [], pageCount: diagrams.length, cellCount };
  } catch (e) {
    return invalidXml('XML_PARSE_ERROR', e.message || 'XML parse error');
  }
}

/**
 * Attempt to repair and validate XML
 * @param {string} xml - The XML string to repair
 * @returns {{ xml: string, repaired: boolean, valid: boolean, error: string | null }}
 */
export function tryRepairXml(xml) {
  const { xml: repairedXml, repaired, addedTags, elementsTruncated, removedLength } = repairXml(xml);

  if (!repaired) {
    const validation = validateRepairedXml(xml);
    return {
      xml,
      repaired: false,
      valid: validation.isValid,
      error: validation.error,
      diagnostics: validation.diagnostics,
    };
  }

  const validation = validateRepairedXml(repairedXml);

  if (!validation.isValid) {
    return {
      xml,
      repaired: false,
      valid: false,
      error: `修复后仍无效: ${validation.error}`,
      diagnostics: validation.diagnostics,
    };
  }

  return {
    xml: repairedXml,
    repaired: true,
    valid: true,
    error: null,
    addedTags,
    elementsTruncated,
    removedLength,
    diagnostics: validation.diagnostics,
  };
}
