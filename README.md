# The Mantha Studio — website design mockup

Portfolio site for Suvarna Mantha: **food**, **art** and **astrology**.
Instagram: [@manthas_food_palette](https://www.instagram.com/manthas_food_palette/)

## What is here
- Food gallery and Art gallery — both fed from Instagram once connected
- A lightbox so posts open **on this website**; visitors need no Instagram account
- Astrology section with a birth-details request form
- Contact section — phone, email, WhatsApp, Instagram, plus a message form

**Status:** design mockup. Gallery images are freely licensed placeholders from
Wikimedia Commons (CC0 / CC BY-SA). Neither form is connected to a mailbox yet;
submitting one says so rather than pretending to send.

**Domain chosen:** themanthastudio.com

**Contact:** +62 812 9161 2480 (phone/WhatsApp, Jakarta) · suvarnamantha@icloud.com

## How the Instagram connection works
- `scripts/sync-instagram.js` reads the feed and writes `data/posts.json`.
- `.github/workflows/sync-instagram.yml` runs it twice a day and commits the
  result, so new posts appear without anyone touching the site.
- The page renders its galleries from `data/posts.json`. The tiles hard-coded
  in `index.html` stay as a fallback for visitors with JavaScript disabled.
- Videos and reels play **in the lightbox, on this site** — no Instagram
  account needed to watch them.

### Sorting food from art
A caption with the whole word `art` goes to the Art gallery; one with
`recipe`/`recipes` goes to Food. `#manthaart` / `#manthafood` override the
plain words. "art" is matched as a whole word on purpose, so *start*, *heart*,
*party* and *smart* cannot drag a dish into the art gallery — see
`scripts/test-classify.js`. Captions matching both words or neither are written
to `data/unsorted.json` for a human to place, never guessed at.

    node scripts/test-classify.js     # 18 checks on the sorting rule

## Next steps
1. Switch the Instagram account to Creator/Business.
2. Create the Meta developer app, authorise it, add `IG_TOKEN` as a repo secret.
3. Wire both forms to a real inbox.
4. Register themanthastudio.com and point it here.

Built by Anirudha Talmale.
