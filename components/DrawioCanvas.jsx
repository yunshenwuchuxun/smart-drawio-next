'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from '@/lib/debounce';
import { createConfigureMessage } from '@/lib/drawio-styles';

const DEFAULT_DRAWIO_ORIGIN = 'https://embed.diagrams.net';
const DRAWIO_ORIGIN = process.env.NEXT_PUBLIC_DRAWIO_ORIGIN || DEFAULT_DRAWIO_ORIGIN;

function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function isValidXml(xml) {
  if (!xml || typeof xml !== 'string') return false;
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return !doc.querySelector('parsererror');
  } catch {
    return false;
  }
}

const DRAWIO_TARGET_ORIGIN = normalizeOrigin(DRAWIO_ORIGIN) || DEFAULT_DRAWIO_ORIGIN;
const ALLOWED_DRAWIO_ORIGINS = new Set([
  DRAWIO_TARGET_ORIGIN,
  'https://embed.diagrams.net',
  'https://app.diagrams.net',
  'https://draw.io',
  'https://www.draw.io',
]);

function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function DrawioCanvas({ elements, xml, onXmlChange }) {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const isFirstLoad = useRef(true);
  const cssInjected = useRef(false);
  const lastLoadedXmlRef = useRef(null);

  // Convert JSON elements to draw.io XML format
  const convertToDrawioXML = useCallback((elements) => {
    if (!elements || elements.length === 0) {
      return `<mxfile><diagram id="empty" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
    }

    let cellId = 2;
    let cells = '';

    elements.forEach(el => {
      const id = cellId++;

      if (el.type === 'rectangle') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 60}" as="geometry"/></mxCell>`;
      } else if (el.type === 'ellipse') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 80}" as="geometry"/></mxCell>`;
      } else if (el.type === 'diamond') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="rhombus;whiteSpace=wrap;html=1;fillColor=${el.backgroundColor || '#ffffff'};strokeColor=${el.strokeColor || '#000000'};" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 120}" height="${el.height || 80}" as="geometry"/></mxCell>`;
      } else if (el.type === 'text') {
        cells += `<mxCell id="${id}" value="${escapeXml(el.text)}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="${el.x}" y="${el.y}" width="${el.width || 100}" height="${el.height || 30}" as="geometry"/></mxCell>`;
      } else if (el.type === 'arrow') {
        const startX = el.x || 0;
        const startY = el.y || 0;
        const endX = startX + (el.width || 100);
        const endY = startY + (el.height || 0);
        cells += `<mxCell id="${id}" value="${escapeXml(el.label?.text)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${startX}" y="${startY}" as="sourcePoint"/><mxPoint x="${endX}" y="${endY}" as="targetPoint"/></mxGeometry></mxCell>`;
      }
    });

    return `<mxfile><diagram id="generated" name="Page-1"><mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}</root></mxGraphModel></diagram></mxfile>`;
  }, []);

  // Load diagram into draw.io iframe (internal)
  const loadDiagramImmediate = useCallback((xml) => {
    if (!xml) return;
    lastLoadedXmlRef.current = xml;

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          action: 'load',
          xml: xml,
          autosave: 1
        }),
        DRAWIO_TARGET_ORIGIN
      );

      // After programmatic XML loads, draw.io steals keyboard focus to the
      // cross-origin iframe, which prevents app-level Ctrl+Z/Y from firing.
      // Reclaim focus so undo/redo shortcuts keep working.
      setTimeout(() => {
        if (document.activeElement === iframeRef.current) {
          iframeRef.current.blur();
        }
      }, 200);
    }
  }, []);

  // Debounced load for subsequent updates
  const loadDiagramDebounced = useMemo(
    () => debounce((xml) => loadDiagramImmediate(xml), 300),
    [loadDiagramImmediate]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => loadDiagramDebounced.cancel();
  }, [loadDiagramDebounced]);

  // Inject CSS styles into draw.io iframe (best-effort, requires configure=1 URL param)
  const injectStyles = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && !cssInjected.current) {
      try {
        const isDark = document.documentElement.dataset.theme === 'dark';
        iframeRef.current.contentWindow.postMessage(
          createConfigureMessage(isDark),
          DRAWIO_TARGET_ORIGIN
        );
        cssInjected.current = true;
      } catch (e) {
        // CSS injection is best-effort; draw.io works fine without it
      }
    }
  }, []);

  // Listen for messages from draw.io iframe
  useEffect(() => {
    const handleMessage = (event) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) {
        return;
      }

      if (!ALLOWED_DRAWIO_ORIGINS.has(event.origin)) {
        return;
      }

      if (event.data && event.data.length > 0) {
        try {
          const msg = JSON.parse(event.data);

          // Handle both 'init' and 'ready' events (draw.io uses 'init' in embed mode)
          if (msg.event === 'init' || msg.event === 'ready') {
            setIsReady(true);
            // Inject CSS styles after init
            injectStyles();
          } else if (msg.event === 'save' || msg.event === 'autosave') {
            if (msg.xml) {
              lastLoadedXmlRef.current = msg.xml;
            }
            if (onXmlChange && msg.xml) {
              onXmlChange(msg.xml);
            }
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onXmlChange, injectStyles]);

  // Fallback: force ready state after timeout if init event doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        console.warn('Draw.io init timeout, forcing ready state');
        setIsReady(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isReady]);

  // Load diagram when xml or elements change
  useEffect(() => {
    if (isReady) {
      let diagramXml;

      if (xml) {
        diagramXml = xml;
      } else if (elements && elements.length > 0) {
        diagramXml = convertToDrawioXML(elements);
      } else {
        diagramXml = convertToDrawioXML([]);
      }

      if (diagramXml && diagramXml === lastLoadedXmlRef.current) {
        return;
      }

      // Validation gate: reject malformed XML before sending to draw.io
      if (diagramXml && !isValidXml(diagramXml)) {
        console.warn('[DrawioCanvas] Rejected invalid XML, skipping load');
        return;
      }

      // First load: immediate, subsequent: debounced
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        loadDiagramImmediate(diagramXml);
      } else {
        loadDiagramDebounced(diagramXml);
      }
    }
  }, [xml, elements, isReady, loadDiagramImmediate, loadDiagramDebounced, convertToDrawioXML]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src="https://embed.diagrams.net/?embed=1&proto=json&ui=min&modified=0&noSaveBtn=1&noExitBtn=1&saveAndExit=0"
        className="w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
