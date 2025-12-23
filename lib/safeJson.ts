/**
 * Validates if a string is valid JSON or empty.
 * @param str - The string to validate
 * @returns True if the string is valid JSON or empty, false otherwise
 */
export const isValidJsonString = (str: string): boolean => {
  if (!str.trim()) return true;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts JSON string from mixed text content.
 * Supports extraction from plain JSON, code blocks, and mixed content.
 * @param text - The text to extract JSON from
 * @returns The extracted JSON string or null if no valid JSON found
 */
export const extractJsonFromText = (text: string): string | null => {
  if (!text || typeof text !== "string") {
    return null;
  }

  // First try to parse the text directly
  try {
    JSON.parse(text.trim());
    return text.trim();
  } catch {
    // If direct parsing fails, try to extract JSON from the text
  }

  // Look for JSON patterns (starting with { and ending with })
  const jsonMatches = text.match(/\{[\s\S]*\}/);
  if (jsonMatches && jsonMatches[0]) {
    try {
      JSON.parse(jsonMatches[0]);
      return jsonMatches[0];
    } catch {
      // Continue to other patterns
    }
  }

  // Look for code blocks containing JSON
  const codeBlockMatches = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  if (codeBlockMatches && codeBlockMatches[1]) {
    try {
      JSON.parse(codeBlockMatches[1]);
      return codeBlockMatches[1];
    } catch {
      // Continue to other patterns
    }
  }

  // Look for lines starting and ending with braces
  const lines = text.split("\n");
  let jsonStart = -1;
  let jsonEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("{") && jsonStart === -1) {
      jsonStart = i;
    }
    if (line.endsWith("}") && jsonStart !== -1) {
      jsonEnd = i;
      break;
    }
  }

  if (jsonStart !== -1 && jsonEnd !== -1) {
    const potentialJson = lines.slice(jsonStart, jsonEnd + 1).join("\n");
    try {
      JSON.parse(potentialJson);
      return potentialJson;
    } catch {
      // Last attempt failed
    }
  }

  return null;
};

/**
 * Safely parses JSON from a string with fallback extraction methods.
 * Returns parsed object or empty object if parsing fails.
 * @param jsonString - The JSON string to parse
 * @returns Parsed JSON object or empty object on failure
 */
export const safeJsonParse = (jsonString: string): any => {
  if (!jsonString || typeof jsonString !== "string" || !jsonString.trim()) {
    return {};
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn("Failed to parse JSON, attempting to extract:", error);

    // Try to extract JSON from mixed content
    const jsonMatches = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatches && jsonMatches[0]) {
      try {
        return JSON.parse(jsonMatches[0]);
      } catch {
        // Continue to next attempt
      }
    }

    // Try to extract from code blocks
    const codeBlockMatches = jsonString.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i,
    );
    if (codeBlockMatches && codeBlockMatches[1]) {
      try {
        return JSON.parse(codeBlockMatches[1]);
      } catch {
        // Continue to next attempt
      }
    }

    // Last resort: try to find and parse each line that looks like JSON
    const lines = jsonString.split("\n");
    let jsonStart = -1;
    let jsonEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("{") && jsonStart === -1) {
        jsonStart = i;
      }
      if (line.endsWith("}") && jsonStart !== -1) {
        jsonEnd = i;
        break;
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const potentialJson = lines.slice(jsonStart, jsonEnd + 1).join("\n");
      try {
        return JSON.parse(potentialJson);
      } catch {
        // All attempts failed
      }
    }

    console.error("All JSON parsing attempts failed for:", jsonString);
    return {};
  }
};
