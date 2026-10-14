// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDiagram } from '../../packages/core/src/generate.js';
import { tricks } from '../../packages/core/src/drawing-tricks.js';

const XML = '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="中文节点" vertex="1" parent="1"><mxGeometry x="0" y="0" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const config = { type: 'openai', baseUrl: 'https://example.com/v1', apiKey: 'test-only-key', model: 'test-model' };

function modelResponse(content, finishReason = 'stop') {
  return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: finishReason }] })}\n\ndata: [DONE]\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('shared model generation', () => {
  it('returns validated draw.io XML in Node without browser globals', async () => {
    const fetch = vi.fn().mockResolvedValue(modelResponse(XML));
    vi.stubGlobal('fetch', fetch);
    expect(typeof globalThis.DOMParser).toBe('undefined');
    const result = await generateDiagram({ prompt: '画一个中文节点', chartType: 'flowchart' }, { config });
    expect(result.ok).toBe(true);
    expect(result.xml).toContain('中文节点');
    expect(result.diagnostics).toEqual([]);
    expect(JSON.stringify(result)).not.toContain(config.apiKey);
  });

  it('keeps incomplete or structurally invalid output from being applied', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(modelResponse('<mxfile><diagram>broken</diagram></mxfile>')));
    const result = await generateDiagram({ prompt: 'diagram' }, { config });
    expect(result.ok).toBe(false);
    expect(result.xml).toBeUndefined();
    expect(result.diagnostics[0].code).toBe('INVALID_MODEL_XML');
  });

  it('rejects a length stop even when a valid document prefix is present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(modelResponse(XML + '<mxfile>unfinished', 'length')));
    const result = await generateDiagram({ prompt: 'diagram' }, { config });
    expect(result).toMatchObject({ ok: false, diagnostics: [{ code: 'OUTPUT_TRUNCATED' }] });
    expect(result.xml).toBeUndefined();
  });

  it('reports theme failures instead of returning successful but unprocessed XML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(modelResponse(XML)));
    vi.spyOn(tricks.orthogonalRouting, 'apply').mockReturnValue({ xml: XML, error: `transform echoed ${config.apiKey}` });
    const result = await generateDiagram({ prompt: 'diagram', theme: 'research' }, { config });
    expect(result).toMatchObject({ ok: false, diagnostics: [{ code: 'TRANSFORM_FAILED' }] });
    expect(result.xml).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain(config.apiKey);
  });

  it('does not expose upstream error bodies or credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`upstream echoed ${config.apiKey}`, { status: 503 })));
    const result = await generateDiagram({ prompt: 'diagram' }, { config });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(config.apiKey);
    expect(JSON.stringify(result)).not.toContain('upstream echoed');
  });

  it('forwards request cancellation to the provider', async () => {
    let upstreamSignal;
    vi.stubGlobal('fetch', vi.fn((_url, options) => {
      upstreamSignal = options.signal;
      return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => {
        reject(options.signal.reason);
      }, { once: true }));
    }));
    const task = new AbortController();
    const pending = generateDiagram({ prompt: 'diagram' }, { config, signal: task.signal });
    await vi.waitFor(() => expect(upstreamSignal).toBeDefined());
    task.abort();
    const result = await pending;
    expect(upstreamSignal.aborted).toBe(true);
    expect(result).toMatchObject({ ok: false, diagnostics: [{ code: 'CANCELLED' }] });
  });

  it('fails before making a request when the provider or options are missing', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect((await generateDiagram({ prompt: 'diagram' })).diagnostics[0].code).toBe('CONFIG_MISSING');
    expect((await generateDiagram({ prompt: 'diagram', theme: 'unknown' }, { config })).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
