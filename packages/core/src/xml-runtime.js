import { DOMParser as NodeDOMParser, XMLSerializer as NodeXMLSerializer } from '@xmldom/xmldom';
import { SaxesParser } from 'saxes';

/** Parse XML without installing browser DOM objects on the Node global. */
export function parseXml(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('XML must be a nonempty string.');
  if (/<!DOCTYPE\b/i.test(xml)) throw new Error('DOCTYPE declarations are not supported.');
  // Both browser DOMParser and xmldom recover from some malformed XML.
  new SaxesParser().write(xml).close();
  const NativeParser = globalThis.DOMParser;
  const parser = typeof NativeParser === 'function'
    ? new NativeParser()
    : new NodeDOMParser({ onError: (_level, message) => { throw new Error(message); } });
  const doc = parser.parseFromString(xml, 'application/xml');
  if (!doc.documentElement || doc.getElementsByTagName('parsererror').length) throw new Error('XML parse error.');
  return doc;
}

export function serializeXml(node) {
  const Serializer = typeof globalThis.XMLSerializer === 'function' ? globalThis.XMLSerializer : NodeXMLSerializer;
  return new Serializer().serializeToString(node);
}

export function createXmlParser() {
  return { parseFromString: parseXml };
}

export function createXmlSerializer() {
  return { serializeToString: serializeXml };
}

export function findElements(node, tagName, attributes = {}) {
  return Array.from(node.getElementsByTagName(tagName)).filter((element) =>
    Object.entries(attributes).every(([name, value]) => element.getAttribute(name) === value));
}

export function findElement(node, tagName, attributes = {}) {
  return findElements(node, tagName, attributes)[0] || null;
}

/** Transform each uncompressed page separately, preserving page-local ids. */
export function transformPages(xml, transform) {
  const doc = parseXml(xml);
  const models = findElements(doc, 'mxGraphModel');
  if (!models.length) throw new Error('No uncompressed graph models were found.');
  let modified = 0;
  let changed = false;
  const applied = [];
  for (const [pageIndex, model] of models.entries()) {
    const result = transform(serializeXml(model));
    if (result.error) throw new Error(result.error);
    modified += result.stats?.modified || 0;
    changed ||= result.changed ?? (result.stats?.modified > 0);
    if (result.applied) applied.push(...result.applied.map((entry) => ({ ...entry, pageIndex })));
    const replacement = parseXml(result.xml).documentElement;
    const imported = doc.importNode(replacement, true);
    if (model === doc.documentElement) doc.replaceChild(imported, model);
    else model.parentNode.replaceChild(imported, model);
  }
  return { xml: changed ? serializeXml(doc) : xml, error: null, changed, stats: { modified }, applied };
}
