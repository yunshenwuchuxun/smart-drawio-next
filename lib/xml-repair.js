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

  for (const tag of TAG_HIERARCHY) {
    const hasOpen = xml.includes(`<${tag}`) && !xml.includes(`<${tag}/>`);
    const hasClose = xml.includes(`</${tag}>`);

    if (hasOpen && !hasClose) {
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

  const { isTruncated, missingTags } = detectMissingTags(xml);

  if (!isTruncated) {
    return { xml, repaired: false, addedTags: [], elementsTruncated: false };
  }

  // Strip incomplete trailing element before appending closing tags
  const { xml: cleanXml, truncated: elementsTruncated } = truncateToLastCompleteElement(xml);
  const repairedXml = cleanXml.trimEnd() + missingTags.join('');

  return {
    xml: repairedXml,
    repaired: true,
    addedTags: missingTags,
    elementsTruncated,
  };
}

/**
 * Validate repaired XML using DOMParser
 * @param {string} xml - The XML string to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateRepairedXml(xml) {
  if (!xml || typeof xml !== 'string') {
    return { isValid: false, error: 'Empty or invalid XML' };
  }

  if (typeof DOMParser === 'undefined') {
    return { isValid: true, error: null };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parseError = doc.querySelector('parsererror');

    if (parseError) {
      return {
        isValid: false,
        error: parseError.textContent || 'XML parse error'
      };
    }

    return { isValid: true, error: null };
  } catch (e) {
    return { isValid: false, error: e.message };
  }
}

/**
 * Attempt to repair and validate XML
 * @param {string} xml - The XML string to repair
 * @returns {{ xml: string, repaired: boolean, valid: boolean, error: string | null }}
 */
export function tryRepairXml(xml) {
  const { xml: repairedXml, repaired, addedTags } = repairXml(xml);

  if (!repaired) {
    const validation = validateRepairedXml(xml);
    return {
      xml,
      repaired: false,
      valid: validation.isValid,
      error: validation.error
    };
  }

  const validation = validateRepairedXml(repairedXml);

  if (!validation.isValid) {
    return {
      xml,
      repaired: false,
      valid: false,
      error: `修复后仍无效: ${validation.error}`
    };
  }

  return {
    xml: repairedXml,
    repaired: true,
    valid: true,
    error: null,
    addedTags
  };
}
