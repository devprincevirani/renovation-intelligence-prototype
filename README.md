# Renovation Intelligence: design prototype (phase 1, public website)

A clickable prototype for Sam's design review. Plain HTML, CSS and JavaScript, with no build step and no backend. All data is sample data, kept in the browser's localStorage.

## Run it locally

The pages use relative links, so serve the folder rather than opening the files directly:

```
cd prototype
python3 tools/serve.py      # same as python3 -m http.server 4173, but the browser never keeps old copies of JS and CSS
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
| Terms, privacy, disclaimer | `/terms/`, `/privacy/`, `/disclaimer/` |
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
| v22-login-demo | Log in: the demo roles became a compact "Try the demo" panel with three role tiles, the full description on hover or focus, and an Opening state; homeowner text now says three houses |
| v23-signup-type | Sign up: "I am a" became six compact tiles (icon beside the label, check on the chosen one), the description sits on the label line; new icons for seller, agent and other |
| v24-account-cards | Forgot password, set a new password, check your email, link expired, email confirmed and the staff invite states: a dark top band with the drawing, and the journey name; strength label on new passwords; the expired invite explains what happened and points to Contact |
| v25-focus-back | On the account screens, "Back to the site" and "Back to log in" became a pill button with an arrow badge; on phones it reads "Back" |
| v26-waitlist-type | Waitlist: "I am a" uses the same compact tiles as sign up; the label line says Optional until a type is chosen; tapping a chosen tile clears it |
| v27-intake-steps | Intake steps as one connected track: done steps tinted green with a check (click to go back), the current step filled dark green with its live detail, steps ahead numbered; on phones a heading row (Step 2 of 4, the step name, what is next) over a four-part bar |
| v28-save-exit | In the app's focus header, "Save and exit" (intake) and "Cancel" (checkout) became one compact soft-filled button with an exit or close icon; "Save & exit" on phones |
| v29-console-m1 | Console step 1: shell (side menu, house search, queue badge, staff permissions, preview as staff), house list, users and staff (invites, permissions, waitlist), room templates (draft editing), audit log, publish queue and back-tests |
| v30-console-m2 | Console step 2: house inspector (overview, photos, observations, decisions, quantities and prices, checks, ledger), decision tree with grading, rules and families (29 real rules, detail pages, tunable values), condition sheets with a live threshold, packages and the 23 presets, accuracy |
| v31-console-complete | Console steps 3 and 4: products, rates (range lines, inline drafts), check results, guidance and texts with live preview, builder documents, contacts and feedback with export, funnel; every console screen in the Pages menu |
| v32-console-ux | Console UX pass: one-click grading with inline notes, Previous and Next, keyboard (arrows, C), progress and undo; find anything as you type; breadcrumbs; a warning before leaving unsaved changes; arrows on clickable rows |
| v33-design-guide | Whole prototype brought in line with DESIGN.md: radius 2, 4 and 8 only; no color gradients, glows or blur; shadows only on floating things; no hover lift or scale; decorative loops play once; one accent color; unverified, partial and held as dashed neutral labels; no pill badge above a headline; 44px touch targets on touch screens. Kept on purpose: the dark scrim on area photos (text legibility), the fade at the foot of the presentation preview, the masked grid behind the home hero |
| v34-house-list | Console house list redesigned to DESIGN.md: a stage strip (All, Draft, Working, Price ready, Presentation open) that filters and shows the pipeline; the same four-step stage marker in each row; owner initials; version folded into Updated; sunken table head. Numbered pages with Previous and Next, rows per page (5, 10, 25, remembered), and "Page x of y" on phones |
| v35-console-colour | Console colour pass to DESIGN.md roles: Deep Forest side menu (ivory text, bronze line on the open screen, bronze badge and avatar), white top bar, chosen stage on the house list as a Deep Forest band, and the pager joined to the table as its footer with one connected page group |
| v36-pager-sides | Pager footer: rows per page and the count on the left, page controls on the right |
| v37-console-topbar | Console top bar redesigned: one-line breadcrumb (Houses / House list / house) on desktop, back link over the title on phones; quieter search with a small / keycap; phone search button that opens a full-width field with Cancel; divider, then Publish queue with a Deep Forest count |
| v38-room-templates-docs | Room templates rebuilt to the docs: each item is a component and its usual count (SCHEMA 5), with Sam's IDs where the guide gives them (BA, FL, TR) and work type codes otherwise; counts only where the guide gives them, else Not set; typical sizes provisional; mechanicals (SY) guidance only; room types grouped above grade, basement, exterior; read view with Edit template; what a queued draft changes; version history. Console permissions renamed to SECURITY.md 3.2 (rulebook.view, rulebook.edit, pricing.edit, content.edit and more); new staff start with none; staff see only their own area in the publish queue |
| v39-overview | Console Overview, a proposal for Sam (not in APP_FLOW 7 yet; first item in the side menu, the house list stays the landing page): four numbers (waiting to publish, houses, lines held back, presentations paid), houses entered with a 7, 14 or 30 day switch and a keyboard crosshair, decisions to grade with Grade or Continue opening the next ungraded component, where lines are held (links filter Check results), photo reading accuracy weakest first, recent changes. Each block shows only with its permission |
| v40-overview-columns | Overview: houses entered is now a column chart (one bar per day, whole-number axis, count on each bar, a stub for days with none, hover or arrow-key readout), with a summary row: total, busiest day, average a day, days with none |
| v41-overview-stacked | Overview: houses entered is stacked by the stage each house is in now (Deep Forest ramp), and the legend above the chart is its key and a filter (pick a stage to bring it forward). Summary row and loose stage list removed; the key figures sit in the subtitle |
| v42-before-admin-removal | Full copy of v41 (with the admin console), saved just before the console was taken out |
| v43-no-admin | Admin console taken out for the client update: /admin/ is the placeholder again (as in v28), console files and the Pages menu console links removed, staff invite text as in v28. Everything else kept, including the DESIGN.md pass. To bring the console back: copy admin/index.html, assets/css/console.css, assets/js/console/, assets/js/site.js and assets/js/more.js from v42-before-admin-removal |
| v44-how-it-works-simple | Client update: the method is no longer shown publicly. Home "How it works" and the How it works page are three picture-first steps (Add your house, We read it, See your price) with a few words each; the How it works page adds "What you get" (free price by package vs the full presentation, both drawn from the sample house) and "Honest numbers, or none". Removed: the who-does-what diagram, the eight internal steps, evidence and range, the seven checks, and how.js |
| v45-no-photo-credits | Photo credits page removed, with its links in the Pages menu, footer, legal side menus, home page and area photo captions. The full credits list (needed by the CC BY-SA licenses) moved to CREDITS.md in the repository |
| v46-global | (Not used) Removed the region entirely, including the city pages and area sections |
| v47-no-metro-detroit | Current. Only the words "Metro Detroit" removed, from the logo tagline, page titles and copy (home, waitlist and its email, contact, cost hub, house type pages, rate notes). The five area pages, the home areas section, the cost hub map and area finder, and the footer Areas column all stay |
| v48-admin-back | Admin console brought back from v42 on top of v47: admin/index.html, assets/css/console.css, assets/js/console/, the "Admin console" group in the Pages menu and the staff invite permission text. Sample rate region renamed from "Metro Detroit" to "Sample region". Everything since v42 is kept (simple How it works, no photo credits page, no "Metro Detroit") |
| v49-houses-per-day | Overview chart is now "Houses per day": submitted and price ready side by side for each day (Deep Forest and a light bronze #A88A66), legend at the top right, and three totals underneath (submitted, price ready, still running). Follows the 7, 14 or 30 day switch |
| v50-overview-v3 | Overview rebuilt in the style of the reference artifact: four KPI cards with sparklines and change badges, houses per day, a Deep Forest photo accuracy ring, Waiting for Sam, why lines did not price (donut by check), recent activity, and Decisions to grade as a table with grading progress and Grade, Continue or Review. Charts switch between Example data (labelled) and This browser; lists always use this browser. Blocks follow permissions |
| v51-admin-menu | Console side menu reordered to follow the admin's day: Overview, Houses, Quality (Check results, Photo accuracy), Rulebook, Pricing, Content, Changes (Publish queue, Back-tests), Customers (Contacts and feedback, Funnel), Admin (Users and staff, Audit log). Page headings and the Pages menu use the same group names. Permissions unchanged |
| v52-audit-table | Audit log rebuilt as a table: When, Who, Action, What, Why, grouped by day, with the filters (date, person, action, search), a Clear filters link, a change count and numbered pages. Action tags are solid and grouped by meaning. What links to the screen it changed. Tablet moves the reason under the change; phone shows one card per change. Sample log now has three people (Sam and two staff) and the system, sixteen changes; the two staff are added to Users and staff |
| v53-responsive-filters | Audit filter bar and the shared pager made responsive. Filter bar: phone stacks the period (four equal 44px buttons), search, then Person and Action side by side; tablet puts the period on its own row and the search takes the spare width; wide screens keep one row. Pager: phone shows Previous, page x of y, Next, then the count and a short "Show" select under a hairline; tablet uses arrow-only buttons so page numbers always fit; every control is the same height. The house list gets the same pager |
| v54-period-filter | Audit log period filter redesigned: joined outlined buttons that match the search and selects (same height, border, radius), the chosen period in Deep Forest like the current page in the pager, no shadow. Works as a radio group (arrow keys, Home, End). Phone: four equal 44px buttons across the width. Page tabs elsewhere unchanged |
| v55-funnel-v2 | Funnel rebuilt and opens on the sample month (labelled Sample, last 30 days). Four headline numbers (houses submitted, free price views, paid presentations, shares) with change and trend; "From sign up to a paid presentation" with one column per step, the loss at each step and the biggest drop marked, plus the share of sign ups who pay; "Where people leave": the three biggest drops with why and what the screen does (APP_FLOW 3); "Before sign up" and "After paying". This browser stays as a switch. Phone: numbers two by two, one bar per step |
| v56-funnel-ribbon | Funnel chart redrawn as one Deep Forest ribbon that narrows from sign up to reading, the biggest drop in bronze with a note, the share kept on each narrowing, and the three biggest leaks numbered 1 to 3 to match the cards. Where people leave is three cards in a row; Before sign up and After paying sit side by side. Phones keep the bar list; screen readers get the step list on every size |
| v57-users-trial | Users and staff redesigned to the docs (APP_FLOW 7, SECURITY 3.2 and 3.3, GLOSSARY trial). Users: one State column (Not verified, Active, Trial with days left, amber at 3 or fewer, Disabled), search and state filters with counts, Enable after Disable. Waitlist and trial: status (Waiting, Invited, On trial), Sam invites one contact or several at once with an email preview; invites only in Before launch mode. Staff: the table plus a "Who can do what" grid that Sam ticks, super admin only rights locked. Subtitle from the docs. Example rows fill the lists |
| v58-funnel-bars | Funnel chart is now "From visit to share": the nine steps of APP_FLOW 3 (Arrives to Spreads it) with their event names, one bar each on a square-root scale with the count inside, the share kept from the step before on the right, bronze for a step that keeps under 30%, a lighter forest for steps that follow on their own (Waits, Reads), and the three biggest drops after sign up numbered 1 to 3 to match Where people leave. Phone: name and share on one line, the bar below. The ribbon (v56) is removed |
| v59-state-dropdown | Users and staff: the state filters (All, Active, On trial, Not verified, Disabled) and the waitlist status filters (All, Waiting, Invited, On trial) are now one dropdown beside the search, each option with its count. Phone: search and dropdown full width, one under the other |
| v60-funnel-sample-only | Funnel's Sample month / This browser switch removed: the page always shows the sample month, labelled Sample, like the Overview. Old ?mode=browser links open the same page |
| v61-users-one-row | Users and staff: the tabs, the search and the state or status dropdown share one row (tabs left, search and dropdown right). Tablet: the search and dropdown move under the tabs on one line. Phone: search and dropdown side by side under the tabs |
| v62-funnel-no-tag | Funnel header: the Sample tag removed; the line reads "Last 30 days, <dates>. Invented numbers." |
| v63-funnel-period | Funnel gets a 7 / 30 / 90 days choice in the header (same joined buttons as the audit log, arrow keys work, 30 by default, ?days=7 or ?days=90 in the link). Each period has its own sample numbers, date line, trend lines and "vs the N days before" change |
| v64-sample-tag | Sample tag redesigned as a note on where a row comes from, not a state: outlined, sentence case, no dot, no fill, muted text (Rules and Photo accuracy too). On Users and staff, Demo access logins carry a "Demo" tag beside the name, with a tooltip, instead of "Sample" in the Account type column. Trial and Invited keep the info blue under their own style |
| v65-waitlist-actions | Users and staff: underline tabs on a hairline (bronze line under the current tab), so tabs no longer look like the filters beside them. Waitlist: the dark selection band is gone; ticking contacts turns the table header into "2 selected, Clear, Invite 2 to the trial" in the same place, so nothing jumps, and the header box shows a dash when only some are ticked. Row actions: a small outlined "Invite" button, right-aligned; invited rows get a quiet "Resend" (tooltip shows the last send) that opens "Resend the trial invite". The invite date sits beside the Invited label |
| v66-waitlist-polish | Users and staff, product pass: larger tabs with a Deep Forest underline and quiet counts. Waitlist: column titles always stay; ticking contacts shows a small floating bar under the table (count, Clear, Invite N to the trial), no colour change in the header. Invite and Resend are the same outlined button, one width, centred on the row; Resend opens "Resend the trial invite". Invite date shown short (Nov 20) beside Invited |
| v67-staff-access | Staff permissions change in one place: a Manage access side panel (full screen on phone), also used by Invite staff. Permissions grouped by area with a count per area; ticking an edit permission ticks and locks the reading it includes; nothing saves until Save changes, and the footer says what is given, what is taken away and that the person is signed out. Disabling sits apart and asks first. The grid is now a read-only Access overview with a Manage link per person; the staff table shows the areas each person can work in |
| v68-users-mobile | Users and staff: the waitlist selection sits beside Invite staff ("2 selected, Clear, Invite 2 to the trial"); while contacts are ticked it is the main button and Invite staff becomes a secondary button; with nothing ticked a short hint shows. Phone and tablet: every table becomes compact cards (name and address with the state on the right, one quiet line of details, then the action); checkboxes work on phones too, and on a phone the selection moves to a bar at the bottom of the screen |
| v69-selection-control | Users and staff: the waitlist selection is one joined control, outlined in Deep Forest: the count in a small dark box, "selected", an X to clear, and "Invite to the trial" joined on the right. A thin divider keeps it apart from Invite staff, which now has a person icon instead of the same mail icon. Phone: the same control fills the bottom bar |
| v70-manage-access-btn | Staff tab: the Access overview grid removed; each staff row has a Manage access button with a key icon (same style as the waitlist row actions), which opens the access panel. The row is still clickable, but only the button takes keyboard focus |
| v71-users-section-cards | Users and staff tabs redesigned as three section cards: icon, name, what is inside, and the count. The chosen card is white with a Deep Forest edge and icon. Search and filters sit on their own row below. Phone: three equal compact cards, name and count only |
| v72-users-tab-bar | Users and staff back to a tab bar (replaces the section cards): each tab has an icon, its name and a count badge on one baseline; the chosen tab is Deep Forest with a 2px underline and a solid count. Search and filters at the right end of the bar on wide screens, below it on smaller ones. Phone: icons hidden, the bar scrolls sideways if needed |
| v73-invite-in-table | Waitlist bulk invite moved into the table: on desktop, ticking contacts puts a dark "Invite N" button in the header cell right above the row Invite buttons (same width and place); the header checkbox clears the selection when anything is ticked. Invite staff stays the only button in the page header. Phone and tablet keep the joined selection control in a bar at the bottom of the screen |
| v74-users-mobile-first | Users and staff designed for phone and tablet, not shrunk. Phone: one list; each card has the name with its action on the right, the email, the state badge, then the details, so no row is spent on a button and emails keep their width; three equal tabs with short labels (Waitlist); Invite staff only on the Staff tab; short search placeholders; Disable is quiet until touched. Tablet (600 to 899): the same cards two to a row. 900 and up: the table |
| v75-user-buttons | Users: Disable and Enable are real outlined buttons with icons, the same size as Invite and Resend. Disable has a lock icon in the danger red (it is destructive; a hover tint, no fill); Enable has a key icon in the normal style. Right-aligned and centred on the row on desktop; on the phone and tablet cards they sit top right |
| v76-contacts-feedback | Contacts and feedback rebuilt to the docs (APP_FLOW 7, SECURITY 3.2, 6.3, 11, 15, M4-15, RUNBOOK). Two named exports with counts, "Export contacts" (everyone listed, with their consent; includes the waitlist) and "Export the updates list" (only people who agreed); real CSV files written so a spreadsheet cannot run a cell as a formula; each export goes to the audit log. Feedback: who left it, the house and the package, a filter by answer, the summary stacked beside the big number. Contacts tab (was Updates list): Email, Account type, From, Updates (Agreed, Not agreed, Withdrawn), Agreed on with the wording version; search and filter. Example rows use example.com |
| v77-backtests-complete | Back-tests completed to the docs: choose the house set (lab houses for the milestone check, or every priced house); each run stores who, the set, the published versions and drafts tested, and runs in the background with a live Running row and report. The report opens with a verdict (Safe to publish / Fix before publishing) and the lab-house gate (pass or fail), then six counts (failed houses, double charges, skipped parts, broken links, changed totals, accepted alternatives), every house with its Standard total before and after (failed houses first, with the reason), findings, what the engine rejected (dependency cycles under DP-010, clashing tasks), and accepted alternatives with rule candidates. No invented houses in the count |
| v79-feedback-cards | Contacts and feedback: four headline cards in the console card style, worked out from the same rows as the lists so the numbers always agree: Feedback in 30 days (trend by week, change against the 30 days before), Said it helped (share of Yes), Contacts (from the waitlist and from sign up), and Updates list in Deep Forest (agreed, ready to export). Each card opens its list. The old summary box under the tabs is gone (the card and the answer filter carry it). Export buttons get a download icon. Phone: cards two by two |
| v82-feedback-data | Contacts and feedback filled with example rows so the screen shows at full size: 14 pieces of feedback over seven weeks (every answer, every package, comments and a few without), and 24 contacts from sign up and the waitlist (agreed, not agreed, withdrawn). The headline cards and filters work from the same rows. All example.com addresses |
| v83-backtests-full-data | Back-tests closed against the docs and filled with sample history. Accepted alternatives now come from Sam's Valid alternative grades on lab-house decisions (two sample grades added), and count how often they won across runs; 3 or more is a rule candidate. Before and after for Essential, Standard and Premium with a package switch (opens on the package that moved most) and a Package column in the findings. The publish queue shows Back-test running with live progress until a run finishes. Published versions move up when Sam publishes, and each run keeps the versions it tested. Seven sample runs over two weeks by Sam, Marcus Hill and Dana Reyes: clean lab runs, a lab fail, problem-heavy runs, with and without drafts |
| v84-backtest-report-btn | Back-tests list: Report is a button with a document icon (Watch with an eye icon while a run is going), in the same style as Manage access and Invite. The row stays clickable; the button is the keyboard stop. On a phone the button runs the full width of its card |
| v85-backtests-history | Back-tests with a month of sample history: 15 runs over 30 days by Sam, Marcus Hill and Dana Reyes, one still running (Marcus replaying the full set for the water heater guidance draft, also shown as running in the publish queue). The full set now holds 24 houses: the 2 lab houses, the 7 other priced houses and 15 properties Sam supplied (tagged Supplied, no house page), as TESTING describes. The list has page numbers and rows per page; while a run goes only its progress updates. Dependency cycles vary |
| v86-backtests-mobile | Back-tests list on a phone: one compact card per run (about half the height): when and who with a compact Report or Watch button beside them, one line for the house set, house count and drafts, then the result chips or the live bar. No column labels |
| v90-product-library | Products redesigned to the docs as Sam's product library (new products.js): one product per item per package, so each item is a card with Essential, Standard and Premium slots (a product tile with photo, name, Low and High, version and state; an empty slot says Priced from a rate or offers Add product). Coverage numbers (items, missing a product, need a photo, drafts waiting) that also filter. A product opens in a side panel: photo, price with range line, unit, source, supplier link, how many priced houses it prices, version history, any draft waiting, Edit as draft. Add product only offers empty slots. Edits and new products are drafts; publishing a new one adds it. Data: the duplicate Premium carpet moved to Basement floor; every product has a supplier link and a version history. Mobile first: numbers two by two, filters stacked, tiers as rows; side by side from 900px |
| v91-rates-library | Rates rebuilt as Sam's rate library, mobile first, to APP_FLOW 7, BACKLOG M3-09, M3-22, M4-25, SCHEMA rates and rate_versions, PDF 59 and DESIGN 8.6. Search by activity or code, trade filter, status filters with counts (All, Published, In the queue, No rate yet), a banner for activities without a rate (lines show "Not priced yet"). Phone: one card per rate (name, code, status, the range, effective date and source); computer: a compact table grouped by trade with Low and High right-aligned. A rate opens in a sheet (full screen on a phone, side panel on a computer): current Low and High with Now and Draft range bars, effective date, source, region, version, the publish-queue state, the edit (Low, High, Source, live change in percent, saved as a draft with a reason) and every version with who drafted, who published and why, each with Restore (saves the older values as a new draft). Activity codes such as R-FL-LVP-SF. 17 sample rates, one with no rate yet. Classes use the rlb- prefix |
| v95-rates-fixes | Rates, seven additions to the docs: a waiting draft shows its back-test state (not run, clean, or problems) with a link to the run; older versions are labelled Retired; each version shows Sam's publish note; the list is paginated (10, 25 or 50 per page, trades kept in order); rates sold by the piece read "$310 to $560 each"; editing a rate that has a waiting draft says whose draft the save replaces; the status label turns to "Draft, not saved" as soon as a value is typed |
| v96-rates-regions | Rates: a region selection with Southeast Michigan (SCHEMA regions, SCOPE A8) and three example regions (West Michigan, Northern Ohio, Greater Chicago), each with its own prices; a unit selection (All units, Per sq ft, Per linear ft, Each); status counts follow the region and unit. In a rate, unit and region are shown as fixed facts ("another unit or region is its own rate line", SCHEMA), and the draft takes an Effective date that becomes the version date when Sam publishes. "Sample region" is gone |
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
assets/img/             Photos (credits in CREDITS.md)
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

- Photos are from Wikimedia Commons under the licenses listed in `CREDITS.md`. Replace them with Sam's photography or licensed images.
- Area text, rates, products, guidance and legal wording are samples. The real ones come from Sam.
- In the real build, public pages are rendered on the server (docs/SEO_CONVERSION.md section 3); here, area and house type pages are filled in by JavaScript.
