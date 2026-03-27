import { describe, expect, it } from 'vitest';

import { buildOptimizationSuggestions } from '@/lib/optimization-suggestions';

describe('buildOptimizationSuggestions', () => {
  it('builds readable preset suggestions in the selected order', () => {
    expect(buildOptimizationSuggestions(['layout', 'text'])).toEqual([
      '统一布局方向：统一主要流程方向，例如自上而下或从左到右。',
      '优化文本换行：改善节点内文字换行，提升可读性。',
    ]);
  });

  it('appends a trimmed custom suggestion', () => {
    expect(buildOptimizationSuggestions(['grid'], '  让主链路更醒目  ')).toEqual([
      '网格对齐验证：检查节点与连接线是否按统一网格对齐。',
      '让主链路更醒目',
    ]);
  });

  it('ignores unknown preset ids and empty custom text', () => {
    expect(buildOptimizationSuggestions(['missing'], '   ')).toEqual([]);
  });
});
