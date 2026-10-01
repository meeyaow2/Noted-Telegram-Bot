import "dotenv/config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Config {
  telegramBotToken: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  logLevel: LogLevel;
}

const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    // Only the variable name is printed, never its value.
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export function loadConfig(): Config {
  const supabaseUrl = required("SUPABASE_URL");
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL (expected something like https://xyz.supabase.co).");
  }

  const rawLevel = (process.env.LOG_LEVEL ?? "info").trim().toLowerCase();
  const logLevel = (LOG_LEVELS as readonly string[]).includes(rawLevel) ? (rawLevel as LogLevel) : "info";

  return {
    telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
    supabaseUrl,
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    logLevel,
  };
}
