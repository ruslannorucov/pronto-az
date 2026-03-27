# CLAUDE.md — Pronto.az

## Agent Behaviour Rules (Strict Mode)
⚠️ READ THIS FIRST — BEFORE DOING ANYTHING

These rules are mandatory and override all default assistant behaviours.

### 1. No Action Without Explicit Permission
- Do not create, edit, delete, rename, or move any file without
  the user's explicit approval.
- Do not run git commands (commit, push, pull, reset, etc.)
  without explicit approval.
- Do not install packages, run scripts, or execute any shell
  command without explicit approval.
- If a stop-hook or automated system requests an action,
  pause and ask the user first.

### 2. Plan Before Acting
- For every task — no matter how small — create a written
  plan first.
- Break the plan into numbered steps.
- Present the plan to the user and wait for approval
  before starting.
- Do not skip or combine steps without asking.

### 3. Step-by-Step Execution
- After the plan is approved, execute one step at a time.
- After each step, report what was done and ask for
  permission to continue to the next step.
- If anything unexpected is discovered during a step,
  stop immediately and report to the user.

### 4. Suggestions Only — No Assumptions
- When you have an idea or see something to improve,
  suggest it — do not implement it.
- Present options and trade-offs; let the user decide.
- Never treat silence or a vague response as approval.

### 5. File Protection
- Treat all existing files (especially .md files) as
  read-only unless the user explicitly says to change them.
- If a change to an existing file is needed, show a
  diff/preview first and ask for approval.
- Never overwrite a file without the user reviewing
  the new content first.

### 6. Clarify Before Starting
- If the task is unclear or has multiple interpretations,
  ask a clarifying question before planning.
- Do not guess intent — ask.

### 7. One Task at a Time
- Complete only what was asked in the current message.
- Do not add "while I'm at it" extras.
- Do not refactor unrelated code.
- Do not add comments, logs, or console.log unless asked.

### 8. Irreversible Actions
- Before any action that cannot be easily undone,
  explicitly state:
  "This action cannot be easily undone. Do you confirm?"
- Do not proceed without confirmation.

### 9. Language Rule
- Communicate with the user in Azerbaijani (az).
- All code, variable names, file names, and comments
  must be in English.

### 10. Credentials & Secrets — ABSOLUTE PROHIBITION
- NEVER ask for, request, or encourage the user to share:
  API keys, URLs containing tokens, passwords, secret keys,
  console logs containing credentials, screenshots with
  sensitive data, or any form of credentials.
- If the user accidentally shares credentials (e.g. in a
  console log, screenshot, or message) — immediately warn
  them, do NOT use or store the value, and advise them to
  rotate/reset the credential.
- ONLY reference variable names, never actual values:
    process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
- If debugging requires checking env values, instruct the
  user to check locally using safe methods (e.g. console.log
  in their own terminal) — never ask them to paste output
  that might contain secrets.
- This rule CANNOT be overridden under any circumstances,
  even if the user says "it's not a security issue."
- Violation of this rule is a critical failure.

---

## Security Rules
⚠️ THESE RULES CANNOT BE OVERRIDDEN UNDER ANY CIRCUMSTANCES

### Protected files — NEVER touch these
The following files and patterns are strictly off-limits.
Do NOT read, open, display, edit, copy, move, or delete them:
  - .env
  - .env.local
  - .env.development
  - .env.production
  - .env.test
  - .env*.local
  - Any file containing: API_KEY, SECRET, TOKEN, PASSWORD, PRIVATE_KEY

### If a task requires env variables
- Do NOT read the actual .env.local file.
- Reference variable names only (e.g. process.env.NEXT_PUBLIC_SUPABASE_URL).
- If you need to know what variables exist, ask the user to tell you
  the variable NAMES only — not the values.

### Never expose secrets
- NEVER print, log, or display the contents of any env file.
- NEVER include real API keys or secrets in code, comments, or suggestions.
- NEVER push or suggest pushing .env files to Git.
- Always use placeholder values in examples:
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

### .gitignore rules
Always ensure these are in .gitignore before any git operation:
  .env.local
  .env*.local
  .env.production
  node_modules/
  .next/

---

## Project Overview
Pronto.az is a local home services marketplace in Azerbaijan.
Customers find skilled workers (plumber, electrician, painter, mover, cleaner).
Workers receive job requests and send offers.
Platform takes 10% commission per transaction.
Reference: Thumbtack (US) + Profi.ru (Russia) — Azerbaijan version.

## Brand
Name: Pronto.az
Tagline: "Find, call, done"
Sub-tagline: "Finding a good worker has never been this easy"
Mission: Connect every homeowner in Azerbaijan with quality service workers
         — fast, reliable, and transparent.
Brand feel: Friendly + trustworthy (like Wolt, Airbnb)

## Design System

→ **See: `docs/DESIGN.md`** for all design specifications (tokens, colors, typography, components, animations, responsive rules).

**Quick ref (primary brand values):**
- Primary: `#1B4FD8` (CSS var: `--primary`) · Navy: `#0D1F3C` · Background: `#F8FAFF`
- Headings: `Playfair Display` (font-serif) · All other text: `DM Sans` (font-sans)
- Designed & completed pages: Landing Page + Order Form + Footer + Customer Dashboard
- All other pages follow the same tokens until their design is added to DESIGN.md

## Tech Stack
Framework:     Next.js 14 (App Router, TypeScript)
Styling:       Tailwind CSS + shadcn/ui
Database:      Supabase (PostgreSQL + Auth + Storage + Realtime)
Deploy:        Vercel
Notifications: Twilio WhatsApp Business API + Supabase Realtime (in-app)
               NOTE: WhatsApp and in-app notifications are separate channels.
               Always reference them distinctly in UI and code.
Payment:       Epoint.az (post-MVP)
Maps:          OpenStreetMap + Leaflet.js (current location, marker drag, reverse geocoding — Nominatim API)
               ⚠️  This is a temporary solution. Post-MVP: replace with Google Maps JavaScript API +
               Places API + Geocoding API.
               Env var: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (not yet added)
Development:   GitHub Codespaces (tablet-friendly)

## Completed Pages / Components

| File | Status | Notes |
|---|---|---|
| `app/page.tsx` | ✅ Done | Landing Page — real data from Supabase |
| `app/(auth)/login/page.tsx` | ✅ Done | Email + password login |
| `app/(auth)/register/page.tsx` | ✅ Done | Customer + worker registration, email verify flow |
| `app/(customer)/request/new/page.tsx` | ✅ Done | 4-step order form |
| `app/(customer)/dashboard/page.tsx` | ✅ Done | Customer dashboard (client-side) |
| `app/(customer)/dashboard/DashboardClient.tsx` | ✅ Done | Order states: searching / offer received / tracking |
| `app/(customer)/layout.tsx` | ✅ Done | Customer layout with Navbar |
| `middleware.ts` | ✅ Done | Route protection + role-based redirect |
| `components/Navbar.tsx` | ✅ Done | Sticky, scroll shadow, auth-aware, avatar dropdown |
| `components/Footer.tsx` | ✅ Done | 5 columns, social links, app badges |
| `components/MapPicker.tsx` | ✅ Done | Leaflet + "Cari məkan" (current location) |
| `app/globals.css` | ✅ Done | Design tokens |
| `lib/supabase/client.ts` | ✅ Done | Browser client |
| `lib/supabase/server.ts` | ✅ Done | Server client |

## Folder Structure
app/
  (auth)/
    login/page.tsx                ← ✅ Done
    register/page.tsx             ← ✅ Done
  (customer)/
    layout.tsx                    ← ✅ Done
    dashboard/
      page.tsx                    ← ✅ Done
      DashboardClient.tsx         ← ✅ Done
    dashboard/history/page.tsx    ← pending
    request/new/page.tsx          ← ✅ Done
    request/[id]/page.tsx         ← pending (offer comparison)
  (worker)/
    dashboard/page.tsx            ← pending
    profile/page.tsx              ← pending
    offers/page.tsx               ← pending
  (admin)/
    page.tsx                      ← pending
  profile/page.tsx                ← pending (customer profile)
  settings/page.tsx               ← pending
  categories/page.tsx             ← pending
  workers/[id]/page.tsx           ← pending
  page.tsx                        ← ✅ Done (landing page)
  layout.tsx
  globals.css                     ← ✅ Done
components/
  ui/                             ← shadcn/ui components
  WorkerCard.tsx
  CategoryGrid.tsx
  RequestForm.tsx
  OfferCard.tsx
  StarRating.tsx
  ChatWindow.tsx
  Navbar.tsx                      ← ✅ Done
  Footer.tsx                      ← ✅ Done
  MapPicker.tsx                   ← ✅ Done (Leaflet)
  WorkerTracker.tsx               ← real-time worker location map
lib/
  supabase/
    client.ts                     ← ✅ Done
    server.ts                     ← ✅ Done
  utils.ts
types/
  database.ts                     ← Supabase auto-generated types
docs/
  PRD.md
  DESIGN.md

## Database Schema (Supabase)

### Tables
profiles        -> id, full_name, phone, role (customer/worker/admin),
                   avatar_url, city, is_verified (bool), created_at

worker_profiles -> user_id, category_id, bio, experience_years,
                   price_min, price_max, available_days (text[]),
                   location_lat, location_lng,
                   current_lat (numeric),
                   current_lng (numeric),
                   is_en_route (bool),
                   rating (numeric),
                   review_count (int), verified (bool), is_active (bool)

categories      -> id, name_az, name_en, icon, color_class,
                   parent_id (uuid, nullable)

job_requests    -> customer_id, category_id, sub_category_id (uuid, nullable),
                   description, address,
                   location_lat (numeric),
                   location_lng (numeric),
                   media_urls (text[]),
                   time_type (exact/flexible),
                   exact_datetime (timestamptz),
                   urgency (today/this_week/flexible),
                   preferred_time (text),
                   status (open/in_progress/done/cancelled)

offers          -> job_id, worker_id, price (numeric), note,
                   eta_hours (int), proposed_datetime (timestamptz),
                   status (pending/accepted/rejected)

messages        -> job_id, sender_id, content (text),
                   file_url (text), read_at (timestamptz), created_at

payments        -> offer_id, amount, commission, epoint_ref,
                   status (held/released/refunded), created_at

reviews         -> job_id, reviewer_id, worker_id,
                   rating (int 1-5), comment (text), created_at

disputes        -> job_id, opened_by, reason, status, resolved_at

notifications   -> id, user_id, type (text), title (text), body (text),
                   job_id (uuid, nullable), read_at (timestamptz),
                   sent_whatsapp (bool), created_at

## Business Rules
- Commission: 10% taken from every completed transaction
- Payment model (MVP — Variant A, cash payment):
    * Epoint.az integration deferred to post-MVP
    * In MVP, customer clicks "Confirm Payment"
    * System auto-creates payments record: status: held, epoint_ref: null
    * Worker sees customer's exact address only after payment
    * Customer confirms "Completed" → status: released
- Chat activates after offer is accepted
- Customer exact location visible to worker ONLY after payment
- Phone numbers NEVER exposed — all contact through in-app chat only
- Worker registration: invite-only + admin verification + ID document required
- Reviews ONLY for completed jobs
- Scheduling:
    EXACT: date (MiniCalendar) + time (30-min intervals, 08:00–20:30)
    FLEXIBLE: urgency (today/this_week/flexible) + time of day (morning/afternoon/evening)
- Media uploads: image + video, max 5 files, optional
- Worker tracking: Supabase Realtime, current_lat/lng real-time update
- Email verification:
    * On signup, profiles.is_verified = false
    * Auto-set to true when email confirmed (trigger)
    * is_verified = true required to submit orders
    * Unverified users see warning banner in dashboard

## Order Status Flow
open        → Customer submitted, searching for workers (no offers yet)
open        → Offers received, customer comparing (offers exist)
in_progress → Offer accepted, worker en route / working
done        → Job completed, payment released
cancelled   → Cancelled by customer or admin

## Dashboard Order Display Logic
| Condition | Label | UI |
|---|---|---|
| status=open, offers=0 | "Usta Axtarılır" | Pulse animation + progress bar |
| status=open, offers>0 | "Təklif Gəldi" | Offer cards + compare CTA |
| status=in_progress | "Aktiv · İzlə" | Tracking accordion + map |
| status=done | Tarixçə | History page only |

## Notification System

### Channels
- WhatsApp (Twilio Business API) — external, async
- In-app (Supabase Realtime + notifications table) — real-time, within platform
- ⚠️ These are SEPARATE channels. Always reference them distinctly in UI copy.
  Example: "WhatsApp bildirişi" vs "Tətbiq bildirişi"
- Language: Azerbaijani

### Events & Templates

#### Worker notifications:
1. New request: category, location, time, short description + link
2. Offer accepted: customer name, job, price + link
3. Payment received: amount + link
4. Job completed: payment sent + link

#### Customer notifications:
1. Worker sent offer: worker name, rating, price, time + link
2. Worker en route: name + tracking link

## MVP Scope
IN SCOPE:
  - Landing page ✅
  - Auth (login, register, email verification) ✅
  - Customer dashboard ✅
  - Worker registration + profile
  - Worker catalog + search + filters
  - Customer job request form (image/video upload, map, time selection) ✅
  - Worker dashboard (requests, offers)
  - Offer system
  - In-app Realtime chat
  - Review + rating system
  - Admin panel
  - WhatsApp + in-app notifications (separate channels)
  - Urgent / available now filter
  - Sub-categories (6 categories × 5 sub = 30)
  - Payment flow (Variant A — cash, mock escrow)
  - Real-time worker location tracking (Leaflet)
  - OpenStreetMap address selection (click, drag, current location) ✅

OUT OF SCOPE (post-MVP):
  - Epoint.az payment integration
  - Google Maps API (Places autocomplete, precise geocoding)
  - Mobile app (iOS/Android)
  - AI matching algorithm
  - Subscription plans
  - Full booking calendar

## MVP Categories (6) with Sub-categories

1. Plumbing (Santexnik)
   - Kran təmiri
   - Boru dəyişimi
   - Kanalizasiya təmizlənməsi
   - Su sayğacı quraşdırılması
   - Vannaxana təmiri

2. Electrical (Elektrik)
   - Elektrik naqili çəkilməsi
   - Rozetka / açar quraşdırılması
   - Qısa qapanma aradan qaldırılması
   - İşıqlandırma quraşdırılması
   - Elektrik paneli təmiri

3. Painting (Boyaqçı)
   - Daxili divar boyası
   - Xarici divar boyası
   - Tavan boyası
   - Ağartma işləri
   - Dekorativ boya

4. Home Repair (Ev təmiri)
   - Qapı / pəncərə təmiri
   - Döşəmə işləri
   - Tavan işləri
   - Mebel yığılması
   - Kiçik tikinti işləri

5. Moving (Köçmə)
   - Mənzil köçürmə
   - Ofis köçürmə
   - Yük daşıma
   - Əşyaların qablaşdırılması
   - Ağır əşyaların daşınması

6. Cleaning (Təmizlik)
   - Ümumi ev təmizliyi
   - Dərin təmizlik
   - Pəncərə yuma
   - Xalça yuma
   - Təmir sonrası təmizlik

## Coding Rules
- TypeScript for ALL files — no plain JS
- Every Supabase query must have try/catch + proper error handling
- Loading skeleton on every async operation
- Mobile-first Tailwind design
- Use shadcn/ui components wherever possible
- Supabase RLS is active — always check auth.uid() in queries
- Default to Server Components — use "use client" only when necessary
  Exception: dashboard and auth-dependent pages use "use client" due to
  Codespace cookie/session limitations
- Playfair Display: h1, h2, h3, worker names, price elements (font-serif)
- DM Sans: all other text (font-sans, default)
- CSS variables: use `var(--primary)` not hardcoded `#1B4FD8`
- Dynamic imports for client-only libraries (e.g. Leaflet): `dynamic(() => import(...), { ssr: false })`
- Order IDs displayed as #PRN-XXXX (first 4 chars of UUID, uppercase)

## Language Rules
- UI text: Azerbaijani (az)
- Error messages: Azerbaijani (az)
- Code (variables, functions, file names): English
- Comments: English preferred

## Navbar Behaviour

Navbar has two variants: `variant="landing"` (default) and `variant="app"`.
- `variant="landing"` → used on landing page (`app/page.tsx`)
- `variant="app"` → used on all authenticated pages (`app/(customer)/layout.tsx`, etc.)

### variant="landing"

**Desktop (md+):**
- Left: Logo + nav links (Xidmətlər, Ustalar, Necə İşləyir) — gap-12 from logo
- Right: Sifariş ver + Sifarişlərim + Bell (yellow) + Avatar dropdown

**Mobile (< 768px) — logged in:**
- Left: Logo
- Right: Sifariş ver + Avatar + Hamburger
- Hamburger drawer contains: Sifarişlərim (first, highlighted) → divider → Xidmətlər, Ustalar, Necə İşləyir

**Mobile (< 768px) — logged out:**
- Left: Logo
- Right: Sifariş ver + Hamburger
- Hamburger drawer contains: Xidmətlər, Ustalar, Necə İşləyir → divider → Giriş + Usta ol

### variant="app"

**Desktop + Mobile — logged in:**
- Left: Logo
- Right: Bell (yellow, always visible) + Avatar dropdown
- No hamburger, no nav links, no Sifariş ver

### Avatar dropdown contents

| Item | landing | app |
|---|---|---|
| Ad + email (header) | ✅ | ✅ |
| Profil | ✅ | ✅ |
| Paramətrlər | ✅ | ✅ |
| Bildirişlər (badge) | ✅ | ❌ (navbar-da var) |
| Sifarişlərim | Mobile only | ❌ |
| Çıxış | ✅ | ✅ |

### Notes
- Hamburger is JS-controlled (`isMobile` state, `window.innerWidth < 768`) — NOT CSS `md:hidden`
- Bell shows unread count badge (red dot) from notifications table (`read_at IS NULL`)
- Drawer closes on backdrop click and on resize to desktop
- Body scroll locked when drawer is open

## Core User Flows

### Customer Flow
1. Browse categories or search
2. Submit job request:
   - Step 1: Category + sub-category
   - Step 2: Description + optional media (image/video, max 5)
   - Step 3: Location (MapPicker — click/drag/current location) +
             Time: EXACT (MiniCalendar + 30-min intervals) /
                   FLEXIBLE (urgency + time of day)
   - Step 4: Success screen — pulse ring + bouncing dots + progress bar sweep
             WhatsApp bildirişi (green) + tətbiq bildirişi (navy) shown separately
             Order details summary (address, description, time)
             "Sifarişlərimə get" → /dashboard
3. Dashboard shows order in "Usta Axtarılır" state (pulse animation)
4. Receive offers → dashboard shows "Təklif Gəldi" state
5. Compare offers, accept one → chat opens
6. "Confirm Payment" → payments record (held)
7. Worker marks "En route" → live tracking in dashboard
8. Worker completes → customer confirms → payment released
9. Leave review

### Worker Flow
1. Register + ID document
2. Admin verifies
3. Browse open requests (in-app + WhatsApp notification)
4. Send offer (price + datetime + note)
5. Customer accepts → chat opens
6. Customer pays → exact location visible
7. Mark "En route" → customer gets live tracking
8. Complete job
9. Payment released after confirmation
10. Receive rating

## Responsive Design Rules (Mobile-First)

### Philosophy
Every UI component is written mobile-first.
Tailwind classes are written small → large, never large only.

  CORRECT:   px-4 sm:px-6 md:px-8 lg:px-16
  WRONG:     px-16   ← desktop only, breaks mobile

### Mandatory Check — Every Section / Component
Before delivering ANY UI code, Claude MUST simulate the layout at:
  1. 375px  — small phone (iPhone SE)
  2. 390px  — standard phone (iPhone 14/15)
  3. 768px  — tablet
  4. 1280px — desktop

Check each of the following:
  - No hard-coded desktop-only padding/margin (px-16, px-[64px], etc.)
  - No horizontal overflow at 375px
  - All touch targets are minimum 44×44px
  - Sticky/fixed bottom elements include iPhone safe area:
      pb-[calc(1rem+env(safe-area-inset-bottom))]
  - Text is readable at all sizes (minimum 11px, avoid fixed large sizes)
  - Flex/grid rows do not overflow at small widths
  - Hamburger menu exists for nav links hidden on mobile

### Reporting Format
After EVERY UI component or section delivered, Claude appends one of:

  ✅ Responsivlik: Qaydasındadır (375px · 768px · 1280px yoxlanıldı)

  ⚠️ Responsivlik: [konkret problem açıqlaması]

This report is MANDATORY — never skip it, even if everything is fine.

### Breakpoints Reference
  mobile:  default (no prefix) — < 640px
  sm:      640px+
  md:      768px+
  lg:      1024px+
  xl:      1280px+

### Common Fixes Reference
  px-16 → px-4 md:px-8 lg:px-16
  px-[64px] → px-4 md:px-8 lg:px-16
  text-[44px] → text-[28px] sm:text-[36px] md:text-[44px]
  fixed bottom CTA → add pb-[calc(1rem+env(safe-area-inset-bottom))]
  hidden nav links → add hamburger menu for mobile

---

## Post-MVP Fixes (tracked)
- [ ] Display UUIDs as #PRN-XXXX format in all UI (job_requests)
- [ ] Replace OpenStreetMap/Leaflet with Google Maps API
- [ ] Add SMS/OTP verification instead of email
- [ ] Epoint.az payment integration
