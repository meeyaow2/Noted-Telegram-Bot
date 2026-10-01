import { Bot, GrammyError, HttpError } from "grammy";
import type { SavedPlacesService } from "../services/savedPlacesService.js";
import { logger } from "../utils/logger.js";
import { createSavedCommand } from "./commands/saved.js";
import { startCommand } from "./commands/start.js";
import { createMessageHandler } from "./handlers/message.js";
import { GENERIC_ERROR_MESSAGE, NO_LINK_MESSAGE } from "./messages.js";

export interface BotDependencies {
  token: string;
  savedPlaces: SavedPlacesService;
}

/** Wires commands and handlers together. Contains no database logic. */
export function createBot({ token, savedPlaces }: BotDependencies): Bot {
  const bot = new Bot(token);

  // Private chats only for now; group support comes later.
  const dm = bot.chatType("private");

  dm.command("start", startCommand);
  dm.command("saved", createSavedCommand(savedPlaces));
  dm.on(["message:text", "message:caption"], createMessageHandler(savedPlaces));
  // Stickers, photos without captions, voice notes, etc.
  dm.on("message", (ctx) => ctx.reply(NO_LINK_MESSAGE));

  bot.catch(async (err) => {
    const e = err.error;
    if (e instanceof GrammyError) logger.error(`Telegram API error: ${e.description}`);
    else if (e instanceof HttpError) logger.error("Could not reach Telegram", e);
    else logger.error("Unexpected error while handling an update", e);

    try {
      await err.ctx.reply(GENERIC_ERROR_MESSAGE);
    } catch {
      // Ignore: replying can fail for the same reason the handler did.
    }
  });

  return bot;
}
