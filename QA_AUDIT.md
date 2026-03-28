# 🛠 Web Application Comprehensive Quality Assurance & Security Audit
**Role:** Senior QA & Security Engineer  
**Status:** Operational / Post-Deployment  
**Objective:** To identify UI/UX inconsistencies, functional bugs, security vulnerabilities, and performance bottlenecks using industry best practices (OWASP, Web Vitals).

---

## 🔍 1. Authentication & Security (Critical Audit)
*Strictly monitor Supabase RLS and Auth flows.*

- [ ] **RLS Policies Verification:** Ensure no direct access to `profiles` or `worker_profiles` without Row Level Security. Test with an unauthenticated session.
- [ ] **SQL Injection Prevention:** Verify all Supabase queries use parameterized filters (no string interpolation in `.eq()` or `.filter()`).
- [ ] **Auth State Persistence:** Check if the session persists after page refresh and expires correctly after logout across all tabs.
- [ ] **Sensitive Data Leakage:** Confirm that `service_role` keys are **NOT** exposed in client-side code or bundled in the Vercel build.
- [ ] **Input Sanitization:** Test all forms (Registration, Bio, Search) for XSS (Cross-Site Scripting) by injecting `<script>` tags.

---

## 🧪 2. Functional Testing (User Workflows)
*Testing the core business logic of Pronto.az.*

- [ ] **Worker Registration "Upsert" Logic:** Does the system handle duplicate emails or IDs gracefully without crashing? (Check for `duplicate key` errors).
- [ ] **Role-Based Access Control (RBAC):** Ensure a user with a `customer` role cannot manually navigate to `/worker/panel`.
- [ ] **Search Engine Accuracy:** Verify that search results correctly filter by `category_id` and `location` using real DB data.
- [ ] **Real-time Synchronization:** Test if new job requests appear on the worker's dashboard instantly via Supabase Realtime without manual refresh.
- [ ] **Edge Case Validation:** Test phone number inputs with invalid characters and passwords shorter than 6 characters.

---

## 📱 3. UI/UX & Responsive Design Audit
*Ensuring a seamless experience across all devices.*

- [ ] **Mobile Responsiveness:** Test the Navbar, Hero sections, and Modals on mobile breakpoints (375px, 414px). Check for horizontal scrolling bugs.
- [ ] **Hydration & Prerendering:** Check the browser console for "Hydration Mismatch" errors during Next.js navigation.
- [ ] **Loading & Empty States:** Ensure Skeletons or Spinners are visible during data fetch. Verify "No results found" illustrations appear when the DB is empty.
- [ ] **Form Feedback:** Are error messages (Toast/Alerts) clear and actionable for the user?

---

## ⚡ 4. Performance & Best Practices
*Optimization for Vercel and Production environment.*

- [ ] **Image Optimization:** Are user avatars and hero banners using `next/image` with the correct `sizes` attribute?
- [ ] **Environment Variable Sync:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `KEY` are correctly synced between `.env.local` and Vercel Production settings.
- [ ] **Dynamic Rendering:** Verify that pages using `cookies()` or `searchParams` are wrapped in `<Suspense>` to prevent Prerender Errors.
- [ ] **Error Boundaries:** Does the app show a graceful "Something went wrong" page instead of a white screen during a 500 error?

---

## 📝 5. Engineer's Findings & Suggestions
*Documenting gaps discovered during the latest audit.*

### 🔴 High Priority (Bugs/Vulnerabilities)
* *Example: RLS policy for the 'payments' table allows updates from non-owner IDs.*
* *Example: Password reset flow is missing rate-limiting (OTP brute-force risk).*

### 🟡 Medium Priority (Improvements)
* *Example: Implement 'Debounced Search' to reduce Supabase API costs.*
* *Example: Add 'Remember Me' functionality to the login persistent session.*

### 🟢 Professional Recommendations (Best Practices)
* **Validation:** Use **Zod** for schema validation on both Client and Server components.
* **Security:** Move sensitive logic (e.g., payment status updates) to **Supabase Edge Functions**.
* **Monitoring:** Integrate **Sentry** or **LogRocket** to track production errors in real-time.

---

## 🇦🇿 6. Pronto.az — Business Logic QA (Platform-Specific)
*These checks are mandatory for every feature delivery.*

### Offer System
- [ ] **Offer Limit:** Max 5 `pending` offers per job_request. 6th worker sees "Bu sifariş doludur" tooltip + disabled button.
- [ ] **Offer Status Flow:** `pending` → `accepted` (1 only) → all others auto-set to `rejected` → rejected workers receive notification.
- [ ] **Expired Offers:** After 48h without response, offer status → `expired`. Next worker slot opens automatically.
- [ ] **"Keç" Behaviour:** Skipped cards move to end of list (client-side only, not written to Supabase). Badge changes "Yeni" → "Keçildi". Page refresh restores original server order.

### Worker Status Gate
- [ ] **Pending Worker:** `verified=false` → layout renders PendingScreen, NOT dashboard. All `/worker/*` routes blocked.
- [ ] **Blocked Worker:** `verified=true, is_active=false` → BlockedScreen shown.
- [ ] **No worker_profiles row:** → redirect to `/worker/register`.
- [ ] **Role mismatch:** `role ≠ "worker"` → redirect to `/dashboard`.

### Payment & Privacy (MVP Variant A — Cash)
- [ ] **Address Privacy:** Customer exact `location_lat/lng` NOT visible to worker before payment confirmation.
- [ ] **Chat Unlock:** In-app chat activates ONLY after offer acceptance — not before.
- [ ] **Mock Escrow:** "Ödənişi təsdiqlə" creates `payments` row with `status: held, epoint_ref: null`.
- [ ] **Phone Privacy:** Phone numbers never shown in UI — contact via in-app chat only.

### Notification Channels
- [ ] **Channel Separation:** WhatsApp (Twilio) and in-app notifications are always referenced distinctly in UI copy ("WhatsApp bildirişi" vs "Tətbiq bildirişi").
- [ ] **In-app badge:** Bell icon shows unread count from `notifications` table where `read_at IS NULL`.
- [ ] **Azerbaijani language:** All notification body text must be in Azerbaijani.
- [ ] **Worker events:** New request, offer accepted, payment received, job completed.
- [ ] **Customer events:** Worker sent offer, worker en route.

### Order ID Format
- [ ] All `job_request` IDs displayed as `#PRN-XXXX` (first 4 chars of UUID, uppercase) — never raw UUID in any UI element.

### Scheduling
- [ ] **Exact mode:** Date (MiniCalendar) + time (30-min grid, 08:00–20:30) — both required before submission.
- [ ] **Flexible mode:** Urgency pill (`today` / `this_week` / `flexible`) + time-of-day slot — both required.
- [ ] **Past dates:** Disabled in MiniCalendar — cannot be selected.

### Codespace / Development Environment
- [ ] **Client-side Supabase only:** Dashboard and auth pages use browser client (`lib/supabase/client.ts`) — server-side cookie reading is not reliable in Codespaces.
- [ ] **CORS:** Codespace preview URL must be present in Supabase allowed origins list before testing auth flows.

---

**Last Audit Date:** 2026-03-28  
**Auditor Signature:** `Pronto-QA`
