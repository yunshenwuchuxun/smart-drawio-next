// stdio is reserved for the MCP protocol. Opt-in diagnostics use stderr only.
export function debug(label, data) {
  if (typeof process !== 'undefined' && process.env.SMART_DRAWIO_DEBUG === 'true') {
    console.error(label, data);
  }
}
