import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { installEditorFixtures } from './editor-fixtures';

const XML = '<mxfile><diagram id="p1" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="n1" parent="1" vertex="1" value="Original"><mxGeometry x="20" y="30" width="120" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const SNAPSHOT_KEY = 'smart-drawio-autosave';
let provider;
let providerUrl;

test.beforeAll(async () => {
  // Exercise the real Next route against a deterministic local model endpoint.
  provider = createServer(async (request, response) => {
    for await (const _chunk of request) { /* Drain the model request. */ }
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    response.end(`data: ${JSON.stringify({ choices: [{ delta: { content: XML }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
  });
  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve));
  providerUrl = `http://127.0.0.1:${provider.address().port}/v1`;
});
test.afterAll(async () => {
  provider?.closeAllConnections();
  await new Promise((resolve) => provider?.close(resolve));
});

test.beforeEach(async ({ page }) => {
  await installEditorFixtures(page);
  await page.addInitScript(({ providerUrl }) => {
    if (!localStorage.getItem('smart-drawio-configs')) {
      localStorage.setItem('smart-drawio-configs', JSON.stringify([{
        id: 'test-provider', name: 'Test provider', type: 'openai', baseUrl: providerUrl,
        apiKey: 'test-only-key', model: 'gpt-4.1',
      }]));
      localStorage.setItem('smart-drawio-active-config', 'test-provider');
    }
  }, { providerUrl });
});

async function snapshot(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SNAPSHOT_KEY);
}

test('real generation reaches the canvas and is restored after a manual edit and reload', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('描述你想生成的图表、结构或信息层级…').fill('Create a simple diagram');
  await page.getByTitle('发送请求').click();
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#diagram-xml')).toContainText('Original');
  const edited = XML.replace('Original', 'Manual edit');
  await frame.locator('body').evaluate((_body, xml) => {
    parent.postMessage(JSON.stringify({ event: 'autosave', xml }), '*');
  }, edited);
  await expect.poll(async () => (await snapshot(page))?.generatedXml).toContain('Manual edit');
  await page.getByText('Smart Drawio', { exact: true }).click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(frame.locator('#diagram-xml')).toContainText('Original');
  await expect.poll(async () => (await snapshot(page))?.generatedXml).toContain('Original');
  await page.keyboard.press('ControlOrMeta+y');
  await expect(frame.locator('#diagram-xml')).toContainText('Manual edit');
  await expect.poll(async () => (await snapshot(page))?.generatedXml).toContain('Manual edit');
  expect(JSON.stringify(await snapshot(page))).not.toContain('test-only-key');
  await page.reload();
  await expect(frame.locator('#diagram-xml')).toContainText('Manual edit');
});

test('refresh restores both unapplied code and unsent input without replacing the canvas', async ({ page }) => {
  await page.addInitScript(({ key, xml }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, savedAt: Date.now(), generatedXml: xml, generatedCode: '<mxfile>unfinished code',
      currentInput: 'previous request', currentChartType: 'flowchart', inputDraft: 'unsent request',
      inputChartType: 'architecture', theme: 'research', presets: {},
    }));
  }, { key: SNAPSHOT_KEY, xml: XML });
  await page.goto('/');
  await expect(page.getByPlaceholder('描述你想生成的图表、结构或信息层级…')).toHaveValue('unsent request');
  await expect(page.frameLocator('iframe').locator('#diagram-xml')).toContainText('Original');
  expect(await snapshot(page)).toMatchObject({ generatedXml: XML, generatedCode: '<mxfile>unfinished code' });
  await page.getByRole('tab', { name: 'CODE' }).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('unfinished code');
  await page.reload();
  await page.getByRole('tab', { name: 'INPUT' }).click();
  await expect(page.getByPlaceholder('描述你想生成的图表、结构或信息层级…')).toHaveValue('unsent request');
  expect(await snapshot(page)).toMatchObject({ generatedXml: XML, generatedCode: '<mxfile>unfinished code' });
});

test('a failed generation keeps the previous applied diagram', async ({ page }) => {
  await page.addInitScript(({ key, xml }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
    version: 1, savedAt: Date.now(), generatedXml: xml, generatedCode: xml,
    currentInput: '', currentChartType: 'auto', inputDraft: '', theme: 'research', presets: {},
    }));
  }, { key: SNAPSHOT_KEY, xml: XML });
  await page.goto('/');
  await expect(page.frameLocator('iframe').locator('#diagram-xml')).toContainText('Original');
  await page.route('**/api/generate', (route) => route.fulfill({ contentType: 'text/event-stream',
    body: 'data: {"error":"Upstream request failed"}\n\n' }));
  await page.getByPlaceholder('描述你想生成的图表、结构或信息层级…').fill('Generate another diagram');
  await page.getByTitle('发送请求').click();
  await expect(page.getByText('Upstream request failed', { exact: true })).toBeVisible();
  await expect(page.frameLocator('iframe').locator('#diagram-xml')).toContainText('Original');
  expect((await snapshot(page)).generatedXml).toBe(XML);
});

test('applying unsupported JSON keeps the diagram and unapplied draft', async ({ page }) => {
  const draft = '[{"type":"unsupported"}]';
  await page.addInitScript(({ key, xml, draft }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, savedAt: Date.now(), generatedXml: xml, generatedCode: draft,
      currentInput: '', currentChartType: 'auto', inputDraft: '', theme: 'research', presets: {},
    }));
  }, { key: SNAPSHOT_KEY, xml: XML, draft });
  await page.goto('/');
  await expect(page.frameLocator('iframe').locator('#diagram-xml')).toContainText('Original');
  await page.getByRole('tab', { name: 'CODE' }).click();
  await page.getByTitle('应用当前代码到画布').click();
  await expect(page.getByRole('button', { name: 'Dismiss JSON error' })).toBeVisible();
  await expect(page.frameLocator('iframe').locator('#diagram-xml')).toContainText('Original');
  await expect.poll(async () => (await snapshot(page))?.generatedCode).toBe(draft);
  expect((await snapshot(page)).generatedXml).toBe(XML);
});
