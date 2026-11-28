# Desktop Tamagotchi

[한국어](README.md) · **English**

Raise a **pixel pet** that wanders across your desktop. Feed it, play with it, wash it, take it for walks, collect new friends with gacha, dress it up with hats and accessories, and build **friendship levels** with your friends.
For developers there is a bonus: the pet looks at the `localhost` pages you are building and tells you in a speech bubble about **basics you may have missed** (image alt text, button names, text contrast, keyboard access …).

![Pets wandering the desktop: 26 animals from common to legendary, and the silhouettes of 5 hidden animals you can only meet through gacha](docs/images/hero.svg)

> 🐣 **v0.18.0** · Windows 10/11 · macOS (preview) · Free (MIT) · [Get the latest version](https://github.com/junhooo111/desktop-tamagotchi/releases/latest)

## Put your pet on your GitHub profile (1 minute)

Log in with your GitHub account and **your pet moves on your GitHub profile.** It uses GitHub login only (no password), and on any PC with the same account you can keep raising the same collection.

1. Install the app, right-click the pet → **`☁ Log in with GitHub…`** and approve in the browser (first time only).
2. Right-click → **`☁ your name` → `Copy card URL for GitHub profile`**. A line like this is copied:

   ```markdown
   ![Desktop Tamagotchi](https://bqsidhjdxoxtrmmymwej.supabase.co/functions/v1/card?user=YOUR_GITHUB_NAME)
   ```
3. On GitHub, paste it into the `README.md` of **your profile repository** (`yourname/yourname`, a public repo with a README) and save. If this is your first time, see [Creating your profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme).

- The card is **drawn by the server**, so it updates with your latest level and pet even when the app is closed (GitHub caches images for a few minutes).
- The card shows your GitHub name, your pet (with its color, accessory, name, and appearance), and your streak, codex, achievement, fixed-problem, quiz, and tip counts. No email and no currency. The streak is based on the last day the app uploaded its values, so it shows 0 if you do not open the app for more than two days. To hide it, turn off **"Show my name in rankings"** under `🏆 Rankings…` (the card disappears too).

## At a glance

| | |
|---|---|
| What it is | A pet that wanders the screen, hangs from your mouse, and climbs walls. It starts as an egg and grows into a baby, then an adult |
| Collecting | Collect 31 animals through gacha in 6 rarity grades (Common, Uncommon, Rare, Special, Legendary, Hidden). A roulette spins and stops on your pull (5 hidden animals keep even their names secret) |
| Dressing up | 28 accessories, 6 neck items, 5 effects and 3 colors in 6 rarity grades, earned through achievements or gacha. A closet-style screen lets you try them on |
| Together | Add friends by GitHub username, wave and gift tickets to raise your **friendship level**, and both of you get tickets at every level-up. Buy and sell pets in the auction house |
| Platforms | **Windows 10/11 (64-bit)**, macOS (preview) |
| Requirements | Just install it (no admin rights, no Node.js) |
| Internet | Not needed unless you log in (only used to check for updates and news). Gacha and rankings need login |
| Account (optional) | Log in with GitHub to keep the same collection on any PC, see rankings, and use the profile card. Everything still works without logging in |
| Language | Korean and English. Pick in Settings (default follows your PC) |

## Install

### Windows

1. Download `Desktop-Tamagotchi-Setup-<version>.exe` from the **[Releases page](https://github.com/junhooo111/desktop-tamagotchi/releases/latest)**. (`.blockmap` and `latest.yml` are for auto-update; you do not need them.)
2. Double-click it. It installs without a setup window and the pet appears when it finishes. No admin rights are needed, and shortcuts are added to the Start menu and desktop.
3. **If "Windows protected your PC" appears**: this personal project has no code-signing certificate. Click **`More info`** → **`Run anyway`**.

### macOS (preview)

1. Download the file for your Mac: Apple Silicon (M1 and later) = `...-mac-arm64.zip`, Intel = `...-mac-x64.zip`.
2. Unzip and move `Desktop Tamagotchi.app` to **Applications**.
3. If it is blocked the first time, run this in Terminal and then **right-click → Open**:

```
xattr -cr "/Applications/Desktop Tamagotchi.app"
```

It is unsigned, so this step is needed. New versions are downloaded by the app and applied when you quit. It has not been tested enough on Macs, so please tell us if anything looks wrong.

### Uninstall and data

- Uninstall: Windows `Settings ▸ Apps ▸ Installed apps` → remove `Desktop Tamagotchi`.
- Pet data lives in `%APPDATA%\desktop-tamagotchi` (on Mac `~/Library/Application Support/desktop-tamagotchi`) and **survives uninstalling and reinstalling.** To start over, quit the app and delete that folder.
- To build the installer yourself, see the [developer docs](docs/development.md).

## Getting started

1. After installing, an **egg** appears. (An icon also appears in the tray at the bottom right; press `^` if you cannot see it.)
2. **Click (pet)** the egg and it warms up, **hatching after about 10 clicks**. Which animal appears is random only the first time.
3. A baby wanders the screen. Click to pet it, and **right-click** to feed it and play.
4. In `🎟 Gacha…` use the **3 starter tickets** for your first pull. Take pulled animals out to raise them in `My pets…`.
5. To have the pet appear every time you turn on your PC, right-click → **`Launch at login`**.

### Controls

| What you want | How |
|---|---|
| Pet it | **Click** the pet (it works once per 30 seconds; for an egg once per 5 seconds) |
| Open the menu | **Right-click** the pet or the tray icon |
| Move it | **Drag** the pet and drop it; it falls to the floor |
| See its status | Right-click → the header at the top of the menu (name, level, bars) |
| Quit | Right-click → `Quit` |

Clicks on the transparent part around the pet **pass straight through to the window below**, so it does not get in your way.

## Caring for your pet

| Action | Result | Gain |
|---|---|---|
| Pet (click) | Hearts float up | Mood +3, XP +1 |
| Feed | It eats in front of you; it will not eat when full (90+) | Fullness +30, XP +5 |
| Play | It hops or rolls; it will not play when too hungry (under 15) | Mood +25, XP +8 |
| **Wash** | Soap bubbles pile up | Cleanliness full, mood +5, XP +4 |
| **Take a walk** | It **follows your mouse** for 1 to 2 minutes, then sits and rests for 2 minutes | Mood +15, XP +6 when done |
| **Let it play alone** | It only plays near where you right-clicked (about 220px). Release with `Let it roam freely` | Resets on restart |

## Growth and levels

| Stage | Condition |
|---|---|
| 🥚 Egg | Under 20 XP. It bounces; you can only pet it |
| 🐣 Baby | 20 XP up to level 5 |
| 🐾 Adult | Level 5 or higher (160 XP) |
| ✨ Legend | **Legendary and Hidden animals only** evolve once more at level 10, with a golden shimmer |

An animal from gacha comes out as a **baby**, not an egg. Rank colors change every 10 levels (Newbie, Skilled, Veteran, Master, Grandmaster, Mythic).

## Collecting animals: gacha and My pets

Right-click → **`🎟 Gacha…`** (pulling only) and **`My pets…`** (see and switch your animals) are separate windows. Animals come **only from gacha**. Pulled animals gather in `My pets` and you **take out one** to raise; the others have their time stopped. Animals you have not met yet are in `Codex & records…`.

### The roulette

When you pull an animal or a cosmetic, a strip of cells **spins sideways.** It slows down, hesitates between two cells for a moment, then settles on one (about 5 seconds).

- The result is **decided first by the server according to the odds**; the roulette only shows it landing in the center.
- Passing cells are not `???` but **slightly darkened animals**, and they glow in their grade color (Common white, Uncommon green, Rare blue, Special purple, Legendary orange, Hidden rainbow), so you can see high grades flying by.
- The result reads like **"Fox appeared! (Common)"** with the grade name in color. Hidden shimmers in rainbow.
- With Windows "Animation effects" turned off, the roulette finishes almost at once.

### 31 animals in 6 grades

| Grade (color) | Animals | Odds each | Grade total |
|---|---|---|---|
| <img src="docs/images/grades/common-en.svg" height="22" alt="Common"> | Rabbit · Cat · Dog · Turtle · Chick · Duck · Fox | about 7.1% | 50% |
| <img src="docs/images/grades/uncommon-en.svg" height="22" alt="Uncommon"> | Hamster · Bear · Pig | 8% | 24% |
| <img src="docs/images/grades/rare-en.svg" height="22" alt="Rare"> | Owl · Sheep · Otter · Alpaca · Parrot · Raccoon | about 2.5% | 15% |
| <img src="docs/images/grades/special-en.svg" height="22" alt="Special"> | Panda · Penguin · Red panda · Arctic fox · Peacock · Lion | about 1.17% | 7% |
| <img src="docs/images/grades/legend-en.svg" height="22" alt="Legendary"> | Dragon · Unicorn · Kumiho (nine-tailed fox) · Griffin | 0.75% | 3% |
| <img src="docs/images/grades/hidden-en.svg" height="22" alt="Hidden"> | 5 secret animals shown as `???` | 0.2% | 1% |

- **Pity**: if no Legendary appears, the 50th pull always gives one (Hidden has no pity and only comes at its low odds). The counter resets when a Legendary or Hidden appears. The gacha window shows how many pulls are left.
- Adding animals never changes a grade's total, only the per-animal odds inside that grade.
- **A duplicate** raises that animal's count and gives +30 XP.
- An animal pull costs **3 tickets**; a cosmetic pull costs **2**. When logged in, the odds and results are decided by the **server**.

### How to get tickets

| Way | Amount |
|---|---|
| Starter gift | 3 on first launch |
| Check-in | 1 on the first launch each day |
| Leave it running | 1 per 6 hours of running (up to 1 a day) |
| Care | 1 per 25 petting, feeding, playing, washing, or walks |
| Level up | 2 at levels 5, 10, 15… and 1 at levels 8, 13, 18… (per animal) |
| Update gift | 2 the first time you launch a new version |
| Gift box | A gift box comes 2 to 3 times a day, with a 15% chance of 1 ticket |
| **Friends** | **Both of you** get tickets when your friendship level goes up (1 to 5 at levels 2 to 10, at most 100 in your lifetime). You can also **gift** 1 ticket to a friend → [Friends](#friends-and-friendship-levels) |

### My pets window

Right-click → **`My pets…`**. It shows only the animals you own: **the one you are raising comes first**, then the rest by level, each with level, stage, name, and a grade tag. **`Take out`** saves the current animal's state and puts it to rest. Names are set in [Customize](#customize).

### Gift box

A few times a day the pet stops what it is doing, **runs to the center of the monitor you are looking at**, and waits holding a gift box. Click the box to open it: it may hold a ticket, XP, or poop (no prize). If you do not click it, the box disappears after 5 minutes.

### Auction house and game money (logged-in players)

When logged in you can buy and sell pets with other players. Right-click → **`Online` tab → `🏪 Auction house…`**

- **Game money** is separate from tickets. It is used only in the auction house and cannot be cashed out.
- **How to earn it** (amounts and daily caps are set by the server):
  - Care: 5 per 10 care actions (up to 100 a day)
  - Achievements: 30 each (up to 300 a day)
  - **GitHub contributions**: 2 each (up to 40 a day)
  - **Learning**: card confirmation 10, quiz bonus 5, fixing a problem 20, reading an FE tip 2 (up to 150 a day)
- **Buying**: pets for sale are listed cheapest first; buying makes it yours immediately.
- **Selling**: list a pet from the `Sell my pets` tab at a price from 1 to 1,000,000. When it sells you receive the **full price with no fee**. You can remove a listing with `Remove`. You cannot sell your last pet.
- **Sale alerts**: when one of your pets sells, the pet tells you who bought it and for how much (checked every 5 minutes). Grades are shown in listings too.
- GitHub contributions are checked right after login and every hour (`☁ your name` → `Check GitHub contributions now`). It uses the GitHub contribution calendar, so pull requests and issues count too.

## Daily missions

When logged in you get four missions each (UTC) day. Right-click → **`Online` tab → `Daily missions`** shows your progress.

| Mission | Goal |
|---|---|
| Pet it | 3 times |
| Care (feed, play, wash, stroll) | 5 times |
| Read an FE tip | 1 |
| With a friend (wave, gift, walk) | 1 time |

Finish all four for **1 ticket**, with streak bonuses (+1 on day 3, +2 on day 7, +3 every 7 days from day 14). Once a day; the server decides the amount.

## Friends and friendship levels

When logged in you can become **friends** with other players. Right-click → **`Online` tab → `👥 Friends…`** (a number badge appears when you have incoming requests).

### Making friends

1. Type your friend's **GitHub username** at the top and press `Send request`. They must have logged in to this app at least once.
2. When they **accept** under `Requests received`, you are friends. If you both send a request, you become friends right away.
3. Use `Cancel request` for sent requests, `Decline` for incoming ones, and `Remove friend` for friends.
4. The pet tells you in a speech bubble about new requests and new friends (checked every 5 minutes).

### Friendship level

Each friend has a **friendship Lv** (1 to 10) with a level badge (its color changes as it rises), a progress bar to the next level, and the number of days together.

| Way to raise it | Friendship |
|---|---|
| **👋 Wave** | Once a day each. +3, +1 more per 30 days of friendship (up to +3 more), and +2 if you both wave the same day |
| **🎟️ Gift a ticket** | Sending 1 ticket gives +5. Once per friend per day, and three times a day in total |
| **🏪 Auction trade** | +10 when friends trade a pet |
| **🐾 Take along** | +3 once an hour (up to 6 a day) |
| **🎀 Gift a cosmetic** | +5, up to 3 a day |

### 🐾 Taking a friend's pet along

Press **`🐾 Take along`** on a friend's card and their featured pet follows your pet at **half size** (one friend at a time). No consent is needed from the friend; only the species and level (look) are read.

- While together, **once an hour** (up to 6 a day): +6 XP for your pet, +6 XP for the friend's pet (collected when they open the app) and +3 friendship. The server decides the amounts and the count.
- The pet hides while yours climbs a wall or hangs from the mouse.
- Turn it off under `Settings → Friend pet` (the bonus stops too), or press `🐾 Send home` on the friend's card.

- A pair can earn at most **40** friendship a day (anti-abuse).
- **Friend news**: your pet tells you when a friend gets a Legendary or Hidden animal or cosmetic (checked every 5 minutes; animal names stay secret, only the grade is shown).
- Friendship needed per level: 0 · 20 · 60 · 120 · 200 · 320 · 480 · 700 · 1000 · 1400.
- **Both of you get tickets at every level-up**: Lv2 and 3 = 1, Lv4 to 6 = 2, Lv7 and 8 = 3, Lv9 = 4, Lv10 = 5. Each level pays once, and one person can receive at most **100** tickets from friend levels in total.
- Your friend's featured pet (species and level) shows on their card.
- There are achievements too: **First friend, Friend collector (3 friends), Best buddies (Lv3), Close friends (Lv5), Soul mates (Lv10)**.
- You can have up to 20 sent requests at once, and friends plus requests together are capped at 100.

## Customize

Right-click → **`My pet` tab → `Customize…`**. The **preview and name field stay pinned at the top** while the list below scrolls, so you always see what your pet is wearing. Everything appears as closet tiles, each showing **your pet wearing it**, with a **grade-colored line** under each tile. Hats sit on top of the head **in the adult form too**. You can name your pet there, and **names you give are never translated**.

- **Color**: pastel / deep / mono (body color only).
- **Accessories** (28): hats, glasses, wings and more. Achievements unlock some, and the rest come only from cosmetic gacha.
- **Neck items** (6): bell collar, scarf, bow tie, pearl necklace, star necklace, gold chain.
- **Effects** (5): sparkles, hearts, music notes, snowflakes, and a **flame aura** that wraps around your pet's outline.
- **Props** (12): ball, bone, fish, balloon, flower pot, butterfly, lantern, dragon egg, ball of yarn, kite, snowman, rain cloud. Pull-only and tradable. Ground props (ball, bone, fish, pot, dragon egg) bounce in front of your pet; the balloon, butterfly and lantern float at head height. They hide while your pet climbs a wall or hangs from the mouse.

### Cosmetic gacha and grades

A cosmetic pull costs **2 tickets**, and cosmetics have the same **6 grades** as animals (Common, Uncommon, Rare, Special, Legendary, Hidden). 36 cosmetics can come out of gacha (6 achievement-only accessories are excluded).

- **Only items you do not own come out.** Nothing repeats, and once you own all of them you cannot pull more.
- A grade is chosen first **among the grades that still have items you do not own** (Common 50 · Uncommon 24 · Rare 15 · Special 7 · Legendary 3 · Hidden 1), then one item of that grade. Once you finish a grade, the rest share the odds.
- **Pity**: if no Legendary appears, the 25th pull always gives an unowned Legendary (unless you own them all).
- The roulette spins here too: passing cells glow in their grade color, and the result reads like **"Got Witch hat! (Rare)"**. Legendary and Hidden results show an **animated aura**.
- **Special and above** get extra **1-pixel detail** (bright and dark faces, gem sparkles, sparks).

| Grade | Items |
|---|---|
| <img src="docs/images/grades/common-en.svg" height="22" alt="Common"> | Ribbon · Sprout · Flower · Cap · Beret · Beanie · Bandana · Bell collar · Scarf |
| <img src="docs/images/grades/uncommon-en.svg" height="22" alt="Uncommon"> | Party hat · Sunglasses · Chef hat · Santa hat · Cowboy hat · Headphones · Pastel color · Bow tie · Sparkles · Hearts |
| <img src="docs/images/grades/rare-en.svg" height="22" alt="Rare"> | Wizard hat · Halo · Pirate hat · Knight helmet · Deep color · Pearl necklace · Music notes · Snowflakes |
| <img src="docs/images/grades/special-en.svg" height="22" alt="Special"> | Crown · Devil horns · Unicorn horn · Mono color · Star necklace |
| <img src="docs/images/grades/legend-en.svg" height="22" alt="Legendary"> | Wings · Flame crown · Gold chain · Flame aura |

Achievements unlock colors and accessories (the codex unlocks the crown, fixing many problems unlocks wings, a streak unlocks the flower and halo).

## Inspecting your pages (for developers)

The pet looks at `localhost` pages you have open every 10 seconds and finds **50 kinds of basics** that are easy to miss: image alt text, button and link names, input labels, document language, heading order, tap target size, text contrast, horizontal overflow, duplicate ids, blocked zoom, table headers, search description, keyboard focus, color-only links, captions, autoplay sound, image size and lazy loading, render-blocking scripts, mixed content, and more.

The rules are grouped by **who they are for**: screen reader users, keyboard and hand users, vision (low vision, color blindness), hearing, cognition and time, plus search (SEO), responsive, performance, security, and code quality. In `Settings` → `Rules to check` you can turn whole groups on or off (for example, check only for keyboard users).

When it finds something the pet runs next to it and shows a speech bubble: what is wrong, where, and how to fix it. Click the pet to open a **learning card** with why it matters, a fix, a code example, and a short quiz. Confirming the card gives XP (and game money when logged in). It also tells you one of **69 FE tips** every 20 minutes (performance, CSS, JS/TS, React, security, accessibility, network, SEO).

It only looks at `localhost`, `127.0.0.1`, and `*.localhost` pages. Right-click → `Inspection tools` has `Try inspection (open demo page)` and a Chrome extension for your everyday Chrome.

## Right-click menu at a glance

Right-click the pet to open a **pixel-style menu**. You can use the mouse or the keyboard (arrow keys, Enter, Esc). Clicking outside closes it.

| Area | What is in it |
|---|---|
| **Header** | Pet name, level rank, and bars for XP, fullness, mood, and cleanliness (the old `Show status`) |
| **5 care buttons** | Pet · Feed · Play · Wash · Walk |
| Tab **My pet** | Customize… · My pets… · 🎟 Gacha… (ticket count) · Codex & records… · Let it play alone (here only) / Let it roam freely · Export profile card… |
| Tab **Online** | 👥 Friends… · 🏪 Auction house… · 🏆 Rankings… (logged-in players) · ☁ Log in with GitHub / your account (sync, contribution check, copy card URL, log out) |
| Tab **Dev** | Inspect now · Inspection results… · FE tip of the day · Inspection tools (inspection browser, demo page, Chrome extension folder) |
| **Bottom row** | ⚙ Settings · 🔔 News · ⋯ More (check for updates, launch at login, preview moves (test), version) · ⏻ Quit |
| When a new version is ready | An **Install version … and restart** line appears under the header |

The tray icon menu has the same content (tabs appear as submenus).

## Settings and updates

Right-click → **`Settings…`**. Changes apply and save immediately.

| Item | Choices | Description |
|---|---|---|
| Pet size | 1x (default) / 2x / 3x | 1x is about the size of a mouse cursor |
| Page inspection | On / Off | Off means the pet only plays |
| Inspection interval | 5, 10 (default), 30, 60 s | How often open local pages are checked |
| **Language** | Auto (default) / 한국어 / English | Auto follows your PC: Korean if your language is Korean or your region is Korea, otherwise English. Menus, bubbles, windows, inspection cards, and FE tips change |
| FE tip notifications | Off / 10 / 20 (default) / 60 min | How often a tip bubble appears when the pet is idle |
| Rules to check | Per rule or per group | Rules turned off are not reported |
| Auto update | On (default) / Off | Tells you and downloads new versions |
| News | On (default) / Off | The pet tells you about new news |

New versions are downloaded in the background and installed when you quit the pet (or right-click → `Install and restart`).

## Privacy and safety

- **Without logging in, nothing leaves your PC.** There are no analytics or ads, and inspected content is never sent out. (It only reads public files in this repository to check for new versions and news.)
- **If you log in (optional)**, your GitHub name and avatar URL (for display) and your progress (animals, XP, tickets, cosmetics, codex file) are stored on your account on the server (Supabase). Your email is not stored. No password is used (GitHub login), and the login info is encrypted in this PC's secure storage. Rankings, the profile card, and the auction house show only your GitHub name, pet and its look, and scores, and you can turn them off at any time. Friends see only your GitHub name and avatar, your featured pet (species and level), days together, and friendship. Inspected page content is never sent to the server, even when logged in.
- Page inspection looks only at `localhost`, `127.0.0.1`, and `*.localhost` tabs.
- The Chrome extension has minimal permissions (no cookies or history). It only sends a "problem list" to the pet app on this PC, never page content or input values.

## FAQ

**My friend request does not go through.** They must have logged in to the app with GitHub at least once. A leading `@` in the username is fine.

**The roulette takes too long.** Turn off Windows `Settings ▸ Accessibility ▸ Visual effects ▸ Animation effects` and it finishes almost at once.

**The pet does not appear.** Check the tray icon (press `^` to expand). If it is not running, launch `Desktop Tamagotchi` from the Start menu.

**Clicks do not work.** Click the pet itself; the transparent area around it passes clicks through on purpose.

**The installer is blocked.** Click `More info` → `Run anyway` (see Install above).

**I want to start over.** Quit the app and delete the `%APPDATA%\desktop-tamagotchi` folder.

## More

- [Inspection guide](docs/inspection-guide.md) (in Korean)
- [Developer docs](docs/development.md) (in Korean)
- [Releases](https://github.com/junhooo111/desktop-tamagotchi/releases)
