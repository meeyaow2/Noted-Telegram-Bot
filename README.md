# Noted 📌 — Telegram bot for places you want to visit

Send or forward a link (TikTok, Instagram, Google Maps, YouTube, any website) to the bot and it saves it. Send `/saved` to see your 10 most recent saves.

This is the MVP: **send link → bot saves link → get it back later.** No AI, collections, groups or apps yet; the code is laid out so those can be added later without a rewrite (see [Project structure](#project-structure)).

---

## What you need

- **Node.js 20 or newer.** Check with `node -v` in a terminal. If you don't have it, install the "LTS" version from [nodejs.org](https://nodejs.org).
- A **Telegram** account (the phone or desktop app).
- A free **Supabase** account at [supabase.com](https://supabase.com).

---

## Setup, step by step

### 1. Create your Telegram bot with BotFather

1. In Telegram, search for **@BotFather** (it has a blue verified tick) and open a chat.
2. Send `/newbot`.
3. Give it a display name, e.g. `Noted`.
4. Give it a username ending in `bot`, e.g. `amanda_noted_bot`. It has to be unique across Telegram.

### 2. Get the Telegram bot token

When step 1 finishes, BotFather replies with a message containing a token that looks like:

```
123456789:AAH4k...long string...
```

That is your **`TELEGRAM_BOT_TOKEN`**. Treat it like a password: anyone with it can control your bot. If it ever leaks, send `/revoke` to BotFather to get a new one.

### 3. Create a Supabase project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**, pick a name (e.g. `noted-bot`), set a database password (save it somewhere; the bot doesn't need it), and pick the region closest to you.
3. Wait a minute or two while it's created.

### 4. Run the SQL to create the table

1. In your Supabase project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this project, copy everything, and paste it in.
4. Click **Run**. You should see "Success. No rows returned".
5. Open **Table Editor** in the sidebar: you should now see a `saved_places` table.

### 5. Find your Supabase credentials

1. In Supabase, open **Project Settings** (gear icon) → **Data API** (or **API**). Copy the **Project URL**, e.g. `https://abcdefghijkl.supabase.co`. That is your **`SUPABASE_URL`**.
2. Go to **Project Settings** → **API Keys**. Copy the **secret** key (starts with `sb_secret_...`). On older projects this is called the **`service_role`** key under "Legacy API keys"; either works. That is your **`SUPABASE_SERVICE_ROLE_KEY`**.

> ⚠️ Use the **secret / service_role** key, not the "publishable" / "anon" key. The table is locked so the public key can't read it; only the server-side key can. Never put this key in a website, app or anywhere public.

### 6. Set up `.env`

In the project folder, copy the example file:

```bash
cp .env.example .env
```

(On Windows PowerShell: `Copy-Item .env.example .env`.)

Open `.env` in a text editor and paste your values after the `=` signs, with no quotes or spaces:

```
TELEGRAM_BOT_TOKEN=123456789:AAH4k...
SUPABASE_URL=https://abcdefghijkl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
LOG_LEVEL=info
```

`.env` is listed in `.gitignore`, so it won't be committed to Git.

#### What each environment variable does

| Variable | Required | What it's for |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Lets the code log in as your bot to receive and send messages. |
| `SUPABASE_URL` | Yes | The address of your Supabase project, so the bot knows which database to use. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side key that lets the bot read and write the `saved_places` table. Bypasses Supabase's row-level security, so keep it secret. |
| `LOG_LEVEL` | No | How chatty the terminal output is: `debug`, `info` (default), `warn` or `error`. |

### 7. Install dependencies

In a terminal, inside the project folder:

```bash
npm install
```

### 8. Run the bot locally

```bash
npm run dev
```

You should see:

```
... [INFO] Bot @amanda_noted_bot is running. Press Ctrl+C to stop.
```

The bot only works while this command is running. `npm run dev` restarts automatically when you edit code. Press **Ctrl+C** to stop.

(For a production-style run: `npm run build` then `npm start`.)

---

## Testing it in Telegram

Open a chat with your bot (search its username, or tap the `t.me/...` link BotFather gave you).

### Test `/start`

Send `/start`. Expected reply:

> 👋 Send me places you want to remember.
>
> You can send links from TikTok, Instagram, Google Maps, YouTube, or websites and I'll save them for you.
>
> Use /saved to see your recent saves.

### Test saving a URL

- Send a link, e.g. `https://maps.app.goo.gl/abc123`. Expected: `Saved ✨` and `Source: Google Maps`.
- Forward a post from a channel that contains a link, or share a TikTok/Instagram link from those apps straight to the bot. Links in captions and hidden "text links" are picked up too.
- Send plain text with no link, e.g. `hello`. Expected: `Send me a link to a place you want to save ✨`.
- In Supabase **Table Editor** → `saved_places`, you should see a new row for each save.

### Test `/saved`

Send `/saved`. Expected:

```
Your recent saves 📌

1. Google Maps
https://maps.app.goo.gl/abc123

2. TikTok
https://vm.tiktok.com/...
```

With nothing saved yet, you get a friendly "Nothing saved yet 🌱" message instead.

---

## Automated checks

```bash
npm run typecheck   # TypeScript type checking
npm test            # unit + bot behaviour tests (no Telegram or Supabase needed)
npm run build       # compile to dist/
```

The tests cover URL detection and validation, source detection, message formatting, and the bot's replies to `/start`, links, non-links, `/saved` (including that users only see their own saves) and database errors, using a fake in-memory database.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing environment variable ...` | `.env` is missing or a value is empty. Check step 6. |
| `401: Unauthorized` | The Telegram token is wrong. Copy it again from BotFather. |
| `409: Conflict: terminated by other getUpdates request` | The bot is running somewhere else too (another terminal or computer). Stop the other one. |
| Bot replies "I couldn't save that just now" | Check the terminal for the error. Usually the SQL wasn't run (step 4) or you used the anon/publishable key instead of the secret key (step 5). |
| Bot doesn't reply at all | Make sure `npm run dev` is still running, and that you're messaging it in a private chat (groups are ignored for now). |

---

## How it behaves

- Works in **private chats only** for now; it ignores groups.
- Finds links in message text, captions (forwarded photos/videos) and hidden text links.
- Only `http`/`https` links with a real domain are accepted. Links with embedded passwords, `localhost`, IP addresses or over 2048 characters are rejected.
- If a message has several links, each is saved (up to 10 per message).
- Saving the same link twice creates two entries (de-duplication can come later).
- `/saved` always filters by your Telegram user ID, so you only ever see your own saves.
- Errors are logged in the terminal; users get a short, friendly message, never error details or secrets.

---

## Project structure

```
supabase/
  schema.sql                  Database table + index. Run once in Supabase.
src/
  index.ts                    Entry point: loads config, connects, starts the bot.
  config.ts                   Reads and validates environment variables.
  bot/
    createBot.ts              Registers commands/handlers + global error handler.
    messages.ts               All user-facing text and list formatting.
    commands/
      start.ts                /start
      saved.ts                /saved
    handlers/
      message.ts              Any other message: find links → save → confirm.
  services/
    savedPlacesService.ts     All database reads/writes (saveItem, getRecentItems).
  db/
    supabase.ts               Creates the Supabase client.
  utils/
    urls.ts                   extractUrls, normaliseUrl (validation).
    source.ts                 detectSource (TikTok, Instagram, Google Maps, ...).
    logger.ts                 Tiny console logger with levels.
  types/
    savedPlace.ts             Shape of a saved row.
    placeExtraction.ts        Planned input/output for the future AI step.
```

The rule of thumb: **`bot/` knows about Telegram, `services/` knows about the database, `utils/` knows about neither.**

### Where future features plug in

- **AI place extraction:** add `src/services/aiService.ts` implementing `PlaceExtractor` from `types/placeExtraction.ts`. Call it from `bot/handlers/message.ts` after the save (the spot is marked with a comment), then add an `updatePlaceDetails()` method to `SavedPlacesService`. New columns go in a SQL migration; the planned ones are listed in `schema.sql`.
- **Automatic collections:** new `collections` table + `collectionsService.ts`. After the AI step fills in city/country/category, the same post-save spot assigns the item to a matching collection (creating it if needed, e.g. "Kyoto" or "Singapore Food"), so users never sort anything by hand. Commands to browse collections go in `bot/commands/`.
- **Natural-language search:** a new handler that runs before the link handler for messages without URLs.
- **Shared groups:** the bot is limited to private chats in `createBot.ts`; group support starts there, plus a `chat_id` column.
- **Mini App / web UI:** would read the same Supabase table through its own API, without touching the bot.

## Tech

TypeScript, Node.js, [grammY](https://grammy.dev) (Telegram Bot API), [supabase-js](https://supabase.com/docs/reference/javascript), dotenv. Dev only: `tsx` (run TypeScript directly) and `typescript`.
