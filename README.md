# Renovation Intelligence: design prototype (phase 1, public website)

A clickable prototype for Sam's design review. Plain HTML, CSS and JavaScript, with no build step and no backend. All data is sample data, kept in the browser's localStorage.

## Run it locally

The pages use relative links, so serve the folder rather than opening the files directly:

```
cd prototype
python3 -m http.server 4173
```

Open http://localhost:4173

## What is in it

| Screen | Path |
|---|---|
| Home | `/` |
| How it works | `/how-it-works/` |
| Sample presentation | `/sample/` |
| Renovation cost hub | `/renovation-cost/` |
| Area pages (5) | `/renovation-cost/livonia/`, `dearborn/`, `warren/`, `clinton-township/`, `sterling-heights/` |
| House type pages (4) | `/renovation-cost/house-types/brick-ranch/`, `bungalow/`, `colonial/`, `tri-level/` |
| Waitlist | `/waitlist/` |
| Sign up, check your email | `/signup/`, `/verify-email/` |
| Log in (with demo access) | `/login/` |
| Forgot and reset password | `/forgot-password/`, `/reset-password/` |
| Terms, privacy, disclaimer, photo credits | `/terms/`, `/privacy/`, `/disclaimer/`, `/photo-credits/` |
| 404 | any unknown address |
| User dashboard (phase 2) | `/app/` (My houses, intake, run, price, checkout, presentation, resources, account) |
| Public share view | `/s/?t=<token>` |
| Admin console preview (phase 3 replaces it) | `/admin/` |

## User dashboard (phase 2)

Log in with **Demo access**, then try:

| Flow | Where |
|---|---|
| Browse houses, search, filter, sort | My houses |
| Add a house: facts, photos by room (real upload, drag and drop, camera, bulk sort, sample photos), optional sizes, review | Add a house |
| Watch the run: reading photos, the plan filling in, "taking longer" (demo link) | Submit, or open a house in progress |
| Price by package, unconfirmed lines with fixes, what each goal does | Any house with a price ready |
| Pay (simulated Stripe, with a declined-card demo) | Homeowner: the colonial |
| Presentation: package switch, item switches with dependencies, rooms on the plan, trades, house systems, share link, PDF, feedback | After paying, or the brick ranch |
| Builder: 6 client houses, trial opening, task lists with CSV, scope documents | Builder demo |

Photos you upload are shrunk in the browser and kept in localStorage. Share links open in the same browser that created them.

## Demo controls

- **Demo access** (in the top ribbon, and the Demo button at the bottom left on larger screens): log in as Homeowner, Builder or Admin in one click; switch the site between "Before launch" and "After launch"; clear all demo data.
- **Before launch**, the main button is "Join the waitlist" and only the contacts Sam invites can sign up. Open his trial invite at `signup/?invite=demo-trial` (also in the Demo menu).
- **After launch**, the main button is "Start your estimate" and sign up is open.
- No email is sent. A "demo inbox" box stands in for verification and password reset emails.

## Versions

Each named version is a full copy in `../prototype-versions/<name>/`. To go back, ask for the version by name.

| Version | What it is |
|---|---|
| v1-baseline | Phase 1 public website, first complete version |
| v2-signature | Adds the hero "house being read" sequence, the interactive floor plan (home and sample) and the kitchen material boards |
| v3-compare | Adds the before and after gallery on the home page (your photo against your estimate), replacing the annotated cabinet section |
| v4-how | Redesigns How it works: who-does-what lanes, a scroll-driven walkthrough of the eight steps, the evidence ladder, and the seven checks as gates; fixes the hero dimension lines |
| v5-real-swatches | Material boards use real finish photos (cabinet doors, countertops, tile, faucets, lights) instead of drawings; credits added |
| v7-app-m1 | Dashboard M1: app shell, My houses, intake wizard with photo upload, draft and in-line house page, account, resources |
| v8-app-m2-m3 | Dashboard M2 and M3: the simulated run and the price by package |
| v9-app-m4 | Dashboard M4: checkout, presentation, share view, feedback, builder task lists |
| v10-intake-docs | Intake matches the documented field list and upload rules: property type, stories, unit and state, four basement types, optional listing facts, HEIC, limits, duplicates, quality flags, viewable plans, consent records, verified email and free-limit checks, return after login, error screen, side panel, phone cards |
| v11-no-house-type | Intake no longer asks for the kind of house (not in the docs); titles come from stories and year; each field is checked when you leave it |
| v12-docs-gaps | Every gap from the docs filled: contact page, staff invite, waitlist email, address suggestions and duplicate warning, Volume 2 room types, free-limit options, mechanicals teaser and range, presentation photos, products, extra costs and not included, funnel events. Intake kept at the four steps of APP_FLOW 6.2; step 1 redesigned as section cards; one photo place per bedroom and per bath |
| v13-intake-dock | The intake's bottom bar becomes a floating dock: a progress ring, the step name and save status, with Back and Continue together; it sits under the form column on desktop |
| v14-review-next | Review's "What happens next" redesigned: three stages with icons and a joining line, each with a small picture of this house (its photos, the three goals, a Low to High range) |
| v15-invite | Staff invite redesigned: an invitation ticket from Sam (for, role, valid until), role cards with what is and is not included, and a short form with live password checks; on phones the form comes right after the ticket |
| v16-home-honest | Home: the sample ledger table under "An unknown is never a zero" replaced by three short points (unknowns named, an estimate, systems guidance only), as APP_FLOW 4.1 block 4 asks |
| v17-auth-pages | Sign up, log in and waitlist redesigned: icon tiles for account type, live password check, a sample-estimate panel and a your-houses panel in place of stock photos. Waitlist cut to what APP_FLOW 4.5 lists (email, account type, thank-you, confirmation email). SEO additions removed: it is a prototype |
| v18-trial-invite | Invite code removed (not in the docs). Before launch, sign up opens only from Sam's trial invite link (/signup/?invite=demo-trial); without it, sign up says it opens April 1, 2027 and offers the waitlist |
| v19-pages-menu | A Pages menu beside Demo access lists every screen, with search; signed-in screens log in as the right demo role, and house screens open a demo house in the right state |
| v20-account-screens | Check your email, email confirmed, link expired, forgot password, set a new password and the staff invite's expired and used states redesigned as one focused card with a small animated drawing; resend waits 30 seconds; live password checks. The Pages menu became a screen navigator: groups, cards with a line on each screen, the intake as 4 steps, search, recent screens, Cmd or Ctrl K |
| v6-cost | Redesigns the renovation cost section: finder and schematic area map, house type line drawings, rate explorer with a size slider, and "typical vs your house"; carried into area and house type pages |

## Folder layout

```
assets/css/styles.css   Design tokens (Sam's palette) and every component
assets/js/site.js       Header, footer, demo panel, range lines, forms, storage
assets/js/data.js       Sample house, areas, house types, rates
assets/js/plan.js       Floor plan component (reused in the dashboard later)
assets/js/materials.js  Material boards with drawn finish samples
assets/js/compare.js    Before and after slider: your photo against your estimate
assets/js/costkit.js    House drawings, area map, rate explorer, typical vs your house
assets/js/*.js          One script per page type
assets/img/             Photos (credits at /photo-credits/)
tools/                  Helpers that generated the account, legal and area pages (not needed to host)
```

## Host it online to share with the client

The folder is a static site, so any static host works. The 404 page assumes the site sits at the root of a domain, which all three options below give you.

### Option 1: Netlify Drop (fastest, no account setup beyond a free sign-up)
1. Go to https://app.netlify.com/drop
2. Drag the `prototype` folder onto the page.
3. You get a link like `https://random-name.netlify.app` within seconds. Rename it under Site configuration, Change site name.
4. Optional: Site configuration, Access control, Password protection (on paid plans) to keep it private.

### Option 2: Vercel
```
npm i -g vercel
cd prototype
vercel          # answer the prompts; framework: Other; no build command
vercel --prod   # gives the share link
```

### Option 3: Cloudflare Pages
In the Cloudflare dashboard, open Workers and Pages, then Create, then Pages, then Upload assets. Upload the `prototype` folder.

### Kept out of search
`robots.txt` blocks all search engines, because this is a review build. Remove it only when real pages go live.

## Before it becomes the real product

- Photos are from Wikimedia Commons under the licenses listed at `/photo-credits/`. Replace them with Sam's photography or licensed images.
- Area text, rates, products, guidance and legal wording are samples. The real ones come from Sam.
- In the real build, public pages are rendered on the server (docs/SEO_CONVERSION.md section 3); here, area and house type pages are filled in by JavaScript.
