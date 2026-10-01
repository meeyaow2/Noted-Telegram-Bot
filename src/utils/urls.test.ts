import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractUrls, MAX_URL_LENGTH, normaliseUrl } from "./urls.js";

describe("extractUrls", () => {
  it("finds a single link in plain text", () => {
    assert.deepEqual(extractUrls("check this https://www.tiktok.com/@cafe/video/123"), [
      "https://www.tiktok.com/@cafe/video/123",
    ]);
  });

  it("returns an empty list when there is no link", () => {
    assert.deepEqual(extractUrls("omurice in kyoto looks amazing"), []);
    assert.deepEqual(extractUrls(""), []);
    assert.deepEqual(extractUrls(undefined), []);
  });

  it("strips trailing sentence punctuation and unbalanced brackets", () => {
    assert.deepEqual(extractUrls("Go here: https://example.com/menu."), ["https://example.com/menu"]);
    assert.deepEqual(extractUrls("(see https://example.com/a)"), ["https://example.com/a"]);
    assert.deepEqual(extractUrls("wow https://example.com/x!!"), ["https://example.com/x"]);
  });

  it("keeps balanced brackets that are part of the URL", () => {
    assert.deepEqual(extractUrls("https://en.wikipedia.org/wiki/Kyoto_(city)"), [
      "https://en.wikipedia.org/wiki/Kyoto_(city)",
    ]);
  });

  it("adds https to www links", () => {
    assert.deepEqual(extractUrls("www.example.com/cafe"), ["https://www.example.com/cafe"]);
  });

  it("finds multiple links and removes duplicates", () => {
    const text = "https://youtu.be/abc and https://maps.app.goo.gl/xyz and https://youtu.be/abc";
    assert.deepEqual(extractUrls(text), ["https://youtu.be/abc", "https://maps.app.goo.gl/xyz"]);
  });

  it("uses Telegram text_link entities for hidden links", () => {
    const text = "This café is so cute";
    const entities = [{ type: "text_link", offset: 5, length: 4, url: "https://www.instagram.com/p/abc/" }];
    assert.deepEqual(extractUrls(text, entities), ["https://www.instagram.com/p/abc/"]);
  });

  it("uses Telegram url entities, including bare domains", () => {
    const text = "saved tiktok.com/@abc";
    const entities = [{ type: "url", offset: 6, length: 15 }];
    assert.deepEqual(extractUrls(text, entities), ["https://tiktok.com/@abc"]);
  });

  it("ignores non-web schemes", () => {
    assert.deepEqual(extractUrls("javascript:alert(1) ftp://files.example.com/x"), []);
  });
});

describe("normaliseUrl", () => {
  it("accepts normal http and https links", () => {
    assert.equal(normaliseUrl("https://example.com"), "https://example.com/");
    assert.equal(normaliseUrl("http://example.com/a?b=1"), "http://example.com/a?b=1");
  });

  it("rejects unsafe or invalid links", () => {
    assert.equal(normaliseUrl("javascript:alert(1)"), null);
    assert.equal(normaliseUrl("ftp://example.com"), null);
    assert.equal(normaliseUrl("https://user:pass@example.com"), null);
    assert.equal(normaliseUrl("https://localhost:3000"), null);
    assert.equal(normaliseUrl("https://192.168.0.1/admin"), null);
    assert.equal(normaliseUrl("not a url"), null);
    assert.equal(normaliseUrl("   "), null);
  });

  it("rejects links that are too long", () => {
    assert.equal(normaliseUrl(`https://example.com/${"a".repeat(MAX_URL_LENGTH)}`), null);
  });
});
