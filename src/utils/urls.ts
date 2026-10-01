/**
 * URL detection and validation. Pure functions with no Telegram or database
 * dependencies, so they are easy to test and reuse.
 */

export const MAX_URL_LENGTH = 2048;

/** Minimal shape of a Telegram message entity (works with grammY's types). */
export interface TextEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

// Matches http(s)://... or www.... up to the next whitespace.
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;

const TRAILING_PUNCTUATION = /[.,!?;:'"*_~]+$/;

/** Removes punctuation that is usually part of the sentence, not the link. */
function trimTrailing(candidate: string): string {
  let url = candidate.replace(TRAILING_PUNCTUATION, "");
  // Drop unbalanced closing brackets, e.g. "(see https://x.com/a)".
  for (const [open, close] of [["(", ")"], ["[", "]"]] as const) {
    while (url.endsWith(close) && count(url, close) > count(url, open)) {
      url = url.slice(0, -1).replace(TRAILING_PUNCTUATION, "");
    }
  }
  return url;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

/**
 * Checks that a string is a safe, storable web link and returns it in a
 * normalised form, or null if it should be rejected.
 */
export function normaliseUrl(raw: string): string | null {
  let candidate = raw.trim();
  if (!candidate) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    // Telegram detects bare links such as "tiktok.com/@x"; assume https.
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;

  const host = parsed.hostname;
  // Require a real-looking public hostname: at least one dot, alphabetic TLD.
  if (!host.includes(".") || !/\.[a-z]{2,}$/i.test(host)) return null;

  const url = parsed.toString();
  if (url.length > MAX_URL_LENGTH) return null;
  return url;
}

/**
 * Finds all valid, distinct URLs in a message.
 *
 * Telegram entities are used first because they also cover hidden links
 * (text_link), which are common in forwarded posts. A regex pass over the text
 * catches anything the entities missed.
 */
export function extractUrls(text: string | undefined | null, entities: readonly TextEntity[] = []): string[] {
  const found: string[] = [];
  const body = text ?? "";

  for (const entity of entities) {
    if (entity.type === "text_link" && entity.url) {
      found.push(entity.url);
    } else if (entity.type === "url") {
      found.push(body.slice(entity.offset, entity.offset + entity.length));
    }
  }

  for (const match of body.matchAll(URL_PATTERN)) {
    found.push(trimTrailing(match[0]));
  }

  const unique = new Set<string>();
  for (const raw of found) {
    const url = normaliseUrl(raw);
    if (url) unique.add(url);
  }
  return [...unique];
}
