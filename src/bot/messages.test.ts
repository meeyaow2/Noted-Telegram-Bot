import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SavedPlace } from "../types/savedPlace.js";
import { EMPTY_SAVED_MESSAGE, formatSavedConfirmation, formatSavedList, MAX_MESSAGE_LENGTH } from "./messages.js";

function place(url: string, source: SavedPlace["source"]): SavedPlace {
  return {
    id: crypto.randomUUID(),
    telegram_user_id: 1,
    telegram_username: null,
    url,
    original_message: url,
    source,
    domain: null,
    created_at: new Date().toISOString(),
  };
}

describe("formatSavedConfirmation", () => {
  it("shows the source for a single save", () => {
    assert.equal(formatSavedConfirmation(["TikTok"]), "Saved ✨\nSource: TikTok");
  });

  it("lists sources for several saves", () => {
    assert.equal(formatSavedConfirmation(["TikTok", "Google Maps"]), "Saved 2 links ✨\n• TikTok\n• Google Maps");
  });
});

describe("formatSavedList", () => {
  it("returns a friendly empty state", () => {
    assert.deepEqual(formatSavedList([]), [EMPTY_SAVED_MESSAGE]);
  });

  it("numbers items with their source", () => {
    const [text] = formatSavedList([
      place("https://www.tiktok.com/@a/video/1", "tiktok"),
      place("https://maps.app.goo.gl/x", "google_maps"),
    ]);
    assert.equal(
      text,
      "Your recent saves 📌\n\n1. TikTok\nhttps://www.tiktok.com/@a/video/1\n\n2. Google Maps\nhttps://maps.app.goo.gl/x",
    );
  });

  it("splits into several messages when URLs are very long", () => {
    const long = `https://example.com/${"a".repeat(1900)}`;
    const items = Array.from({ length: 10 }, () => place(long, "website"));
    const messages = formatSavedList(items);
    assert.ok(messages.length > 1);
    for (const m of messages) assert.ok(m.length <= MAX_MESSAGE_LENGTH);
    assert.equal(messages.join("\n\n").split("Website").length - 1, 10);
  });
});
