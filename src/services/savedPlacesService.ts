import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewSavedPlace, SavedPlace } from "../types/savedPlace.js";

/**
 * All database access for saved places lives here. The Telegram code never
 * talks to Supabase directly, so storage can change without touching the bot.
 *
 * supabase-js sends values as parameters through the PostgREST API, so user
 * input is never concatenated into SQL.
 */

const TABLE = "saved_places";

export const DEFAULT_RECENT_LIMIT = 10;

export class SavedPlacesService {
  constructor(private readonly db: SupabaseClient) {}

  async saveItem(item: NewSavedPlace): Promise<SavedPlace> {
    const { data, error } = await this.db
      .from(TABLE)
      .insert({
        telegram_user_id: item.telegramUserId,
        telegram_username: item.telegramUsername,
        url: item.url,
        original_message: item.originalMessage,
        source: item.source,
        domain: item.domain,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save item: ${error.message}`);
    return data as SavedPlace;
  }

  /** Newest first. Always filtered by user, so people only ever see their own saves. */
  async getRecentItems(telegramUserId: number, limit = DEFAULT_RECENT_LIMIT): Promise<SavedPlace[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select("*")
      .eq("telegram_user_id", telegramUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to load saved items: ${error.message}`);
    return (data ?? []) as SavedPlace[];
  }
}
