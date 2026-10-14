import { detectMissingTags, tryRepairXml, validateRepairedXml } from './xml-repair.js';

export function normalizeUserInput(userInput) {
  if (!userInput || typeof userInput !== 'object' || !userInput.image) {
    return userInput;
  }

  return {
    text: userInput.text,
    image: {
      data: userInput.image.data,
      mimeType: userInput.image.mimeType,
    },
  };
}

export function isNetworkError(error) {
  return error?.message === 'Failed to fetch' || error?.name === 'TypeError';
}

export async function resolveResponseErrorMessage(response, fallbackError = 'Request failed') {
  let errorMessage = fallbackError;

  try {
    const errorData = await response.json();
    if (errorData?.error) {
      return errorData.error;
    }
  } catch {
    if (fallbackError === 'Generate failed') {
      switch (response.status) {
        case 400:
          return 'Invalid request payload.';
        case 401:
        case 403:
          return 'API key is invalid or missing permissions.';
        case 429:
          return 'Too many requests. Please retry later.';
        case 500:
        case 502:
        case 503:
          return 'The server returned an upstream error.';
        default:
          return `${fallbackError} (${response.status})`;
      }
    }

    errorMessage = `${fallbackError} (${response.status})`;
  }

  return errorMessage;
}

export function parseGeneratedContent(code, { autoRepair = false, continuationAttempts = 0 } = {}) {
  const cleanedCode = typeof code === 'string' ? code.trim() : '';
  const result = {
    status: 'invalid',
    generatedCode: cleanedCode,
    generatedXml: '',
    elements: [],
    shouldApply: false,
    diagnostics: [],
    isTruncated: false,
    canContinue: false,
    continuationAttempts,
    jsonError: null,
    notification: null,
  };

  // Only XML that passes syntax AND graph validation can replace the canvas.
  // Use the last closing tag so multiple XML documents cannot hide behind an
  // otherwise valid first document. Surrounding model prose remains tolerated.
  const xmlStart = cleanedCode.search(/<mxfile\b/);
  const bareStart = xmlStart === -1 ? cleanedCode.search(/<mxGraphModel\b/) : -1;
  const start = xmlStart !== -1 ? xmlStart : bareStart;
  if (start !== -1) {
    const bare = xmlStart === -1;
    const closingTag = bare ? '</mxGraphModel>' : '</mxfile>';
    const end = cleanedCode.lastIndexOf(closingTag);
    const candidate = cleanedCode.slice(start, end >= start ? end + closingTag.length : undefined);
    const { isTruncated, missingTags } = detectMissingTags(candidate);
    const validation = validateRepairedXml(candidate);

    if (validation.isValid) {
      return {
        ...result,
        status: 'xml',
        shouldApply: true,
        generatedXml: bare ? `<mxfile><diagram>${candidate}</diagram></mxfile>` : candidate,
        continuationAttempts: 0,
        notification: bare ? {
          title: 'Auto Wrap',
          message: 'Bare mxGraphModel was wrapped in mxfile/diagram tags.',
          type: 'info',
        } : null,
      };
    }

    // Repair can discard an incomplete tail, so it must be explicitly enabled.
    if (autoRepair && isTruncated) {
      const repairResult = tryRepairXml(candidate);
      if (repairResult.repaired && repairResult.valid) {
        return {
          ...result,
          status: 'repaired',
          shouldApply: true,
          generatedXml: bare ? `<mxfile><diagram>${repairResult.xml}</diagram></mxfile>` : repairResult.xml,
          continuationAttempts: 0,
          elementsTruncated: repairResult.elementsTruncated,
          removedLength: repairResult.removedLength,
          notification: {
            title: 'Auto Repair',
            message: `Recovered missing tags: ${repairResult.addedTags?.join(', ') || 'unknown'}${repairResult.elementsTruncated ? `. Discarded ${repairResult.removedLength} characters from the incomplete tail.` : ''}`,
            type: repairResult.elementsTruncated ? 'warning' : 'info',
          },
        };
      }
    }

    if (isTruncated) {
      const canContinue = continuationAttempts < 3;
      return {
        ...result,
        status: 'truncated',
        diagnostics: validation.diagnostics,
        isTruncated: true,
        canContinue,
        jsonError: canContinue
          ? `Generation was truncated. Missing closing tags: ${missingTags.join(', ')}. Use Continue to finish the diagram.`
          : `Reached the continuation limit of 3 attempts. Missing tags: ${missingTags.join(', ')}. Try explicit repair or edit manually.`,
      };
    }

    return { ...result, diagnostics: validation.diagnostics, jsonError: validation.error };
  }

  // Retain the existing JSON element-array format for legacy diagrams.
  const arrayMatch = cleanedCode.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return {
          ...result,
          status: 'json',
          elements: parsed,
          shouldApply: true,
          continuationAttempts: 0,
        };
      }
    } catch {
    }
  }

  return {
    ...result,
    jsonError: 'No valid JSON array or draw.io XML was found in the response.',
  };
}
