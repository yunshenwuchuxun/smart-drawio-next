import { describe, expect, it } from 'vitest';

import {
  buildImageGenerationPayload,
  buildImagePrompt,
  createEmptyFileState,
  getTextFileExtension,
  readTextFile,
  validateTextFileSelection,
} from '@/lib/chat-panel-utils';

describe('chat-panel-utils', () => {
  it('returns a predictable empty file state', () => {
    expect(createEmptyFileState()).toEqual({
      file: null,
      status: 'idle',
      error: '',
      content: '',
    });
  });

  it('validates supported extensions and file sizes', () => {
    const validFile = new File(['hello'], 'notes.md', { type: 'text/markdown' });
    const invalidFile = new File(['hello'], 'diagram.pdf', { type: 'application/pdf' });

    expect(getTextFileExtension(validFile.name)).toBe('.md');
    expect(validateTextFileSelection(validFile)).toEqual({ isValid: true, error: '' });
    expect(validateTextFileSelection(invalidFile)).toEqual({
      isValid: false,
      error: '仅支持 .md, .txt, .json, .csv 文件。',
    });
  });

  it('reads text files and trims surrounding whitespace', async () => {
    const file = new File(['  hello world  '], 'notes.txt', { type: 'text/plain' });
    await expect(readTextFile(file)).resolves.toBe('hello world');
  });

  it('creates image generation payloads with a chart-specific prompt', () => {
    const payload = buildImageGenerationPayload({
      data: 'base64-data',
      mimeType: 'image/png',
      previewUrl: 'blob:demo',
    }, 'flowchart');

    expect(buildImagePrompt('flowchart')).toContain('流程图');
    expect(payload).toEqual({
      text: expect.stringContaining('流程图'),
      image: {
        data: 'base64-data',
        mimeType: 'image/png',
      },
    });
  });
});