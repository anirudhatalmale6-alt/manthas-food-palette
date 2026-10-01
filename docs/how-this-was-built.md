# How themanthastudio.com was built

A record of the steps that worked, in the order they have to happen, with the
things that caught us out. Written 1 October 2026.

**The site:** https://themanthastudio.com — one page, three sections (Food,
Art, Astrology), fed automatically from Instagram, with an astrology enquiry
form and Suvarna's contact details.

**Total running cost:** about A$21 a year. That's the domain renewal. Nothing
else costs anything.

---

## The order matters

Several steps depend on the one before. Doing them out of order wastes a day:

1. Decide what the site is *for*
2. Switch the Instagram account to Creator
3. Create the Meta app and get a token
4. Build the site and connect the feed
5. Put it on free hosting
6. Buy the domain and point it at the site
7. Make links look right when shared
8. Wire up the form
9. Leave it running

---

## 1. Decide what the site is for

Your brief said it plainly: *the main goal is to provide contact information.*
That one sentence decided the layout. The galleries are the reason people
arrive; the contact details are the reason the site exists. Everything else
followed from that, including dropping the general contact form later — it sat
directly beneath her email, phone and WhatsApp and added nothing.

Worth doing first because it settles arguments later.

## 2. Switch Instagram to a Creator account

**A Personal account cannot be read by any website.** Not by me, not by Wix,
not by anyone — Instagram simply doesn't offer it. This is the hard gate, and
everything downstream waits on it.

In the app: Settings and privacy → Account type and tools → Switch to
professional account → Creator. Posts, captions, followers and username all
survive. It's reversible.

Only the account owner can do this.

## 3. Create the Meta app and generate a token

This is the fiddliest part and the one worth writing down.

1. You need a **Facebook account** — Meta hosts the developer tools. Any
   account works; it isn't shown publicly.
2. developers.facebook.com → My Apps → Create app → name it → choose **Other**,
   then **Business**.
3. Inside the app: Add product → **Instagram** → *API setup with Instagram
   login*.
4. **Assign the Instagram Tester role.** App roles → Roles → Add people →
   Instagram Tester → her username. Then *she* accepts the invite on her phone:
   Settings and privacy → Apps and websites → Tester invites.
5. Back on the setup page: **Add account**, log in as her, approve.
6. **Generate token**, and copy the long string beginning `IGAA…`.

> **This caught us out.** I initially told you to skip the Tester role. The
> setup page itself says to assign it, in text that was hidden behind a dialog
> in your first screenshot. Assign it — the Add account step won't work
> otherwise.

The token is read-only. It cannot post, delete, message anyone or change the
account. She can revoke it any time from Instagram → Apps and websites.

## 4. Build the site and connect the feed

The site is three files — one page, one stylesheet, one script — plus pictures.
No database, no server, no WordPress. That's why it costs nothing to run and
why there's very little that can break.

Two problems worth knowing about:

**Sorting food from art.** The plan was to look for the words "recipe" and
"art". Measured against her actual 288 posts, that placed about a third of
them — she rarely writes "recipe", and only 15 posts carried the new hashtags.
So the rule was rebuilt around the vocabulary she genuinely uses: *ingredients,
tsp, chutney, curry* for food; *dot work, acrylic, canvas, 40 cm, resin* for
art. That now places 286 of her 288 posts on its own; the remaining two are
pinned by hand, so all 288 are sorted. The hashtags `#ManthaArt` and
`#ManthaFood` override everything else.

**Reels.** Of her 220 reels, Instagram releases the video file for 99.
For the other 121 it refuses — no setting changes this. Those show the cover
picture with a "Watch this reel on Instagram" link. The 99 play on the site
itself, so a visitor with no Instagram account can still watch them.

## 5. Put it on free hosting

GitHub Pages. Free, fast, no advertising, and it has never needed attention.
A scheduled job runs twice a day, reads Instagram, and updates the site on its
own. Neither of you has to touch anything for it to stay current.

## 6. Buy the domain and point it at the site

1. Namecheap, paid by PayPal. **A$16.48** for the first year, renewing around
   A$21.50. Bought in your own name, so you own it outright.
2. **Refuse every extra.** Hosting, SSL, PremiumDNS — none of it is needed.
   Keep the free domain privacy. We removed a "free trial" of web hosting that
   was still sitting in the cart; those become monthly charges nobody notices.
3. In Advanced DNS, delete Namecheap's two placeholder records and add:

   ```
   A Record      @     185.199.108.153    Automatic
   A Record      @     185.199.109.153    Automatic
   A Record      @     185.199.110.153    Automatic
   A Record      @     185.199.111.153    Automatic
   CNAME Record  www   anirudhatalmale6-alt.github.io
   ```

   Four A records is deliberate — four servers doing the same job.

4. **Press Save all changes.** The rows sit in an editing state until you do,
   and nothing takes effect. This caught us out for a few minutes.
5. **Wait for the records to spread before switching the site over.** I
   deliberately held off until I could see them resolving, because flipping
   early would have broken the working link while DNS caught up.
6. HTTPS came on automatically once the domain verified. The padlock, the
   certificate and its renewal are all handled — nobody ever has to think
   about it.

The old github.io address still works and always will.

## 7. Make shared links look right

This matters more than search engines for a site like Suvarna's: almost
everyone will arrive from a link someone sent them.

- A preview card, 1200×630, built from her Ganesha painting
- Tags telling WhatsApp, Instagram and Facebook what to display
- Structured data describing who she is, for Google
- A sitemap, a robots file and her feather as the browser-tab icon

> **This caught us out.** After adding all that, pasting the address in
> WhatsApp still showed nothing. WhatsApp had looked the link up *before* the
> tags existed, found nothing, and remembered that. The fix is
> developers.facebook.com/tools/debug → paste the address → **Scrape Again**,
> which clears the memory for WhatsApp and Facebook together.
>
> Also: previews appear **while you are typing**, not after you send.

## 8. Wire up the form

A site with no server cannot send email by itself, so the form hands the
message to a relay (FormSubmit) which passes it to Suvarna's inbox. Free at
this volume.

- The first submission triggers a confirmation email. **Someone must click it
  once**, after which everything flows.
- A hidden field catches bots without inflicting a captcha on real people.
- A line under the form tells visitors where their details go. They are
  trusting her with a birth date and birth place; they should know.

## 9. Leaving it running

| What | Who | How often |
|---|---|---|
| Instagram sync | automatic | twice a day |
| Instagram token renewal | automatic | every run |
| HTTPS certificate | automatic | forever |
| Domain renewal | automatic, from your card | yearly, ~A$21.50 |

Changing text, choosing the hero picture, or moving a post between Food and Art
is all explained in
[MAINTENANCE.md](https://github.com/anirudhatalmale6-alt/manthas-food-palette/blob/main/MAINTENANCE.md).

---

## Still worth doing

- **Search Console.** search.google.com/search-console → add the domain →
  submit `https://themanthastudio.com/sitemap.xml`. Needs your Google login.
- **Put the link in her Instagram bio.** The site has almost no inbound links,
  and links are most of how search engines judge a site. Her profile is the
  most valuable one she owns and it's free.
- **hello@themanthastudio.com**, if you want it. Namecheap's email forwarding
  is free; it lands in her iCloud, and pointing the form at it is a one-line
  change.

## Two honest limitations

- **121 of 220 reels can't play on the site.** Instagram's restriction, not a
  setting. They show the cover and link out.
- **A new domain won't rank for "Indian recipes".** It will win her own name —
  *Suvarna Mantha*, *The Mantha Studio*, her dot work. Anyone who meets her or
  sees a piece of her work will find her. That's the realistic goal and it's a
  good one.

---

Built by Anirudha Talmale, 30 September – 1 October 2026.
