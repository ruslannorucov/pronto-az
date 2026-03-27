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
- Designed & completed pages: Landing Page + Order Form + Footer
- All other pages follow the same tokens until their design is added to DESIGN.md

## Tech Stack
Framework:     Next.js 14 (App Router, TypeScript)
Styling:       Tailwind CSS + shadcn/ui
Database:      Supabase (PostgreSQL + Auth + Storage + Realtime)
Deploy:        Vercel
Notifications: Twilio WhatsApp Business API + Supabase Realtime (in-app)
Payment:       Epoint.az (post-MVP)
Maps:          OpenStreetMap + Leaflet.js (cari məkan, marker sürüklə, reverse geocoding — Nominatim API)
               ⚠️  Bu müvəqqəti həlldir. Post-MVP-də Google Maps JavaScript API +
               Places API + Geocoding API ilə əvəz edilməlidir.
               Env var: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (hələ əlavə edilməyib)
Development:   GitHub Codespaces (tablet-friendly)

## Tamamlanmış Səhifələr / Komponentlər

| Fayl | Status | Qeyd |
|---|---|---|
| `app/page.tsx` | ✅ Tamamlandı | Landing Page — Supabase ilə real data |
| `app/(customer)/request/new/page.tsx` | ✅ Tamamlandı | 4 addımlı sifariş forması |
| `components/Navbar.tsx` | ✅ Tamamlandı | Sticky, scroll shadow |
| `components/Footer.tsx` | ✅ Tamamlandı | 5 sütun, sosial, app badges |
| `components/MapPicker.tsx` | ✅ Tamamlandı | Leaflet + "Cari məkan" |
| `app/globals.css` | ✅ Tamamlandı | Design tokens |
| `lib/supabase/client.ts` | ✅ Tamamlandı | Browser client |
| `lib/supabase/server.ts` | ✅ Tamamlandı | Server client |

## Folder Structure
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (customer)/
    dashboard/page.tsx
    request/new/page.tsx          ← ✅ Tamamlandı
    request/[id]/page.tsx
  (worker)/
    dashboard/page.tsx
    profile/page.tsx
    offers/page.tsx
  (admin)/
    page.tsx
  categories/page.tsx
  workers/[id]/page.tsx
  page.tsx                        ← ✅ Tamamlandı (landing page)
  layout.tsx
  globals.css                     ← ✅ Tamamlandı
components/
  ui/                             ← shadcn/ui components
  WorkerCard.tsx
  CategoryGrid.tsx
  RequestForm.tsx
  OfferCard.tsx
  StarRating.tsx
  ChatWindow.tsx
  Navbar.tsx                      ← ✅ Tamamlandı
  Footer.tsx                      ← ✅ Tamamlandı
  MapPicker.tsx                   ← ✅ Tamamlandı (Leaflet)
  WorkerTracker.tsx               ← real-time worker location map
lib/
  supabase/
    client.ts                     ← ✅ Tamamlandı
    server.ts                     ← ✅ Tamamlandı
  utils.ts
types/
  database.ts                     ← Supabase auto-generated types
docs/
  PRD.md
  DESIGN.md

## Database Schema (Supabase)

### Tables
profiles        -> id, full_name, phone, role (customer/worker/admin),
                   avatar_url, city, created_at

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
- Payment model (MVP — Variant A, nağd ödəniş):
    * Epoint.az inteqrasiyası post-MVP-ə buraxılıb
    * MVP-də müştəri "Ödənişi təsdiqlə" düyməsinə basır
    * Sistem avtomatik `payments` yazısı yaradır: `status: held`, `epoint_ref: null`
    * Bu anda usta müştərinin dəqiq ünvanını görür
    * İş bitdikdə müştəri "Tamamlandı" təsdiqləyir → `status: released`
- Chat activates after offer is accepted
- Customer exact location visible to worker ONLY after payment
- Phone numbers NEVER exposed — all contact through in-app chat only
- Worker registration: invite-only + admin verification + ID document required
- Reviews ONLY for completed jobs
- Scheduling:
    EXACT: tarix (MiniCalendar) + saat (yarım saatlıq, 08:00–20:30)
    FLEXIBLE: urgency (today/this_week/flexible) + zaman dilimi (səhər/gündüz/axşam)
- Media uploads: şəkil + video, max 5 fayl, optional
- Worker tracking: Supabase Realtime, current_lat/lng real-time update

## Notification System

### Channels
- WhatsApp (Twilio Business API)
- In-app (Supabase Realtime + notifications table)
- Language: Azerbaijani

### Events & Templates

#### Ustaya göndərilən bildirişlər:
1. Yeni sorğu: kateqoriya, yer, vaxt, qısa təsvir + link
2. Təklif qəbul edildi: müştəri adı, iş, qiymət + link
3. Ödəniş alındı: məbləğ + link
4. İş tamamlandı: ödəniş göndərildi + link

#### Müştəriyə göndərilən bildirişlər:
1. Usta təklif göndərdi: usta adı, reytinq, qiymət, vaxt + link
2. Usta yola çıxdı: ad + izlə linki

## MVP Scope
IN SCOPE:
  - Landing page ✅
  - Worker registration + profile
  - Worker catalog + search + filters
  - Customer job request form (şəkil/video upload, xəritə, vaxt seçimi) ✅
  - Worker dashboard (requests, offers)
  - Offer system
  - In-app Realtime chat
  - Review + rating system
  - Admin panel
  - WhatsApp + in-app notifications
  - Urgent / available now filter
  - Sub-categories (6 kateqoriya × 5 sub = 30)
  - Payment flow (Variant A — nağd, mock escrow)
  - Real-time worker location tracking (Leaflet)
  - OpenStreetMap ilə ünvan seçimi (klik, sürüklə, cari məkan) ✅

OUT OF SCOPE (post-MVP):
  - Epoint.az payment integration
  - Google Maps API (Places autocomplete, daha dəqiq geocoding)
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
- Playfair Display: h1, h2, h3, worker names, price elements (font-serif)
- DM Sans: all other text (font-sans, default)
- CSS variables: use `var(--primary)` not hardcoded `#1B4FD8`
- Dynamic imports for client-only libraries (e.g. Leaflet): `dynamic(() => import(...), { ssr: false })`

## Language Rules
- UI text: Azerbaijani (az)
- Error messages: Azerbaijani (az)
- Code (variables, functions, file names): English
- Comments: English preferred

## Core User Flows

### Customer Flow
1. Browse categories or search
2. Submit job request:
   - Step 1: Category + sub-category
   - Step 2: Description + optional media (şəkil/video, max 5)
   - Step 3: Location (MapPicker — klik/sürüklə/cari məkan) +
             Vaxt: EXACT (MiniCalendar + yarım saatlıq saat) /
                   FLEXIBLE (urgency + zaman dilimi)
3. Receive offers (in-app + WhatsApp)
4. Compare offers, accept one → chat aktivləşir
5. "Ödənişi təsdiqlə" → payments yazısı (held)
6. Worker marks "En route" → live tracking
7. Worker completes → customer confirms → payment released
8. Leave review

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
