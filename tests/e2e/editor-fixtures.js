import { createRequire } from 'node:module';
import path from 'node:path';

const taskRequire = createRequire(path.join(process.cwd(), 'package.json'));
const monacoRequire = createRequire(taskRequire.resolve('@monaco-editor/react'));
const monacoMin = path.join(path.dirname(monacoRequire.resolve('monaco-editor/package.json')), 'min');

export async function installEditorFixtures(page) {
  // Serve the installed editor assets rather than depending on CDN availability.
  await page.route('https://cdn.jsdelivr.net/npm/monaco-editor@*/min/**', async (route) => {
    const asset = new URL(route.request().url()).pathname.split('/min/')[1];
    const localPath = path.resolve(monacoMin, asset);
    if (!localPath.startsWith(monacoMin + path.sep)) return route.abort();
    await route.fulfill({ path: localPath });
  });
  // Simulate the protocol and common editor normalization; rendering is not asserted.
  await page.route('https://embed.diagrams.net/**', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<html><body><pre id="diagram-xml"></pre><script>
      const init = setInterval(() => parent.postMessage(JSON.stringify({event:'init'}), '*'), 50);
      addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.action === 'load') {
          clearInterval(init);
          const doc = new DOMParser().parseFromString(message.xml, 'application/xml');
          doc.documentElement.setAttribute('pages', '1');
          doc.documentElement.setAttribute('compressed', 'false');
          doc.querySelectorAll('diagram').forEach((diagram, index) => {
            if (!diagram.hasAttribute('id')) diagram.setAttribute('id', 'editor-page-' + index);
          });
          doc.querySelectorAll('mxGraphModel').forEach(model => {
            for (const [key, value] of Object.entries({page:'1', pageScale:'1', pageWidth:'850', pageHeight:'1100'})) {
              if (!model.hasAttribute(key)) model.setAttribute(key, value);
            }
          });
          const xml = new XMLSerializer().serializeToString(doc);
          document.getElementById('diagram-xml').textContent = xml;
          parent.postMessage(JSON.stringify({event:'autosave', xml}), '*');
        }
      });
    </script></body></html>`,
  }));
}
