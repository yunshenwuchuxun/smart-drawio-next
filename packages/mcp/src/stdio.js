#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';

const { createSmartDrawioServer } = await import('./server.js');

// stdout belongs exclusively to JSON-RPC; never print credentials or raw errors.
const handle = serveStdio(() => createSmartDrawioServer(), {
  onerror: () => process.stderr.write('Smart Drawio MCP transport error.\n'),
});

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await handle.close();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
