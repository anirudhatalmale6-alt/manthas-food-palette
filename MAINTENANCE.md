# Looking after the site

Written for someone who can read code but hasn't done much web work.
Nothing here needs a local setup — every change can be made in the browser,
on github.com, by clicking the pencil icon on a file and pressing
**Commit changes**. The live site rebuilds itself about a minute later.

Live site: https://anirudhatalmale6-alt.github.io/manthas-food-palette/

---

## The shape of it

| File | What it is |
|---|---|
| `index.html` | All the text and page structure |
| `assets/style.css` | All the styling. Plain CSS, no build step, no framework |
| `assets/app.js` | The lightbox, and the code that fills the galleries |
| `data/posts.json` | The feed. **Written by the robot — never edit by hand** |
| `data/overrides.json` | Your manual choices. **This is the one you'll edit** |
| `scripts/sync-instagram.js` | Reads Instagram, writes `posts.json` |
| `.github/workflows/sync-instagram.yml` | Runs the above twice a day |

There is no database and no server. The whole site is three files plus
pictures, which is why it costs nothing to host and can't really break.

---

## Changing words on the page

Open `index.html`, find the sentence, change it, commit. That's the whole job.

The pieces you're most likely to want:

- The big headline — search for `Three things`
- The three section blurbs — search for `sec-note`
- The commissions line in the Art section — search for `sec-cta`
- Phone, email, WhatsApp — search for `contact-list`

**Careful with `&mdash;` and `&rsquo;`** — those are an em dash and an
apostrophe. Leave them as they are and type your text around them.

## Changing a phone number or email

Two places each time: the text people see, and the link behind it.

```html
<a href="tel:+6281291612480">+62 812 9161 2480</a>
<a href="mailto:suvarnamantha@icloud.com">suvarnamantha@icloud.com</a>
<a href="https://wa.me/6281291612480">+62 812 9161 2480</a>
```

The WhatsApp link has no `+` and no spaces. The others keep the `+`.

## Choosing the picture at the top

In `data/overrides.json`:

```json
"heroPost": null
```

- `null` → the site uses her most recent photograph, by itself, forever.
- `"17908223054189811"` → that exact post is pinned there until you change it.

To find a post's id, ask me, or look it up in `data/posts.json` — each post
has its `permalink` right next to its `id`.

After editing, the picture changes at the next sync (within twelve hours), or
immediately if you run the sync yourself — see below.

## Moving a post between Food and Art

Also `data/overrides.json`:

```json
"sections": {
  "17950446697588717": "art",
  "17942856493589469": "art"
}
```

Add a line with the post id and either `"food"` or `"art"`. Anything listed
here beats the automatic sorting, permanently.

## Making the feed update right now

GitHub → **Actions** tab → **Sync Instagram feed** → **Run workflow**.
Takes about a minute. It runs on its own twice a day anyway.

## Showing like and comment counts

In `data/posts.json` the robot writes `"showStats": false`. Changing that by
hand works until the next sync overwrites it — if you want them on
permanently, tell me and I'll change it in the script.

---

## The two things that can actually go wrong

**1. The Instagram connection expires.**
The access token lasts 60 days. The robot renews it on every run, so in normal
use this never bites. But if the sync stops running for two months — or if
Suvarna changes her Instagram password, or switches the account back to
Personal — the connection dies and the galleries freeze at their last good
state. They won't go blank; the site keeps showing whatever it last fetched.

Fixing it means generating a new token at developers.facebook.com and putting
it in **Settings → Secrets and variables → Actions → `IG_TOKEN`**. Message me
and I'll walk you through it, it's the same ten minutes as the first time.

**2. A sync fails.**
The Actions tab shows a red cross. The site doesn't change — the script is
written to leave the last good feed in place rather than publish something
broken. So a failed sync is never urgent.

---

## What is deliberately not automatic

- **Both forms** (contact and astrology) are not connected to a mailbox yet.
  Submitting one says so honestly rather than pretending to send.
- **121 of the 220 reels cannot play on the site.** Instagram doesn't release
  the video file for those. They show the cover picture and a link instead.
  This is their restriction, not a setting I can change.

---

Anirudha Talmale, September 2026. Message me on Freelancer with anything —
including "I've broken it", which you almost certainly haven't.
