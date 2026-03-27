import { detectMissingTags, tryRepairXml } from './xml-repair';

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
  const cleanedCode = code.trim();
  const { isTruncated, missingTags } = detectMissingTags(cleanedCode);

  // 1. Complete mxfile — best case
  const xmlMatch = cleanedCode.match(/<mxfile[\s\S]*?<\/mxfile>/);
  if (xmlMatch) {
    return {
      status: 'xml',
      generatedCode: cleanedCode,
      generatedXml: xmlMatch[0],
      elements: [],
      isTruncated: false,
      canContinue: false,
      continuationAttempts: 0,
      jsonError: null,
      notification: null,
    };
  }

  // 2. Fallback A: partial mxfile (no closing tag) — attempt repair
  const partialMxfileMatch = cleanedCode.match(/<mxfile[\s\S]*/);
  if (partialMxfileMatch) {
    const repairResult = tryRepairXml(partialMxfileMatch[0]);
    if (repairResult.repaired && repairResult.valid) {
      return {
        status: 'repaired',
        generatedCode: cleanedCode,
        generatedXml: repairResult.xml,
        elements: [],
        isTruncated: false,
        canContinue: false,
        continuationAttempts: 0,
        jsonError: null,
        notification: {
          title: 'Auto Repair',
          message: `Recovered missing tags: ${repairResult.addedTags?.join(', ') || 'unknown'}`,
          type: 'info',
        },
      };
    }
  }

  // 3. Fallback B: bare mxGraphModel — wrap in mxfile/diagram
  const bareModelMatch = cleanedCode.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/);
  if (bareModelMatch) {
    const wrappedXml = `<mxfile><diagram>${bareModelMatch[0]}</diagram></mxfile>`;
    return {
      status: 'xml',
      generatedCode: cleanedCode,
      generatedXml: wrappedXml,
      elements: [],
      isTruncated: false,
      canContinue: false,
      continuationAttempts: 0,
      jsonError: null,
      notification: {
        title: 'Auto Wrap',
        message: 'Bare mxGraphModel was wrapped in mxfile/diagram tags.',
        type: 'info',
      },
    };
  }

  // 4. JSON array
  const arrayMatch = cleanedCode.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return {
          status: 'json',
          generatedCode: cleanedCode,
          generatedXml: '',
          elements: parsed,
          isTruncated: false,
          canContinue: false,
          continuationAttempts: 0,
          jsonError: null,
          notification: null,
        };
      }
    } catch {
    }
  }

  // 5. Truncated — detected missing tags but no fallback could repair
  if (isTruncated) {
    const canContinue = continuationAttempts < 3;
    const message = canContinue
      ? `Generation was truncated. Missing closing tags: ${missingTags.join(', ')}. Use Continue to finish the diagram.`
      : `Reached the continuation limit of 3 attempts. Missing tags: ${missingTags.join(', ')}. Try auto repair or edit manually.`;

    return {
      status: 'truncated',
      generatedCode: cleanedCode,
      generatedXml: cleanedCode,
      elements: [],
      isTruncated: true,
      canContinue,
      continuationAttempts,
      jsonError: message,
      notification: null,
    };
  }

  // 6. Invalid — nothing recognizable
  return {
    status: 'invalid',
    generatedCode: cleanedCode,
    generatedXml: '',
    elements: [],
    isTruncated: false,
    canContinue: false,
    continuationAttempts: 0,
    jsonError: 'No valid JSON array or draw.io XML was found in the response.',
    notification: null,
  };
}
