/**
 * Everything the bot says to users, in one place so the tone stays
 * consistent and copy is easy to tweak. Messages are sent as plain text (no
 * Markdown/HTML parsing), so user-supplied URLs never need escaping.
 */
import type { SavedPlace } from "../types/savedPlace.js";
import { sourceLabel } from "../utils/source.js";

// Telegram's hard limit is 4096 characters per message; leave some headroom.
export const MAX_MESSAGE_LENGTH = 4000;

export const START_MESSAGE = [
  "👋 Send me places you want to remember.",
  "",
  "You can send links from TikTok, Instagram, Google Maps, YouTube, or websites and I'll save them for you.",
  "",
  "Use /saved to see your recent saves.",
].join("\n");

export const NO_LINK_MESSAGE = "Send me a link to a place you want to save ✨";

export const EMPTY_SAVED_MESSAGE =
  "Nothing saved yet 🌱\nSend me a link to a café, restaurant or spot you want to visit and I'll keep it here.";

export const SAVE_FAILED_MESSAGE = "Hmm, I couldn't save that just now 😕 Please try sending it again in a moment.";

export const LOAD_FAILED_MESSAGE = "Hmm, I couldn't load your saves just now 😕 Please try /saved again in a moment.";

export const GENERIC_ERROR_MESSAGE = "Oops, something went wrong on my side. Please try again 🙏";

/** Confirmation after saving one or more links. */
export function formatSavedConfirmation(labels: readonly string[]): string {
  if (labels.length === 1) return `Saved ✨\nSource: ${labels[0]}`;
  return [`Saved ${labels.length} links ✨`, ...labels.map((label) => `• ${label}`)].join("\n");
}

/**
 * Formats the /saved list. Returns one or more messages so a list with very
 * long URLs never exceeds Telegram's message length limit.
 */
export function formatSavedList(items: readonly SavedPlace[]): string[] {
  if (items.length === 0) return [EMPTY_SAVED_MESSAGE];

  const header = "Your recent saves 📌";
  const entries = items.map((item, i) => `${i + 1}. ${sourceLabel(item.source)}\n${item.url}`);

  const messages: string[] = [];
  let current = header;
  for (const entry of entries) {
    const next = `${current}\n\n${entry}`;
    if (next.length > MAX_MESSAGE_LENGTH && current !== header) {
      messages.push(current);
      current = entry;
    } else {
      current = next;
    }
  }
  messages.push(current);
  return messages;
}
