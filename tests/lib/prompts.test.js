import { describe, expect, it } from 'vitest';

import {
  CONTINUATION_SYSTEM_PROMPT,
  OPTIMIZATION_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  buildSystemPrompt,
  createContinuationPrompt,
  createOptimizationPrompt,
} from '@/lib/prompts';

describe('prompts', () => {
  it('builds a theme-aware system prompt', () => {
    const prompt = buildSystemPrompt('research');

    expect(prompt).toContain('只输出 XML 代码，禁止任何文字说明');
    expect(prompt).toContain('学术论文绘图规范（顶会标准）');
    expect(prompt).toContain('mxGraph XML');
    expect(prompt).not.toContain('当前主题');
    expect(SYSTEM_PROMPT).toContain('顶级学术会议标准');

    const businessPrompt = buildSystemPrompt('business');
    expect(businessPrompt).toContain('当前主题');
  });

  it('builds user prompts with chart type guidance', () => {
    const prompt = USER_PROMPT_TEMPLATE('做一个用户注册流程图', 'flowchart');

    expect(prompt).toContain('用户需求');
    expect(prompt).toContain('流程图');
  });

  it('creates optimization prompts from suggestions', () => {
    const prompt = createOptimizationPrompt('<mxfile />', ['统一间距', '减少连线交叉']);

    expect(OPTIMIZATION_SYSTEM_PROMPT).toContain('优化专家');
    expect(prompt).toContain('1. 统一间距');
    expect(prompt).toContain('2. 减少连线交叉');
  });

  it('creates continuation prompts with next id and missing tags', () => {
    const incompleteXml = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="A"/>';
    const prompt = createContinuationPrompt(incompleteXml);

    expect(CONTINUATION_SYSTEM_PROMPT).toContain('续写专家');
    expect(prompt).toContain('最大 mxCell id：2');
    expect(prompt).toContain('新增 mxCell id 从 3 开始递增');
    expect(prompt).toContain('</mxfile>');
  });

  it('includes original request context in continuation prompt when provided', () => {
    const incompleteXml = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="5" value="X"/>';
    const prompt = createContinuationPrompt(incompleteXml, {
      originalRequest: '画一个含图例的 Transformer 架构图',
      chartType: 'architecture',
    });

    expect(prompt).toContain('原始需求');
    expect(prompt).toContain('画一个含图例的 Transformer 架构图');
    expect(prompt).toContain('图表类型：architecture');
    expect(prompt).toContain('已生成 mxCell 数量：3');
    expect(prompt).toContain('对照原始需求');
    expect(prompt).toContain('新增 mxCell id 从 6 开始递增');
  });
});
