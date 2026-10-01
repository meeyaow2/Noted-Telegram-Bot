import type { SourceKey } from "../utils/source.js";

/** A row in the `saved_places` table, as returned by Supabase. */
export interface SavedPlace {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  url: string;
  original_message: string | null;
  source: SourceKey;
  domain: string | null;
  created_at: string;
  // Future columns (place_name, city, country, category, tags, collection_id,
  // latitude, longitude, ai_confidence, thumbnail_url, visited, notes, ...)
  // get added here and in supabase/migrations when they are introduced.
}

/** What the bot needs to provide to save a new link. */
export interface NewSavedPlace {
  telegramUserId: number;
  telegramUsername: string | null;
  url: string;
  originalMessage: string | null;
  source: SourceKey;
  domain: string | null;
}
