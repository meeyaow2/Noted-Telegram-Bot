import type { Context } from "grammy";
import type { SavedPlacesService } from "../../services/savedPlacesService.js";
import { logger } from "../../utils/logger.js";
import { detectSource } from "../../utils/source.js";
import { extractUrls } from "../../utils/urls.js";
import { formatSavedConfirmation, NO_LINK_MESSAGE, SAVE_FAILED_MESSAGE } from "../messages.js";

// Guards against someone pasting a huge list of links in one message.
export const MAX_URLS_PER_MESSAGE = 10;

/**
 * Handles any text or captioned message (including forwards): finds links,
 * saves each one and confirms. Messages without a link get a gentle nudge.
 */
export function createMessageHandler(service: SavedPlacesService) {
  return async (ctx: Context): Promise<void> => {
    const message = ctx.message;
    const from = ctx.from;
    if (!message || !from) return;

    // Forwarded videos/photos carry their text in the caption.
    const text = message.text ?? message.caption ?? null;
    const entities = message.entities ?? message.caption_entities ?? [];
    const urls = extractUrls(text, entities).slice(0, MAX_URLS_PER_MESSAGE);

    if (urls.length === 0) {
      await ctx.reply(NO_LINK_MESSAGE);
      return;
    }

    const labels: string[] = [];
    try {
      for (const url of urls) {
        const source = detectSource(url);
        await service.saveItem({
          telegramUserId: from.id,
          telegramUsername: from.username ?? null,
          url,
          originalMessage: text,
          source: source.key,
          domain: source.domain,
        });
        labels.push(source.label);
      }
    } catch (err) {
      logger.error("Could not save item", err);
      // If some links in a multi-link message were saved, say so.
      await ctx.reply(labels.length > 0 ? formatSavedConfirmation(labels) + "\n\n" + SAVE_FAILED_MESSAGE : SAVE_FAILED_MESSAGE);
      return;
    }

    // Future: hand the saved item to an aiService here (see types/placeExtraction.ts).
    await ctx.reply(formatSavedConfirmation(labels));
  };
}
