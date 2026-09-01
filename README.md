<div align="center">

<!-- assets/logo.gif — Aster MC logo, animated -->
<img src="./assets/logo.gif" alt="Aster MC" width="220" />

# Aster MC Discord Bot

Welcome system • Giveaways • Button reaction roles • XP/Leveling • Server-info auto-responder

![discord.js](https://img.shields.io/badge/discord.js-v14-8a2be2?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D18-8a2be2?style=flat-square)
![Pterodactyl](https://img.shields.io/badge/hosting-Pterodactyl-8a2be2?style=flat-square)

</div>

---

## Contents

1. [What's included](#1-whats-included)
2. [Create the Discord bot & get your keys](#2-create-the-discord-bot--get-your-keys)
3. [Configure the bot](#3-configure-the-bot)
4. [Install & run locally](#4-install--run-locally-optional)
5. [Reaction roles & giveaways](#5-reaction-roles--giveaways)
6. [Leveling / XP system](#6-leveling--xp-system)
7. [Server-info auto-responder](#7-server-info-auto-responder)
8. [Deploying on Pterodactyl](#8-deploying-on-pterodactyl)
9. [Project structure](#9-project-structure)
10. [Common issues](#10-common-issues)

---

## 1. What's included

- 🎉 **Welcome system** — embed welcome message with dynamic member count, banner image, and a link button to `#commands`.
- 🎁 **Giveaways** — `/giveaway start|end|reroll`, timer-based, 🎉 reaction entry, auto-picks winners.
- 🎭 **Reaction roles (buttons)** — `/reactionroles setup`, click a button to get a ping role, click again to remove it.
- ⭐ **Leveling / XP system** — earn XP by chatting, `!rank` generates an image rank card, `!leaderboard` shows a paginated embed, auto level-up roles.
- 🔧 **Role-gated admin commands** — every `/set-*` config command is locked to one specific admin role, checked by the bot at runtime — not general Discord permissions.
- 🌐 **"IP" auto-responder** — anyone typing a standalone "ip" anywhere, in any channel, gets a clean embed back with your server's connection info.

---

## 2. Create the Discord bot & get your keys

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Name it "N7" (or whatever you like) → go to the **Bot** tab → **Add Bot**.
3. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent** — **required** (welcome messages need this)
   - ✅ **Message Content Intent** — **required** (`!rank`, `!leaderboard`, and the "IP" auto-responder all need to read message text)
4. Copy the **Bot Token** (Bot tab → Reset Token / Copy) → this is your `TOKEN`.
5. Go to **OAuth2 → General** and copy the **Application (Client) ID** → this is your `CLIENT_ID`.
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Roles`, `Send Messages`, `Embed Links`, `Attach Files`, `Manage Messages` (needed to delete `!rank`/`!leaderboard` messages sent outside the configured rank channel), `Read Message History`, `View Channels`
   - Copy the generated URL and open it in your browser to invite the bot to your server.

**Required Gateway Intents (must match `index.js`):**
| Intent | Why |
|---|---|
| `Guilds` | Basic guild/channel data |
| `GuildMembers` (privileged) | Detects new members joining, for the welcome message |
| `GuildMessages` | Message events — XP gain, `!rank`, `!leaderboard`, the IP responder |
| `MessageContent` (privileged) | Required to read message text for the items above |

> ⚠️ Both `GuildMembers` and `MessageContent` must be toggled **ON** in the Developer Portal, or welcome messages, leveling commands, and the IP auto-responder won't work.

**Important bot role placement:** In your server, drag the bot's role **above** every role it needs to assign — the 6 ping roles and all 5 level roles (Rank 1–5). A bot can never grant a role higher than or equal to its own highest role.

---

## 3. Configure the bot

### `.env`
Copy `.env.example` to `.env` and fill it in:

```
TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_server_id_here
PORT=3000
```

- `GUILD_ID` is optional but recommended during setup — with it set, slash commands register **instantly** to your one server. Without it, commands register globally and can take up to an hour to appear everywhere.
- On Pterodactyl, you won't upload a `.env` file at all — see [section 8](#8-deploying-on-pterodactyl) for setting these as **Startup Variables** instead.

### `config.json`
Everything you'll want to tweak later lives here, so you never have to touch code:

```jsonc
{
  "serverName": "Aster MC",
  "themeColor": "#8a2be2",

  "SERVER_IP": "play.astermc.fun",
  "BEDROCK_PORT": "25599",
  "WEBSITE": "https://www.astermc.net/",
  "WELCOME_CHANNEL_ID": "PUT_WELCOME_CHANNEL_ID_HERE",   // or set via /set-welcome-channel
  "COMMANDS_CHANNEL_ID": "PUT_COMMANDS_CHANNEL_ID_HERE", // or set via /set-commands-channel

  "ADMIN_ROLE_ID": "1537165736621908100",  // only this role can use any /set-* command

  "channels": {
    "rules": "1533546447138717866",
    "noPing": "1533539818561081435",
    "survival": "1533539862316191814",
    "updates": "1533539915223273712",
    "giveaway": "1533540164729895813",
    "events": "1543894334091558972",
    "news": "1543894888075108442"
  },

  "reactionRoles": {
    "noPing": "PUT_NO_PING_ROLE_ID_HERE",     // <-- these need ROLE IDs, not channel IDs
    "survival": "PUT_SURVIVAL_ROLE_ID_HERE",
    "updates": "PUT_UPDATES_ROLE_ID_HERE",
    "giveaway": "PUT_GIVEAWAY_ROLE_ID_HERE",
    "events": "PUT_EVENTS_ROLE_ID_HERE",
    "news": "PUT_NEWS_ROLE_ID_HERE"
  },

  "leveling": {
    "xpChannelId": null,
    "levelChannelId": null,
    "levelRoles": {
      "5": "1543914420281811047",
      "10": "1543914583994138634",
      "25": "1543914701849763890",
      "50": "1543914896817791036",
      "75": "1543915065370083348"
    }
  }
}
```

`SERVER_IP` and `BEDROCK_PORT` are already filled in with `play.astermc.fun` / `25599` — update them here any time they change, and both the welcome embed and the IP auto-responder will pick up the new values immediately (no restart needed if you edit through a `/set-*` command; a manual file edit still needs a restart).

**What still needs filling in:**
1. `WELCOME_CHANNEL_ID` — set live with `/set-welcome-channel #your-channel` (see below), no file editing needed.
2. `COMMANDS_CHANNEL_ID` — set live with `/set-commands-channel #commands`.
3. `reactionRoles.*` — these need **role IDs** (e.g. the `@Survival` role), not channel IDs. The channel IDs you gave me are wired into `channels.*` for reference, but reaction roles need actual roles created in Server Settings → Roles. There's no slash command for these yet — set them directly in `config.json` and restart the bot.
4. `leveling.xpChannelId` / `leveling.levelChannelId` — set live with `/set-rank-channel` and `/set-level-channel`. Both default to "unrestricted" / "current channel" if left unset.
5. `leveling.levelRoles` — already pre-filled with your 5 role IDs. Run `/set-level-roles` once the bot is online to confirm/re-apply them (also handy to reset the mapping if it's ever edited by mistake).

### Role-gated `/set-*` commands
**Every single one of these requires the exact role ID in `config.ADMIN_ROLE_ID` (`1537165736621908100`)** — the bot checks for that specific role at runtime, regardless of any other Discord permissions (Administrator, Manage Server, etc.) the member might have. This applies to `/reactionroles setup` too.

| Command | What it sets |
|---|---|
| `/set-welcome-channel channel:#welcome` | `WELCOME_CHANNEL_ID` — where new-member welcome embeds are posted |
| `/set-commands-channel channel:#commands` | `COMMANDS_CHANNEL_ID` — where the welcome embed's button links to |
| `/set-rank-channel channel:#bot-commands` | Restricts `!rank` / `!leaderboard` to that one channel |
| `/set-level-channel channel:#level-ups` | Where level-up announcements are sent |
| `/set-level-roles` | (Re-)applies the fixed Rank 1–5 role mapping |
| `/reactionroles setup` | Posts the button role-picker message in the current channel |

All of these write straight back into `config.json` and take effect **immediately** — no restart required.

### Banner image
Your uploaded Aster MC banner is saved at `assets/aster-banner.png` and is wired into the welcome embed automatically. (The old DriftSMP beach image has been fully removed from the code.)

### Logo
The Aster MC logo is already saved at **`assets/logo.gif`** and wired into the top of this README (`./assets/logo.gif`) — it'll render animated once pushed to GitHub. It's a separate file from the welcome banner (`assets/aster-banner.png`), so the bot's in-Discord welcome embed and this README's logo can look different if you ever want that.

---

## 4. Install & run locally (optional)

```bash
npm install
npm run deploy   # registers all slash commands
npm start        # starts the bot
```

---

## 5. Reaction roles & giveaways

1. Create the six roles in Server Settings → Roles (No Ping, Survival, Updates, Giveaway, Events, News) if they don't exist yet.
2. Copy each role's ID into `config.json` under `reactionRoles`.
3. Restart the bot so it picks up the new config.
4. In the channel where you want the role-picker message, run `/reactionroles setup` (member must have the admin role). This posts one embed with **buttons** — one per role, split across two rows. Clicking a button toggles the role on/off for that member, with an ephemeral confirmation only they can see.
5. To run a giveaway:
   ```
   /giveaway start prize:"Diamond Rank" duration:1h winners:1
   ```
   - `duration` accepts shorthand like `30m`, `2h`, `1d`.
   - `channel` is optional — if omitted, it posts in the configured Giveaway channel.
   - `/giveaway end message_id:<id>` ends one early.
   - `/giveaway reroll message_id:<id>` picks a new winner from an already-ended giveaway.

Giveaway state is saved to `data/giveaways.json`, so it survives a bot restart. Reaction-role buttons don't need any storage: the role to toggle is looked up live from `config.json` every time a button is clicked.

---

## 6. Leveling / XP system

### How XP works
- Every non-bot message in any channel earns a random **15–25 XP**, with a **60 second cooldown per user**.
- Level formula: leveling up from `level` to `level + 1` costs `(level + 1) × 100` XP — Level 0→1 needs 100 XP, Level 1→2 needs 200 XP, Level 2→3 needs 300 XP, and so on.
- Two XP numbers are tracked per user: **current level progress** (`xp`, resets on level-up, shown as `X / Y XP`) and **total XP** (`totalXp`, never resets, and is what the leaderboard is sorted by).
- All XP data lives in `data/levels.json` — plain JSON, not a native-module database (see the Pterodactyl notes below for why).

### `!rank` (prefix command)
Generates a rank-card **image** with `@napi-rs/canvas`: circular avatar with a yellow ring, username, `LEVEL X`, `RANK #X` badge, and a purple gradient progress bar.

### `!leaderboard` (prefix command)
Posts an embed — `🏆 XP LEADERBOARD`, `Earn XP by chatting in any channel · Updated live` — with 10 users per page, a text progress bar per entry, and **Previous / Next** buttons to page through the rest.

### Admin config commands
Covered above in [section 3](#role-gated-set--commands) — `/set-rank-channel`, `/set-level-channel`, `/set-level-roles`, all gated by the admin role.

### Level roles
When a user levels up, the bot automatically grants the highest role they now qualify for and removes any lower-tier level role, so members only ever hold **one** rank role at a time:

| Level reached | Role |
|---|---|
| 5+ | Rank 1 — `1543914420281811047` |
| 10+ | Rank 2 — `1543914583994138634` |
| 25+ | Rank 3 — `1543914701849763890` |
| 50+ | Rank 4 — `1543914896817791036` |
| 75+ | Rank 5 — `1543915065370083348` |

Level-up announcements are a clean purple embed: **"GG @user, you reached Level X!"**

---

## 7. Server-info auto-responder

Anyone who types a standalone **"ip"** (case-insensitive — `IP`, `Ip`, `ip` all match, but it uses a word boundary so "trip" or "flip" won't trigger it) anywhere in a message, in any channel, gets a reply embed:

- **Server IP:** whatever `config.SERVER_IP` is currently set to
- **Bedrock Port:** `config.BEDROCK_PORT`
- **Website:** `config.WEBSITE`

There's an 8-second per-channel cooldown built in so it can't be spammed into flooding a channel — if someone spams "ip" repeatedly, only the first one within that window gets a reply. Update the values any time by editing `SERVER_IP` / `BEDROCK_PORT` / `WEBSITE` directly in `config.json` (restart required for a manual file edit) — there's no slash command for these yet since you didn't ask for one, but that'd be an easy follow-up if you want live editing here too.

---

## 8. Deploying on Pterodactyl

This matches the exact egg/panel layout from your screenshots (a parkervcp-style **Generic Node.js** egg).

### File upload (your setup: "User Uploaded Files")
Your panel already has **User Uploaded Files** toggled ON, which is the right setting since you're uploading the bot's files directly rather than pulling from a Git repo. With that:

1. Leave **Git Repo Address**, **Install Branch**, **Git Username**, and **Git Access Token** blank — none of them are used.
2. Leave **Auto Update** off (it only matters for Git-based installs).
3. Upload every file/folder from this project into `/home/container` via the panel's **File Manager** (or SFTP) — **except** `node_modules` and `.env`. Pterodactyl installs dependencies for you, and secrets go in Startup Variables, not a file.
4. **Main File:** set this to `index.js`. Your screenshot shows the field currently containing `*.js`, which is just the example/placeholder text for that field — the startup script uses this value as a literal filename (`/usr/local/bin/node "/home/container/${MAIN_FILE}"`), so it needs to be the real entry point, not a wildcard.
5. **Additional Node Packages** / **Uninstall Node Packages**: leave blank — the startup script already runs `npm install` automatically whenever it finds a `package.json`, which this project has.
6. **Docker Image:** keep **Nodejs 20** selected — matches this project's `"engines": { "node": ">=18.0.0" }` requirement with room to spare.
7. **Startup Command:** leave the default egg script as-is — it already does the right thing (installs dependencies, then runs `node index.js` once Main File is set correctly).

### Startup Variables
In the panel's **Startup** tab, set:
- `TOKEN` → your bot token
- `CLIENT_ID` → your application client ID
- `GUILD_ID` → your server ID (optional but recommended)
- `PORT` → `3000` (or whatever port your instance is assigned — `keepAlive.js` reads `process.env.PORT` automatically)

### Register slash commands
After the first successful boot, register commands once — either:
- Run `npm run deploy` from the panel's **Console**, or
- Use the built-in Node.js console/terminal tab if your panel exposes one.

**Re-run this any time you add or rename a slash command** — which includes right now, since this update adds `/set-welcome-channel`, `/set-commands-channel`, `/set-rank-channel`, and renames the old `/set-xp-channel` to `/set-rank-channel`.

### After first boot
Check the console for `✅ Logged in as ...` — that confirms it's live. From here, editing `config.json` directly and restarting works for anything, but the `/set-*` commands (section 3) update most of it live without ever needing a restart or file re-upload.

### Notes specific to this egg / Pterodactyl in general
- **No native-module databases.** `data/giveaways.json` and `data/levels.json` are plain JSON files, not `quick.db`/SQLite — native-module databases can fail to compile on some Pterodactyl node images.
- **Rank card rendering.** `!rank` uses `@napi-rs/canvas`, which ships prebuilt native binaries for common Linux server architectures — it installs via plain `npm install` without needing system libraries like `cairo`/`pango`, which are exactly the kind of thing that's painful to add inside a container like this one.
- `keepAlive.js` binds a small Express server to `process.env.PORT` — satisfies panels/monitors that expect the process to hold a port open; it's not something you need to expose publicly.
- If the app shows "stopped unexpectedly" right after boot, check `TOKEN` is set correctly in Startup Variables first — a missing token logs a clear error and exits cleanly rather than crashing.

---

## 9. Project structure

```
aster-mc-bot/
├── index.js                    # entry point — loads commands/events, logs in
├── deploy-commands.js          # registers slash commands with Discord
├── keepAlive.js                # tiny Express server for Pterodactyl/uptime checks
├── config.json                 # all editable settings (IDs, IP, port, colors, leveling config)
├── package.json
├── .env.example                 # copy to .env locally (not used on Pterodactyl — use Startup Variables)
├── .gitignore
├── assets/
│   ├── aster-banner.png        # welcome embed banner image
│   └── logo.gif                # Aster MC logo, rendered at the top of this README
├── data/
│   ├── giveaways.json          # persisted giveaway state
│   └── levels.json             # persisted XP/level data per user
├── commands/
│   ├── giveaway.js             # /giveaway start|end|reroll
│   ├── reactionroles.js        # /reactionroles setup (button-based, role-gated)
│   ├── setwelcomechannel.js    # /set-welcome-channel
│   ├── setcommandschannel.js   # /set-commands-channel
│   ├── setrankchannel.js       # /set-rank-channel (restricts !rank/!leaderboard)
│   ├── setlevelchannel.js      # /set-level-channel
│   └── setlevelroles.js        # /set-level-roles
├── events/
│   ├── ready.js                 # login confirmation + resumes giveaways
│   ├── guildMemberAdd.js        # welcome embed
│   ├── interactionCreate.js     # routes slash commands + reaction-role/leaderboard buttons
│   └── messageCreate.js         # grants XP, !rank, !leaderboard, IP auto-responder
└── utils/
    ├── config.js                 # live config.json reader/writer (no restart needed for /set-*)
    ├── jsonStore.js              # tiny JSON file "database"
    ├── giveawayManager.js        # giveaway timer/winner logic
    ├── levelStore.js             # XP/level storage and math
    ├── leaderboard.js            # shared leaderboard embed + pagination buttons
    ├── rankCard.js                # canvas rank-card image generator
    └── permissions.js             # role-gate check shared by every /set-* command
```

---

## 10. Common issues

| Symptom | Likely cause |
|---|---|
| Welcome message never sends | `GuildMembers` intent not enabled in Developer Portal, or `WELCOME_CHANNEL_ID` not set — use `/set-welcome-channel` |
| `!rank` / `!leaderboard` / IP responder do nothing | `MessageContent` intent not enabled in Developer Portal |
| Slash commands don't show up | Forgot to run `npm run deploy`, or used global registration (wait up to 1 hour) without setting `GUILD_ID` |
| Reaction role buttons don't apply | The role ID in `config.json` is wrong/missing, or the bot's role is positioned **below** the role it's trying to assign |
| Any `/set-*` command says "no permission" for an admin | These all check for the exact role ID `1537165736621908100`, not general Discord admin permissions — the member needs that specific role, no exceptions |
| Giveaway winner never gets picked | Bot was offline when the timer hit — it auto-resolves on next startup, or run `/giveaway end` manually |
| Level roles not being granted | Bot's role isn't positioned above the level roles, or `/set-level-roles` hasn't been run yet |
| Rank card fails to generate | `@napi-rs/canvas` failed to install — check the console during `npm install` for errors |
| Bot crashes on start with a token error | `TOKEN` missing/incorrect in `.env` or Pterodactyl Startup Variables |
| Node process won't start on Pterodactyl | **Main File** variable is still `*.js` instead of `index.js` — see [section 8](#8-deploying-on-pterodactyl) |

---

Built for **Aster MC** 💜
