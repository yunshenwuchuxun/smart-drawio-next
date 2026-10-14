import { gridSnap, tricks } from './drawing-tricks.js';
import { overlapFix } from './layout-optimizer.js';
import { stylePacks } from './style-packs.js';
import { getPresetDefaults, stylePresets } from './style-presets.js';
import { textStyleTools } from './text-style-tools.js';

export { getPresetDefaults, stylePresets, stylePacks, textStyleTools, tricks };

function adaptTrick(name, fn) {
  return function (xml) {
    const result = fn(xml);
    const changed = result.stats?.modified > 0;
    const applied = changed ? [{ name, message: result.stats.message }] : [];
    return { xml: result.xml, changed, applied };
  };
}

const QUICK_OPTIMIZE_STEPS = [
  { name: 'overlapFix',  fn: overlapFix },
  { name: 'gridSnap',    fn: adaptTrick('gridSnap', gridSnap) },
];

export function quickOptimize(xml) {
  let currentXml = xml;
  const applied = [];

  for (const step of QUICK_OPTIMIZE_STEPS) {
    try {
      const result = step.fn(currentXml);
      if (result.xml && result.changed) {
        currentXml = result.xml;
        if (result.applied) {
          applied.push(...result.applied);
        }
      }
    } catch {
      // skip failed step
    }
  }

  return { xml: currentXml, changed: currentXml !== xml, applied };
}

export const toolResetRegistry = {
  ...stylePresets,
  ...textStyleTools,
  ...stylePacks,
};
