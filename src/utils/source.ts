/**
 * Works out where a link came from (TikTok, Instagram, Google Maps, ...).
 * The `key` is stored in the database; the `label` is shown to users.
 */

export const SOURCES = {
  tiktok: "TikTok",
  instagram: "Instagram",
  google_maps: "Google Maps",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  threads: "Threads",
  xiaohongshu: "Xiaohongshu",
  apple_maps: "Apple Maps",
  website: "Website",
} as const;

export type SourceKey = keyof typeof SOURCES;

export interface DetectedSource {
  key: SourceKey;
  label: string;
  domain: string | null;
}

/** True if `host` is `domain` itself or any subdomain of it. */
function isDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function detectKey(url: URL): SourceKey {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (isDomain(host, "tiktok.com")) return "tiktok";
  if (isDomain(host, "instagram.com") || host === "instagr.am") return "instagram";
  if (isDomain(host, "youtube.com") || host === "youtu.be" || isDomain(host, "youtube-nocookie.com")) {
    return "youtube";
  }

  // Google Maps comes in many shapes: maps.google.com, google.com/maps,
  // google.co.jp/maps, maps.app.goo.gl/..., goo.gl/maps/...
  if (host === "maps.app.goo.gl" || (host === "goo.gl" && path.startsWith("/maps"))) return "google_maps";
  if (/^(www\.|maps\.)?google\.[a-z.]+$/.test(host) && (host.startsWith("maps.") || path.startsWith("/maps"))) {
    return "google_maps";
  }

  if (isDomain(host, "facebook.com") || host === "fb.watch" || host === "fb.me") return "facebook";
  if (isDomain(host, "x.com") || isDomain(host, "twitter.com")) return "x";
  if (isDomain(host, "threads.net") || isDomain(host, "threads.com")) return "threads";
  if (isDomain(host, "xiaohongshu.com") || isDomain(host, "xhslink.com")) return "xiaohongshu";
  if (host === "maps.apple.com" || host === "maps.apple") return "apple_maps";

  return "website";
}

export function detectSource(rawUrl: string): DetectedSource {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { key: "website", label: SOURCES.website, domain: null };
  }
  const key = detectKey(url);
  const domain = url.hostname.toLowerCase().replace(/^www\./, "");
  return { key, label: SOURCES[key], domain };
}

export function sourceLabel(key: string): string {
  return key in SOURCES ? SOURCES[key as SourceKey] : SOURCES.website;
}
