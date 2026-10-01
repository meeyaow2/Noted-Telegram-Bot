import type { Context } from "grammy";
import type { SavedPlacesService } from "../../services/savedPlacesService.js";
import { logger } from "../../utils/logger.js";
import { formatSavedList, LOAD_FAILED_MESSAGE } from "../messages.js";

export function createSavedCommand(service: SavedPlacesService) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return;

    let messages: string[];
    try {
      const items = await service.getRecentItems(userId);
      messages = formatSavedList(items);
    } catch (err) {
      logger.error("Could not load saved items", err);
      await ctx.reply(LOAD_FAILED_MESSAGE);
      return;
    }

    for (const text of messages) {
      await ctx.reply(text, { link_preview_options: { is_disabled: true } });
    }
  };
}
