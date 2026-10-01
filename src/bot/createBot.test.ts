/**
 * End-to-end tests for the bot's behaviour without real Telegram or Supabase:
 * updates are fed straight into grammY, outgoing API calls are captured, and
 * the database is replaced by an in-memory fake.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { Update, UserFromGetMe } from "grammy/types";
import type { SavedPlacesService } from "../services/savedPlacesService.js";
import type { NewSavedPlace, SavedPlace } from "../types/savedPlace.js";
import { setLogLevel } from "../utils/logger.js";
import { createBot } from "./createBot.js";
import { NO_LINK_MESSAGE, SAVE_FAILED_MESSAGE, START_MESSAGE } from "./messages.js";

setLogLevel("error");

class FakeSavedPlaces {
  rows: SavedPlace[] = [];
  failNextSave = false;

  async saveItem(item: NewSavedPlace): Promise<SavedPlace> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("db down");
    }
    const row: SavedPlace = {
      id: crypto.randomUUID(),
      telegram_user_id: item.telegramUserId,
      telegram_username: item.telegramUsername,
      url: item.url,
      original_message: item.originalMessage,
      source: item.source,
      domain: item.domain,
      created_at: new Date(Date.now() + this.rows.length).toISOString(),
    };
    this.rows.push(row);
    return row;
  }

  async getRecentItems(userId: number, limit = 10): Promise<SavedPlace[]> {
    return this.rows
      .filter((r) => r.telegram_user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}

const BOT_INFO = {
  id: 999,
  is_bot: true,
  first_name: "Noted",
  username: "noted_test_bot",
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
} as UserFromGetMe;

let updateId = 0;

function textUpdate(userId: number, text: string, extra: Record<string, unknown> = {}): Update {
  const entities = text.startsWith("/")
    ? [{ type: "bot_command", offset: 0, length: text.split(" ")[0]!.length }]
    : undefined;
  return {
    update_id: ++updateId,
    message: {
      message_id: updateId,
      date: Math.floor(Date.now() / 1000),
      chat: { id: userId, type: "private", first_name: "Amanda" },
      from: { id: userId, is_bot: false, first_name: "Amanda", username: `user${userId}` },
      text,
      ...(entities ? { entities } : {}),
      ...extra,
    },
  } as Update;
}

function setup() {
  const store = new FakeSavedPlaces();
  const bot = createBot({ token: "123:test", savedPlaces: store as unknown as SavedPlacesService });
  bot.botInfo = BOT_INFO;
  const replies: string[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    if (method === "sendMessage") replies.push((payload as { text: string }).text);
    return { ok: true, result: { message_id: 1, date: 0, chat: { id: 1, type: "private" } } } as never;
  });
  return { bot, store, replies };
}

describe("bot", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  it("/start introduces the bot", async () => {
    await ctx.bot.handleUpdate(textUpdate(1, "/start"));
    assert.deepEqual(ctx.replies, [START_MESSAGE]);
  });

  it("saves a link and confirms with the source", async () => {
    await ctx.bot.handleUpdate(textUpdate(1, "omg this omurice https://vm.tiktok.com/ZMabc/"));
    assert.deepEqual(ctx.replies, ["Saved ✨\nSource: TikTok"]);
    assert.equal(ctx.store.rows.length, 1);
    const row = ctx.store.rows[0]!;
    assert.equal(row.telegram_user_id, 1);
    assert.equal(row.telegram_username, "user1");
    assert.equal(row.url, "https://vm.tiktok.com/ZMabc/");
    assert.equal(row.original_message, "omg this omurice https://vm.tiktok.com/ZMabc/");
    assert.equal(row.source, "tiktok");
  });

  it("saves links from forwarded captions", async () => {
    const update = {
      update_id: ++updateId,
      message: {
        message_id: updateId,
        date: 0,
        chat: { id: 1, type: "private", first_name: "A" },
        from: { id: 1, is_bot: false, first_name: "A" },
        caption: "Best café in Kyoto",
        caption_entities: [{ type: "text_link", offset: 0, length: 4, url: "https://maps.app.goo.gl/xyz" }],
        photo: [{ file_id: "f", file_unique_id: "u", width: 1, height: 1 }],
      },
    } as Update;
    await ctx.bot.handleUpdate(update);
    assert.deepEqual(ctx.replies, ["Saved ✨\nSource: Google Maps"]);
    assert.equal(ctx.store.rows[0]!.telegram_username, null);
  });

  it("nudges gently when there is no link", async () => {
    await ctx.bot.handleUpdate(textUpdate(1, "hello there"));
    assert.deepEqual(ctx.replies, [NO_LINK_MESSAGE]);
    assert.equal(ctx.store.rows.length, 0);
  });

  it("replies kindly when saving fails", async () => {
    ctx.store.failNextSave = true;
    await ctx.bot.handleUpdate(textUpdate(1, "https://example.com"));
    assert.deepEqual(ctx.replies, [SAVE_FAILED_MESSAGE]);
  });

  it("/saved shows only the user's own saves, newest first", async () => {
    await ctx.bot.handleUpdate(textUpdate(1, "https://youtu.be/one"));
    await ctx.bot.handleUpdate(textUpdate(2, "https://instagram.com/p/other-user"));
    await ctx.bot.handleUpdate(textUpdate(1, "https://maps.app.goo.gl/two"));
    ctx.replies.length = 0;

    await ctx.bot.handleUpdate(textUpdate(1, "/saved"));
    assert.deepEqual(ctx.replies, [
      "Your recent saves 📌\n\n1. Google Maps\nhttps://maps.app.goo.gl/two\n\n2. YouTube\nhttps://youtu.be/one",
    ]);
  });

  it("/saved shows at most 10 items", async () => {
    for (let i = 0; i < 12; i++) await ctx.bot.handleUpdate(textUpdate(1, `https://example.com/${i}`));
    ctx.replies.length = 0;
    await ctx.bot.handleUpdate(textUpdate(1, "/saved"));
    assert.match(ctx.replies[0]!, /\n10\. Website\nhttps:\/\/example\.com\/2$/);
    assert.doesNotMatch(ctx.replies[0]!, /\n11\./);
  });

  it("/saved has an empty state", async () => {
    await ctx.bot.handleUpdate(textUpdate(1, "/saved"));
    assert.match(ctx.replies[0]!, /Nothing saved yet/);
  });

  it("ignores group chats for now", async () => {
    const update = textUpdate(1, "https://example.com");
    (update.message as { chat: unknown }).chat = { id: -100, type: "group", title: "Trip" };
    await ctx.bot.handleUpdate(update);
    assert.deepEqual(ctx.replies, []);
    assert.equal(ctx.store.rows.length, 0);
  });
});
