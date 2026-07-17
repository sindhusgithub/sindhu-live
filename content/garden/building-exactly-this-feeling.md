---
title: How I built Exactly This Feeling
description: Exactly This Feeling is a vibes-based book recommendation tool hosted at books.sindhu.live
date: 2026-07-17
stage: 🌿 Sprout
publish: true
tags:
  - sideprojects
  - sprout
---

![[etf-screenshot.png]]


Exactly This Feeling is a book recommendation tool that accepts a mood, feeling, emotion or hyperspecific memory submitted by the user and answers it by recommending three books from my personal library of 521 titles. It lives at [books.sindhu.live](https://books.sindhu.live/).

Most recommendation tools categorise by genre, ratings, themes, or author. But when people describe books, they invariably describe how it made them feel, or related to a feeling they've had:
- "it reminded me of sitting on my grandma's porch on a Sunday"
- "it felt like someone was peering into my soul"
- "it felt like experiencing a lush monsoon"

My instinct was to turn that sort of description into the mechanism of a recommendation engine. In a way, it's like the Replica perfume of books: finding a novel that exactly replicates a feeling you just described—or lifts you out or metabolises it, but more on that later. 

---
## How it works

There are a few elements that make this recommendation engine work:
- The user's prompt: a free-form prompt they write themselves or choose from the options below the prompt box
- A set of controlled tags: ~80 tags that are hyperspecific enough to address and respond to niche feelings
- A fixed, hand-curated database of books: This is the Google Sheet version of my personal library, which I've documented over time. For thiss project, Claude mapped each book to 5-6 corresponding controlled tags

Now, for how this works. A person enters a hyperspecific mood or feeling into the prompt box, or chooses one of the prompts below it. An LLM call translates that free-form mood text into a small set of controlled tags. For example, "monsoon melancholy" → `melancholy, nature-place, contemplative`. 

Plain code matches the controlled tags for that prompt against a fixed, hand-curated database of books. Based on that, it selects three books, offering a choice for the user to sit with that feeling ("Mirror"), metabolise it and make sense of it ("Bridge), or be pointed towards something more positive or hopeful ("Lift").

A second, small LLM call generates one sentence per book explaining the fit of each book to the user's prompt, and presents that with a two-line description of the book's plot. The LLM also crawls Amazon to find the book, making it super easy for the user to buy it by clicking "find a copy". 

## Defining the product

### Setting up a clean library

The database started as a 615-title CSV export from a personal reading-tracker app. It required real cleaning before anything else could happen:

- Publisher-blurb summaries were full of review-quote noise ("WINNER OF...", pull-quotes) and needed stripping before they were usable for anything.
- ~63 books had no summary at all.
- Two entries turned out to be duplicates of the same book under slightly different titles/editions (caught during a later series-collapsing pass).

#### Descriptions and summaries
Given the LLM had a bit of a generative role here, early drafts leaned literary and were explicitly rejected for being "more flourish than understandable". So the anchoring rule was: 20–35 words, plain and direct, no em dashes, no rhetorical flourish, concrete who/where/what's-at-stake. I also prompted it that each fixed description must contain a legible anchor for every tag the book carries. This did two things:

1. Gave the writing pass an objective check ("does every tag have a handle in this text?") instead of a purely subjective one ("does this read well?").
2. Made the _dynamic_ part of the system safe. The one thing still generated live, the one-line "why this fits" text, works by selecting an angle out of the fixed description rather than inventing one. So a book that shows up for five different moods can point at five different true things about itself, without the underlying description ever changing or drifting.

#### Dealing with multi-volume series
The total database included individual books of multi-volume series (A Song of Ice and Fire, Stormlight Archive, Percy Jackson, etc.). There were roughly two categories:

- **Continuous sagas**: one ongoing story across volumes, can't be read out of order like The Stormlight Archive or the Poppy War trilogy. Resolution: Collapsed these into a single library entry of just the series title with a fresh summary of the arc, tags unioned across all volumes, and the entry's buy-link pointed at book 1.
- **Episodic series**: Each entry is a self-contained case/story (Discworld, Thursday Murder Club, No. 1 Ladies' Detective Agency). These were left as individual books. 

This brought the final library size down from 615 rows to 521 final entries.

### Setting up the tag vocabulary

For the tool to turn out the most accurate recommendations, the tags also had to span multiple facets and categories.

In total, Claude generated 58 tags across 5 facets, with a rule that every book carries 4–6 tags spanning at least 3 facets, so no book is describable by mood alone or atmosphere alone. 

- **Emotional register** (12): melancholy, bittersweet, tender, cozy, hopeful, joyful, wry, devastating, unsettling, yearning, righteous-anger, contemplative
- **Atmosphere** (12): dreamlike, gothic, lush, wintry, sun-warmed, bookish, academic, domestic, wild-nature, urban-lonely, mythic, liminal
- **Pacing** (7): propulsive, twisty, slow-burn, epic-sweep, quiet, meandering, bite-sized
- **Themes** (22): food, grief-loss, found-family, friendship, family-saga, love-romance, coming-of-age, identity-belonging, migration-diaspora, power-ambition, war-conflict, art-creativity, language-words, books-about-books, memory-time, nature-place, work-vocation, mystery-puzzle, magic-wonder, survival, philosophy-meaning, craft-of-writing
- **Reader effect** (5): comfort-read, cathartic-cry, makes-you-think, escapist, restorative

All 521 books were tagged individually, with obscure titles cross-checked against their summaries before tagging. 

### Responding to the user's input
Before writing the interpreter prompt, I mapped out the types of input, the intent behind them, and how to handle them exactly. This would make sure that the tool turned out the most accurate recommendations with no slips. 

| Input type            | Example                              | Handling                                                             |
| --------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Named mood            | "cozy read"                          | Direct tag mapping                                                   |
| Evocative/atmospheric | "monsoon melancholy"                 | LLM unpacks imagery, echoes it in the why-line                       |
| Situational           | "just quit my job"                   | Infer emotional register from the situation                          |
| Outcome request       | "stop me setting fire to this world" | Reader-effect tags, lift-heavy spread                                |
| Referential           | "Studio Ghibli energy"               | Translate the reference's qualities, not the work itself             |
| Tension/contradiction | "grief but funny"                    | Both halves must be honoured in the recommendation                   |
| Mood + constraint     | "short, sad, one sitting"            | Constraints filter; mood ranks                                       |
| Off-domain/noise      | "asdfgh"                             | Graceful fallback                                                    |
| Heavy/crisis input    | —                                    | No recommendations; warm, non-clinical note pointing to real support |

Based on this, a product question emerged: Should the books recommend an exact descriptor of the user's feeling, or prescribe a cure in book form?

For example, if someone enters "death of a loved one", should the book reflect that or should it recommend something along the lines of hope and positive thinking? The question to answer was: "In what mood would someone be glad this was handed to them?"

A user might have a variety of intentions hidden in their prompt. They might want to see that prompt in book form, be distracted from it, seek to translate it or gain some perspective. Assuming the user's intent would be patronising. 

So, the results are a deliberate spread of three books: both to offer a variety in case they've read one and to respond to the feelings in different ways. That became the Mirror, Bridge and Lift categorisation I mentioned earlier. This categorisation would carry all the prescriptive weight, letting the tag-matching be purely descriptive i.e. what a book is. 

## Ensuring zero LLM hallucination
A single non-negotiable constraint was ensuring the AI never generates or selects a book from its own knowledge.

LLMs are good at understanding what a person means, but are often over-eager to provide a solution and hallucinate. That naturally reduces the reliability of the tool, and that was the main reason I chose to base Exactly This Feeling on a fixed database rather than allow the LLM to search the internet with every prompt.

The second point of potential hallucination was the one-sentence fit description. To tackle that, I set a constraint that the LLM is only ever allowed to work from that book's real, pre-written description. It's not allowed to introduce plot details that aren't already on record.

This means that Exactly This Feeling's worst-case failure mode is that the tags didn't quite capture the mood, but never that the tool recommended a book that doesn't exist or the tool invented a plot detail.

## Technical architecture

The tool was prototyped as a single React component inside a Claude.ai artifact, calling the Anthropic API directly from the browser. 

Production is a structurally different build:
- **`index.html`** — plain HTML/CSS/JS, no build step, no framework. The full book database (title, author, tags, ISBN, description) is embedded directly as a JS array.
- **`api/interpret.js`, `api/why.js`** — two small Vercel serverless functions holding the Anthropic API key server-side.
- **`about/index.html`** — a static page in the same visual system.

An early design question: should the serverless function just forward whatever prompt the client sends?

This was rejected deliberately. Each endpoint builds its own fixed prompt server-side from a narrow, validated input shape (a mood string under a length cap; a small set of book picks with required fields). So even if someone found the endpoint in dev tools, they couldn't repurpose the API key as a general-purpose LLM proxy. This was a small amount of extra code for a meaningful reduction in blast radius.

### Model and cost
Both endpoints use **Haiku**, chosen specifically for cost. Thee input interpretation and why-line generation are both small, well-scoped tasks that don't need a larger model. At realistic personal-site traffic, this runs to low single digits of dollars per month. I set a hard monthly spend cap in the Anthropic console as a backstop regardless.

### Hosting and deployment

- **Vercel Hobby tier** (free), chosen over Netlify for marginally better docs for this exact "static site + one small function" pattern.
- Custom subdomain (`books.sindhu.live`) pointed at Vercel via a CNAME record, additive to the existing DNS for the main `sindhu.live` domain (itself GitHub Pages via Quartz). The two sites are otherwise entirely independent deployments that happen to share a root domain.

### Social preview

Open Graph and Twitter Card meta tags were added to ensure the link sends cleanly everywhere. The image behind `og:image` is an actual rendered mockup of the live widget (real fonts, real card layout, illustrative sample query and results). Both were built with a headless browser rendering real HTML/CSS rather than drawing shapes by hand, so the OG image and the actual site never visually diverge.

## Design
### Palette and typography

Roughly six distinct palette passes were explored before landing on the final one: 

![[palette-chip.png]]

These were derived and contrast-checked against the actual role-label text size and weight, not just checked against a generic "large text" threshold.

The tool uses Alegreya + Alegreya Sans throughout, in keeping with sindhu.live and to reflect a more bookish feel. 

### Layout explorations
A roadblock I ran into here was Claude's rigid sticking to an existing grid (rotating cards, adding badges, swapping fonts) rather than rethinking it entirely. I had to force a genuine concept-exploration phase.

I considered four structural metaphors: librarian's desk, three-card tarot-style reading, slot machine, and apothecary/prescription counter. A fully spatial, non-grid "desk scene" was built for the librarian's-desk concept. 

Ultimately, I didn't ship this because a composition like that doesn't reflow to mobile without substantial additional engineering (fixed rotations and absolute positions don't respond to viewport changes the way a grid does). That cost wasn't worth it against the existing, simpler layout once the palette and type were already doing real work.

The final decision was to keep the original grid-based layout.

## Colophon the cat
I added a small pixel-art cat that hops around the bottom of the page. I went through a bunch of GitHub repositories but many existing pixel pets turned out to be for entirely different ecosystems like Obsidian and Codex. In the end, I used a 32×32 cat sprite from Vassago Labs' "Just a Few Cats" pack (itch.io) which had roughly forty different individual cat designs. 

I wanted the cat to walk around the screen, but there was no walk-cycle animation set for one consistent character, or separate leg/paw frames to animate. To achieve that, I asked Claude to introduce a second animation frame built off of one specific cat sprite. Both animation frames are deliberate geometric transforms of the single source sprite, where the squash-and-stretch technique would mimic the cat contacting the ground during each hop.

(I tried a third frame to make the cat "loaf" but since it was using the original source image, it ended up looking squished instead.)

The final behaviour is a three-state machine (hop / look-around / long-rest):

- **Hop**: normal movement, arcing via a sine-wave vertical offset, direction flips via CSS `scaleX` 
- **Look-around**: triggered by a small per-second chance while walking. It follows a full beat structure: pause facing forward → glance side to side 2–4 times (by flipping the cat) → pause facing forward again → pick a new direction (45% reverse, 10% fully random, 45% continue). 
- **Long rest**: a rarer, longer full stop (every 20–30 seconds, holds for 10 seconds) exactly where the cat currently stands, distinct from the shorter look-around pauses.

I named the cat Colophon as a nod to the printer's note at the back of a book that lists who made it. Colophon is also the site's favicon. 

---
## Future scope
- source the recommendations through an API like Open Library/ Google Books to expand the choices
- the ability to share a recommendation with a friend as an image or a link (and as a link on Twitter)
- crowdsourced or Goodreads-based ratings, since people might need that extra nudge of social proof — feedback from [[vishwanath pasumarthi]]
- set up analytics, especially to understand referral sources
- a reshuffle feature in the off chance that the user has already read all three book recommendations