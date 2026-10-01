import type { LogLevel } from "../config.js";

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function log(level: LogLevel, message: string, extra?: unknown): void {
  if (ORDER[level] < ORDER[currentLevel]) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const out = level === "error" || level === "warn" ? console.error : console.log;
  if (extra === undefined) out(line);
  else out(line, extra);
}

export const logger = {
  debug: (message: string, extra?: unknown) => log("debug", message, extra),
  info: (message: string, extra?: unknown) => log("info", message, extra),
  warn: (message: string, extra?: unknown) => log("warn", message, extra),
  error: (message: string, extra?: unknown) => log("error", message, extra),
};
