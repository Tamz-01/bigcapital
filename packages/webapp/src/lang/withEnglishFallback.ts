function isDictionary(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Merge translation dictionaries only; never pass user-entered business data. */
export function withEnglishFallback<T extends Record<string, unknown>>(
  english: T,
  translated: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...english };
  for (const [key, value] of Object.entries(translated)) {
    // Treat an empty translation as unfinished, including whitespace-only text.
    if (value == null || (typeof value === 'string' && !value.trim())) continue;
    const original = english[key];
    result[key] =
      isDictionary(original) && isDictionary(value)
        ? withEnglishFallback(original, value)
        : value;
  }
  return result as T;
}
