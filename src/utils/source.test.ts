import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectSource, sourceLabel } from "./source.js";

function key(url: string) {
  return detectSource(url).key;
}

describe("detectSource", () => {
  it("detects TikTok", () => {
    assert.equal(key("https://www.tiktok.com/@cafe/video/123"), "tiktok");
    assert.equal(key("https://vm.tiktok.com/ZMabc/"), "tiktok");
  });

  it("detects Instagram", () => {
    assert.equal(key("https://www.instagram.com/reel/abc/"), "instagram");
    assert.equal(key("https://instagr.am/p/abc"), "instagram");
  });

  it("detects Google Maps in its many forms", () => {
    assert.equal(key("https://maps.app.goo.gl/AbC123"), "google_maps");
    assert.equal(key("https://goo.gl/maps/AbC123"), "google_maps");
    assert.equal(key("https://www.google.com/maps/place/Kichi+Kichi"), "google_maps");
    assert.equal(key("https://maps.google.com/?q=kyoto"), "google_maps");
    assert.equal(key("https://www.google.co.jp/maps/place/x"), "google_maps");
  });

  it("does not treat plain Google search as Google Maps", () => {
    assert.equal(key("https://www.google.com/search?q=cafe"), "website");
  });

  it("detects YouTube", () => {
    assert.equal(key("https://www.youtube.com/watch?v=abc"), "youtube");
    assert.equal(key("https://youtu.be/abc"), "youtube");
    assert.equal(key("https://m.youtube.com/shorts/abc"), "youtube");
  });

  it("detects other social sources", () => {
    assert.equal(key("https://x.com/user/status/1"), "x");
    assert.equal(key("https://twitter.com/user/status/1"), "x");
    assert.equal(key("https://www.facebook.com/somecafe"), "facebook");
    assert.equal(key("https://www.xiaohongshu.com/explore/abc"), "xiaohongshu");
    assert.equal(key("https://maps.apple.com/?q=cafe"), "apple_maps");
  });

  it("does not match lookalike domains", () => {
    assert.equal(key("https://nottiktok.com/x"), "website");
    assert.equal(key("https://tiktok.com.evil.example/x"), "website");
  });

  it("falls back to Website with the domain", () => {
    assert.deepEqual(detectSource("https://www.kichikichi.com/menu"), {
      key: "website",
      label: "Website",
      domain: "kichikichi.com",
    });
  });

  it("returns readable labels", () => {
    assert.equal(detectSource("https://youtu.be/abc").label, "YouTube");
    assert.equal(sourceLabel("google_maps"), "Google Maps");
    assert.equal(sourceLabel("something_unknown"), "Website");
  });
});
