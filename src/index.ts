import { createBot } from "./bot/createBot.js";
import { loadConfig } from "./config.js";
import { createSupabaseClient } from "./db/supabase.js";
import { SavedPlacesService } from "./services/savedPlacesService.js";
import { logger, setLogLevel } from "./utils/logger.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);

  const savedPlaces = new SavedPlacesService(createSupabaseClient(config));
  const bot = createBot({ token: config.telegramBotToken, savedPlaces });

  await bot.api.setMyCommands([
    { command: "start", description: "What this bot does" },
    { command: "saved", description: "Show your 10 most recent saves" },
  ]);

  const stop = () => {
    logger.info("Shutting down…");
    void bot.stop();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await bot.start({
    onStart: (me) => logger.info(`Bot @${me.username} is running. Press Ctrl+C to stop.`),
  });
}

main().catch((err: unknown) => {
  logger.error(err instanceof Error ? err.message : "Failed to start the bot", err instanceof Error ? undefined : err);
  process.exit(1);
});
