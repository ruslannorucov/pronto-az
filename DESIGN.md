# Pronto.az — UI Design Specification

> **Scope:** Landing Page + Customer Order Form + Customer Dashboard + Worker Dashboard
> **Note:** Other pages (worker dashboard, customer dashboard, worker profile, admin panel, etc.) are not yet designed. They will be added here as they are built. Until then, all components follow the Design Tokens below.
> **Stack:** Next.js 14 · Tailwind CSS · shadcn/ui · Supabase
> **Hybrid Approach:** Web App style (Landing Page) + Mobile App style (Order Form + Dashboard)

---

## 1. Design System (Design Tokens)

### Colors

| Token (CSS var) | Hex | Usage |
|---|---|---|
| `--primary` | `#1B4FD8` | Primary CTA, active state, link |
| `--primary-light` | `#2563EB` | Hover state |
| `--primary-bg` | `#EFF4FF` | Selected bg, tag bg |
| `--primary-mid` | `#BFCFFE` | Border, divider |
| `--navy` | `#0D1F3C` | Heading, logo, body text |
| `--navy2` | `#1E3A5F` | Secondary navy |
| `--text` | `#0D1F3C` | Body text |
| `--text-2` | `#4A5878` | Secondary text |
| `--text-3` | `#94A3C0` | Placeholder, subtitle |
| `--bg` | `#F8FAFF` | Page background |
| `--white` | `#FFFFFF` | Card bg, navbar |
| `--border` | `#E4EAFB` | Default border |
| `--gray-50` | `#F8FAFF` | Page background |
| `--gray-100` | `#F1F5FE` | Input bg, hover bg |
| `--gray-200` | `#E4EAFB` | Border, divider |
| `--gray-400` | `#94A3C0` | Placeholder, subtitle |
| `--gray-600` | `#4A5878` | Secondary text |
| `--green` | `#10B981` | Verified badge, success |
| `--green-bg` | `#D1FAE5` | Success background |
| `--orange` | `#F59E0B` | "Popular" badge, warning |
| `--orange-pale` | `#FEF3C7` | Warning background |
| `--accent` | `#E8521A` | Accent color |
| `--accent-bg` | `#FFF4EE` | Accent background |

### Typography

```css
/* Display / Headings */
font-family: 'Playfair Display', serif;   /* CSS var: var(--font-playfair) */
/* Body / UI elements */
font-family: 'DM Sans', sans-serif;        /* CSS var: var(--font-dm-sans) */
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Hero title | Playfair Display | 52px | 800 |
| Section title | Playfair Display | 30px | 700 |
| Nav logo | Playfair Display | 24px | 700 |
| Body text | DM Sans | 15–17px | 400 |
| Button | DM Sans | 14px | 600 |
| Label / tag | DM Sans | 11–12px | 500–700 |

**Tailwind classes:**
- `font-serif` → Playfair Display
- `font-sans` → DM Sans (default body)

### Radius & Shadow

```css
rounded-lg   → 16px
rounded-xl   → ~18px
rounded-2xl  → 24px
rounded-full → 9999px

shadow-sm  → 0 1px 3px rgba(13,31,60,0.08)
shadow-md  → 0 4px 16px rgba(13,31,60,0.12)
shadow-lg  → 0 8px 32px rgba(13,31,60,0.18)
shadow-xl  → 0 16px 48px rgba(13,31,60,0.22)
```

### Category Card Colors (bannerGradients)

| Index | Gradient (Tailwind) | Category |
|---|---|---|
| 0 | `from-[#1B4FD8] to-[#2563EB]` | Santexnik |
| 1 | `from-[#B45309] to-[#D97706]` | Elektrik |
| 2 | `from-[#0A7A4F] to-[#10B981]` | Boyaqçı |
| 3 | `from-[#6D28D9] to-[#7C3AED]` | Ev təmiri |
| 4 | `from-[#C2410C] to-[#EA580C]` | Köçmə |
| 5 | `from-[#0369A1] to-[#0EA5E9]` | Təmizlik |

---

## 2. Landing Page

> **Completed:** `app/page.tsx`

### 2.1 Navbar (`components/Navbar.tsx`)

Two variants: `variant="landing"` (default) and `variant="app"`.

#### variant="landing" — Desktop (md+)
```
[ Pronto.az ]  gap-12  [ Xidmətlər | Ustalar | Necə İşləyir ]    [ Sifariş ver | Sifarişlərim | 🔔 | Avatar ▾ ]
```

#### variant="landing" — Mobile logged-in
```
[ Pronto.az ]    [ Sifariş ver | Avatar ▾ | ☰ ]
```
Hamburger drawer (top → bottom):
- 📋 Sifarişlərim — `text-[var(--primary)]`, `bg-[var(--primary-bg)]`
- `border-t border-[var(--gray-100)]` — incə xətt
- Xidmətlər
- Ustalar
- Necə İşləyir

#### variant="landing" — Mobile logged-out
```
[ Pronto.az ]    [ Sifariş ver | ☰ ]
```
Hamburger drawer:
- Xidmətlər, Ustalar, Necə İşləyir
- `border-t` + `grid grid-cols-2`: Giriş | Usta ol

#### variant="app" — Desktop + Mobile
```
[ Pronto.az ]    [ 🔔 | Avatar ▾ ]
```
No hamburger. No nav links. No Sifariş ver.

**Navbar specs:**
- `position: sticky; top: 0; z-index: 50`
- Scroll shadow: `shadow-[0_2px_12px_rgba(13,31,60,0.08)]`
- Height: `68px`
- Padding: `px-4 md:px-8 lg:px-[64px]`
- Logo: Playfair Display, `--navy` + `.` dot in `--primary`
- Container: `flex items-center gap-12`

**Hamburger:**
- SVG icon (3 lines ↔ X), controlled by `isMobile` JS state (`window.innerWidth < 768`)
- Button: `w-9 h-9 rounded-full bg-[var(--gray-100)]`
- Drawer: `max-h-0` → `max-h-[400px]`, `transition-all duration-300 ease-in-out`
- Backdrop: `bg-[rgba(13,31,60,0.25)]`, closes drawer on click

**Avatar dropdown:**
```
┌─────────────────────────┐
│ [Avatar]  Ad            │
│           email         │
├─────────────────────────┤
│ 👤  Profil              │
│ ⚙️  Paramətrlər         │
│ 🔔  Bildirişlər  (3)   │  ← yalnız landing
│ 📋  Sifarişlərim        │  ← yalnız landing mobile
├─────────────────────────┤
│ 🚪  Çıxış               │
└─────────────────────────┘
```
Width: `220px`, `rounded-2xl`, `shadow-[0_8px_32px_rgba(13,31,60,0.12)]`

### 2.2 Hero Section

**Background:**
```jsx
className="bg-gradient-to-br from-[#0D1F3C] via-[#162F6A] to-[#1E1B6E]"
```

**Grid overlay effect:**
```jsx
style={{
  backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
}}
```

**Content centered:** `flex flex-col items-center text-center`

**Search bar:**
- Container: `bg-white, border-radius: 24px, padding: 6px, shadow-xl, max-w-[660px], mx-auto, w-full`
- Left: city select + "Şəhər" label + `border-right: 1.5px solid --border`
- Middle: `<input>` with placeholder
- Right: `48x48px` blue `border-radius: 16px` search button

**Stats row:**
- Layout: `flex flex-wrap justify-center border-t border-white/8 pt-9 w-full max-w-2xl`
- Each stat: `flex-1 text-center px-8`, separated by `border-r border-white/8`
- Number: Playfair Display `30px`, bold, white
- Label: DM Sans `12px`, `text-white/45`

### 2.3 Categories Section

**Background:** `bg-white py-20 px-16`

**Grid:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`

**Data:** Real from Supabase (`parent_id IS NULL`, worker count via `worker_profiles (count)`)

**Featured card (first category — 2 cols):**
```jsx
className="col-span-2 flex items-center gap-5 bg-gradient-to-br from-[#1B4FD8] to-[#2563EB] rounded-2xl p-7"
// Icon: 56x56px, bg-white/15, rounded-xl
// Worker count: "X usta hazır" — if 0: "Ustalar gəlir"
```

**Normal card:**
```jsx
className="bg-[--gray-50] rounded-2xl px-4 py-6 text-center border-[1.5px] border-[--gray-200]
           hover:border-[--primary] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(27,79,216,0.13)] hover:bg-white"
// Icon: 28px
// Worker count: 0 → "Tezliklə"
```

### 2.4 How It Works Section

**Background:** `bg-gradient-to-br from-[#0D1F3C] to-[#162F6A] px-16 py-20` + grid overlay

**Step card:**
```jsx
className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8"
```
- Number: Playfair Display `52px`, `rgba(27,79,216,0.3)`
- Icon: `28px` emoji
- Title: `15px font-semibold white`
- Description: `13px text-white/50 leading-relaxed`

### 2.5 Worker Cards

**Background:** `bg-[--gray-50] py-20 px-16`

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

**Show condition:** Only `is_active=true, verified=true` — section hidden if empty

---

## 3. Order Form

> **Completed:** `app/(customer)/request/new/page.tsx`
> **Purpose:** Mobile-optimized, 4-step order form

### 3.1 Form Architecture

```
Step 1        Step 2             Step 3          Step 4
Category  →   Problem + Media →  Address & Time → Offers
Select        Describe           Select           Compare
```

**Layout:** `max-w-lg mx-auto`

**App header (sticky):**
```jsx
className="bg-white/90 backdrop-blur-md border-b border-[--gray-200] px-5 pt-4 sticky top-0 z-10"
```

**Progress bar:** `h-0.5 flex-1 rounded-full`, active: `bg-[--primary]`, inactive: `bg-[--gray-200]`

**Sticky CTA:**
```jsx
className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-white/90 backdrop-blur-md border-t"
// Active: bg-[--primary] shadow-[0_4px_16px_rgba(27,79,216,0.3)]
// Disabled: bg-[--gray-200] text-[--gray-400] cursor-not-allowed
```

### 3.2 Step 1 — Category Selection

**Heading:** `22px font-bold`

**Category grid:** `grid-cols-3 gap-3`

**Category card:**
```jsx
// Normal
className="rounded-2xl py-4 px-3 text-center border-[1.5px] border-[--gray-200] bg-white"
// Selected
className="bg-[--primary] border-[--primary] shadow-[0_4px_16px_rgba(27,79,216,0.3)]"
// Selected indicator: top-right white dot
```

### 3.3 Step 2 — Problem + Media

**Media Upload (Optional):**
- Badge: `{count}/5 · Optional`
- Drop zone: drag & drop, `border-2 border-dashed`
- `accept="image/*,video/*"`
- Thumbnail: `72x72px rounded-xl`
- Delete button: `-top-1.5 -right-1.5`, `w-5 h-5`, navy → hover: red-500
- Video thumbnail: 🎬 icon
- Max: 5 files

### 3.4 Step 3 — Address & Time

**Map (`components/MapPicker.tsx`):**
- Library: Leaflet.js + OpenStreetMap
- Height: `220px`
- Features: click, drag marker, "Cari məkan" button
- "Cari məkan" button: `absolute top-3 left-3 z-[1000]`, white bg, `--primary` color
- Reverse geocoding: Nominatim API
- Address line below map, `✓ Seçildi` badge
- ⚠️ Post-MVP: Replace with Google Maps API

**Time type cards:** `grid grid-cols-2 gap-3`

**Custom MiniCalendar:**
- Azerbaijani months and days
- Past days: disabled + `text-[--gray-200]`
- Today: `ring-1 ring-[--primary] text-[--primary]`
- Selected: `bg-[--primary] text-white shadow-sm`

**Time selection:** `grid grid-cols-4 gap-2`
- 30-minute intervals: 08:00 – 20:30

### 3.5 Step 4 — Offers

**Success banner:**
```jsx
className="bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] rounded-2xl p-5 border border-[#6EE7B7]"
```

**Empty state:**
```jsx
className="bg-white rounded-2xl border border-[--gray-200] p-8 text-center shadow-sm"
// "15–45 dəqiqə" bolded
```

---

## 4. Customer Dashboard

> **Completed:** `app/(customer)/dashboard/DashboardClient.tsx`
> **Architecture:** "use client" — browser-side Supabase queries (Codespace cookie limitation)

### 4.1 Order States

#### State 1 — Searching for worker (status=open, no offers)
```jsx
// Dark navy gradient background panel
// Pulse ring animation around category icon
// Bouncing dots: "Ustalar sifarişinizi görür..."
// Animated progress bar (left-to-right sweep)
// ETA text: "Adətən 15–45 dəq ərzində təklif gəlir"
// Cancel button: border, hover → red
```

#### State 2 — Offers received (status=open, offers > 0)
```jsx
// Blue border card: border-[1.5px] border-[--primary]
// Blinking dot badge: "X yeni təklif"
// Offer preview cards (worker name, rating, price)
// "Müqayisə et və seç →" CTA button
```

#### State 3 — Worker en route (status=in_progress)
```jsx
// Green border card: border-[1.5px] border-[#A7F3D0]
// Accordion: click header to expand/collapse
// Step progress: Qəbul ✓ → Ödəniş ✓ → Yolda (active, pulse) → Gəldi → Bitdi
// Mini map: grid bg, red pin (you), dashed line, walking worker emoji
// ETA badge top-right of map
```

### 4.2 Dashboard Layout

**Desktop:** `grid-cols-1 lg:grid-cols-2 gap-4`
- Left: Cavab Gözləyir + Usta Axtarılır sections
- Right: Aktiv (tracking) + Tarixçə link

**Mobile:** Single column, same priority order

**Priority order (top to bottom):**
1. "Təklif Gəldi" (offers waiting for acceptance)
2. "Usta Axtarılır" (open, no offers yet)
3. "Aktiv · İzlə" (in_progress, tracking)
4. "Tarixçə" link

**Tarixçə link:**
```jsx
className="flex items-center justify-between bg-[--gray-100] rounded-2xl px-4 py-3.5"
// Icon: 🔄
// Label: "Tarixçə" + "Tamamlanmış sifarişlər"
```

### 4.3 Email Verification Banner
```jsx
className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl px-4 py-3"
// Only shown when is_verified = false
// "Emaili yoxla" button → #F59E0B background
```

---

## 5. Worker Dashboard

> **File:** `app/(worker)/dashboard/WorkerDashboardClient.tsx`
> **Architecture:** "use client" — 3-tab mobile-first layout
> **Target audience:** Middle/senior aged tradespeople — large text, simple UI, minimal cognitive load

### 5.1 Header

```jsx
className="bg-gradient-to-br from-[#1B4FD8] to-[#2563EB] px-4 py-3"
```
- Left: Logo `Pronto.az` (Playfair Display, white)
- Right: usta adı + reytinq (`text-[11px] text-white/65`)

### 5.2 Tab Bar

3 tab: **Yeni işlər** / **Aktiv işlərim** / **Keçmiş**

```jsx
// Tab container
className="flex bg-white border-b border-[--gray-200]"

// Inactive tab
className="flex-1 text-center py-2.5 text-[11px] font-medium text-[--text-3]
           border-b-2 border-transparent"

// Active tab
className="flex-1 text-center py-2.5 text-[11px] font-medium text-[--primary]
           border-b-2 border-[--primary]"
```

- "Yeni işlər" tabında unread badge: `absolute top-[7px] right-[12px] w-[5px] h-[5px] rounded-full bg-[--accent]`

### 5.3 Tab 1 — Yeni işlər

**Page background:** `bg-[--gray-50]`

**Section label:**
```jsx
className="text-[9px] font-bold text-[--text-3] tracking-[0.06em] uppercase px-3 py-2.5"
```

**Sifariş kartı:**
```jsx
// Card
className="bg-white rounded-2xl border-[0.5px] border-[--gray-200] mb-2 overflow-hidden"

// Card body
className="px-3 py-2.5"

// Category + badge row
<div className="flex justify-between items-start mb-1">
  <span className="text-[12px] font-bold text-[--navy]">{category}</span>
  <span className="text-[9px] font-bold text-[--primary] bg-[--primary-bg] px-[7px] py-[2px] rounded-full">
    Yeni
  </span>
</div>

// Meta (location + time)
className="text-[10px] text-[--text-2] mb-1.5"

// Description
className="text-[10px] text-[--text-3] leading-[1.4]"

// Footer
className="border-t border-[--gray-100] px-3 py-[7px] flex items-center justify-between"
```

**"Keç" davranışı (local only — Supabase-ə yazılmır):**
- Basıldıqda: `opacity-40`, kart siyahının sonuna `appendChild` ilə keçir (350ms delay)
- Badge `"Yeni"` → `"Keçildi"` (`bg-[--gray-100] text-[--text-3]`)
- İlk "keçildi" kartından əvvəl `"Keçilmiş sifarişlər"` divider yaranır
- Səhifə yenidən yüklənəndə: orijinal sıra bərpa olunur (server-dən gəlir)

**"Təklif ver" düyməsi:**
```jsx
className="px-3 py-[6px] rounded-lg text-[10px] font-semibold text-white border-none cursor-pointer
           bg-gradient-to-br from-[#1B4FD8] to-[#2563EB]
           shadow-[0_2px_8px_rgba(27,79,216,0.2)]
           hover:shadow-[0_4px_12px_rgba(27,79,216,0.3)] hover:-translate-y-px"
```
→ `SendOfferModal` açır

### 5.4 SendOfferModal

**Bottom sheet — slide-up animation:**
```jsx
// Overlay
className="absolute inset-0 bg-[rgba(13,31,60,0.5)] backdrop-blur-[4px] z-10
           flex items-end rounded-b-[26px]"
// transition: opacity 0.25s ease
// pointer-events: none when hidden

// Modal sheet
className="bg-white rounded-t-[20px] rounded-b-[26px] w-full px-[14px] pt-[16px] pb-[14px]"
// transform: translateY(100%) → translateY(0)
// transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)
```

**Handle bar:**
```jsx
className="w-8 h-[3px] rounded-full bg-[--gray-200] mx-auto mb-[14px]"
```

**3 sahə:**

```jsx
// 1. Qiymət — böyük serif input
<div className="flex items-center bg-[--gray-50] border-[1.5px] border-[--gray-200]
                rounded-xl px-3 py-2 mb-2.5 focus-within:border-[--primary] focus-within:bg-white">
  <input type="number" className="border-none bg-transparent text-[22px] font-bold
                                  text-[--navy] w-20 outline-none font-serif" />
  <span className="text-[18px] font-bold text-[--text-3] ml-1">₼</span>
</div>

// 2. Vaxt — select
<select className="w-full border-[1.5px] border-[--gray-200] rounded-xl px-3 py-[9px]
                   text-[12px] text-[--navy] bg-[--gray-50] mb-2.5
                   focus:border-[--primary] focus:bg-white" />

// 3. Qeyd — optional textarea
<div className="bg-[--gray-50] border-[1.5px] border-[--gray-200] rounded-xl px-3 py-2 mb-3
                focus-within:border-[--primary] focus-within:bg-white">
  <textarea rows={2} placeholder="Materiallar mənidədir..." className="..." />
</div>
```

**Düymələr:**
```jsx
// Ləğv et
className="flex-1 py-2.5 rounded-xl border-[1.5px] border-[--gray-200]
           bg-transparent text-[12px] font-semibold text-[--text-3]"

// Göndər →
className="flex-[2] py-2.5 rounded-xl text-white text-[12px] font-bold border-none cursor-pointer
           bg-gradient-to-br from-[#1B4FD8] to-[#2563EB]
           shadow-[0_4px_12px_rgba(27,79,216,0.25)]
           hover:shadow-[0_6px_16px_rgba(27,79,216,0.35)] hover:-translate-y-px"
```

**Overlay klikləyib bağlamaq:** `onClick` overlay-ə, modal-a yox

**Submit sonrası:**
1. `offers` cədvəlinə `INSERT` (status: `pending`)
2. `notifications` cədvəlinə `INSERT` — müştəriyə bildiriş
3. Modal bağlanır
4. Kart siyahıdan silinir
5. Toast: `"✓ Təklifiniz göndərildi! Müştəri bildiriş aldı."` — `bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0]`, 3 saniyə

**Offer limiti:** Bir sifarişə maksimum 5 `pending` təklif. 5 dolubsa "Təklif ver" disabled + `"Bu sifariş doludur"` tooltip.

### 5.5 Tab 2 — Aktiv işlərim

**Sıralama:** `exact_datetime ASC` — ən yaxın vaxtlı iş yuxarıda

**Accordion iş kartı:**
```jsx
// Green border — cari aktiv iş
className="bg-white rounded-2xl border-[1.5px] border-[#A7F3D0] mx-2.5 mb-2 overflow-hidden"

// Yellow border — növbəti/gözləyən iş
className="bg-white rounded-2xl border-[1.5px] border-[#FCD34D] mx-2.5 mb-2 overflow-hidden"
```

**Accordion header (bağlı vəziyyət):**
```jsx
className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"

// Sıra nömrəsi badge
// Aktiv: bg-gradient-to-br from-[#1B4FD8] to-[#2563EB] text-white
// Gözləyir: bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-white
className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold"

// Növbəti addım pill
// Mavi: bg-[--primary-bg] text-[--primary]
// Yaşıl: bg-[--green-bg] text-green-700
// Sarı: bg-[--orange-pale] text-amber-800
className="inline-flex bg-[--primary-bg] rounded-full px-[7px] py-[1px] text-[9px] font-bold"

// Chat ikonu (accordion-dan müstəqil — stopPropagation)
className="w-[26px] h-[26px] rounded-lg border-[0.5px] border-[--gray-200]
           flex items-center justify-center cursor-pointer"
```

**Accordion body (açıq vəziyyət):**
- `max-height: 0 → 400px`, `transition: max-height 0.3s ease`
- Chevron: `transition: transform 0.2s`, açıqda `rotate(180deg)`

**Detail row (3 kart):**
```jsx
className="flex gap-1.5 mt-2.5"
// Hər kart: bg-[--gray-50] rounded-lg px-2 py-1.5
// Label: text-[9px] text-[--text-3]
// Value: text-[11px] font-bold text-[--navy]
```

**Step progress (5 addım):**
`Qəbul → Ödəniş → Yolda → Gəldi → Bitdi`
```jsx
// Tamamlanan: text-[10px] font-bold text-[--green]
// Cari:       text-[10px] font-bold text-[--primary]
// Gələcək:    text-[9px] text-[--text-3]
// Xətt — tamamlanmış: bg-[--green], yox: bg-[--gray-200]
```

**Status → Düymə mapping:**
| DB Status | Düymə | Rəng |
|---|---|---|
| `accepted` | "Ödəniş gözlənilir" | `bg-[--gray-200]`, disabled |
| `paid` | "Yola düş →" | mavi gradient |
| `en_route` | "İş bitdi ✓" | yaşıl gradient |
| `completed` | — kart Keçmiş taba keçir | — |

### 5.6 Tab 3 — Keçmiş

**Tarixçə elementi:**
```jsx
className="bg-white rounded-xl mx-2.5 mb-1.5 px-3 py-2.5 flex items-center justify-between"
// Sol: kateqoriya (12px bold navy) + tarix (10px text-3)
// Sağ: qiymət (13px bold navy font-serif) + ulduzlar (10px amber)
```

**Qazanc kartı (aşağıda):**
```jsx
className="bg-gradient-to-br from-[#1B4FD8] to-[#2563EB] rounded-2xl mx-2.5 mb-2.5 p-[14px]
           flex justify-between items-center"
// Sol: "Bu ay qazandım" (10px white/60) + məbləğ (22px bold white font-serif)
// Sağ: "Orta reytinq" (10px white/60) + ulduz dəyəri (18px bold amber-300)
```

### 5.7 Offer Status Flow

```
pending   → göndərildi, müştəri baxır        (worker görür: "Göndərildi")
accepted  → müştəri seçdi ✅                  (worker bildiriş alır)
rejected  → müştəri başqasını seçdi ❌        (avtomatik, worker bildiriş alır)
expired   → 48 saat keçdi ⏰                  (cron job, növbəti slot açılır)
```

**Offer limit mexanikası:**
- 1 sifarişə max 5 `pending` təklif
- 6-cı sıradakı usta yalnız birinci `expired` olanda görünür
- Müştəri seçim edəndə: 1 `accepted`, qalanlar avtomatik `rejected`
- Rədd edilən ustaya bildiriş: *"Bağışlayın, müştəri başqa ustanı seçdi."*

### 5.8 Sifariş Kartı Sıralama (Yeni işlər tab)

**Default sıra (server-dən):** `created_at DESC` — ən yeni yuxarıda

**"Keç" sonrası sıra (client-side only):**
- Keçilmiş kartlar siyahının sonuna atılır
- Server sırası yalnız səhifə yenidən yüklənəndə bərpa olur

---

## 6. Footer (`components/Footer.tsx`)

**Background:** `#0A1628` + `border-t border-white/8`

**Layout:** `grid-cols-1 md:grid-cols-5 gap-12`

**Brand column (col-span-2):**
- Logo: Playfair Display, white + blue dot
- Description: `text-[14px] text-white/45`, max-w-[280px]
- Social links: `w-9 h-9 rounded-full bg-white/8 border border-white/10`, hover: `bg-[--primary]`
- App badges (App Store + Google Play): `bg-white/8 border border-white/10 rounded-xl`

**Link columns (3):**
- Xidmətlər, Şirkət, Dəstək
- Title: `text-[12px] font-bold text-white/90 uppercase tracking-widest`
- Links: `text-[14px] text-white/45 hover:text-white`

**Bottom row:**
- Copyright: `text-[13px] text-white/30`
- System status: green `animate-pulse` dot + "Bütün sistemlər işləyir"

---

## 7. Reusable Components

### Buttons

```jsx
// Primary (CTA)
className="bg-[var(--primary)] text-white font-semibold rounded-full px-5 py-2.5 text-sm
           hover:bg-[var(--primary-light)] transition-colors"

// Ghost (outline)
className="border-[1.5px] border-[var(--gray-200)] bg-transparent text-[var(--navy)]
           font-medium rounded-full px-5 py-2.5 text-sm
           hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
```

### Badges

```jsx
// Verified
<span className="bg-[var(--green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
  ✓ Təsdiqlənmiş
</span>

// Popular
<span className="bg-orange-50 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
  🔥 Populyar
</span>
```

### Section Header

```jsx
<div className="flex items-end justify-between mb-8">
  <div>
    <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-2">
      {label}
    </p>
    <h2 className="font-serif text-[30px] font-bold text-[var(--navy)]">
      {title}
    </h2>
  </div>
  <a href="#" className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all">
    Hamısını gör →
  </a>
</div>
```

---

## 8. Responsive Breakpoints

### Breakpoint Table

| Screen | Breakpoint | Changes |
|---|---|---|
| Desktop | `≥ 1280px` | 6-col category grid, 3-col worker cards, `px-16` |
| Tablet | `768–1279px` | 3-col category, 2-col worker cards, `px-8` |
| Mobile | `< 640px` | 2-col category, full-width search, `px-4`, hamburger nav |

### Mobile-First Padding System

All sections use this padding pattern — never hardcode `px-16` alone:
```jsx
className="px-4 md:px-8 lg:px-16"
```

### Navbar — Mobile Behaviour

**Mobile (< 768px):**
- Logo stays visible (left)
- Hamburger button (right): `w-9 h-9`, 3 lines → X icon on open
- Nav links (Xidmətlər, Ustalar, Necə İşləyir) hidden — shown in mobile drawer
- Action buttons collapse: only "Sifariş ver" remains visible
- Logged-in: Bell icon + Avatar visible; "Sifarişlərim" moves into drawer
- Mobile drawer: slides down from navbar, `bg-white`, full-width, `py-4 px-5`
- Drawer contains: nav links + Sifarişlərim + Giriş/Çıxış

```jsx
// Hamburger button
className="md:hidden w-9 h-9 rounded-full bg-[var(--gray-100)]
           flex items-center justify-center text-[var(--navy)]"

// Mobile drawer
className="md:hidden absolute top-full left-0 right-0 bg-white
           border-b border-[var(--border)] shadow-md px-5 py-4 z-40"
```

**Tablet (768px+):**
- Full navbar visible, `px-8`

**Desktop (1280px+):**
- Full navbar, `px-16`

### Hero Section — Mobile

```jsx
// Section padding
className="px-4 md:px-8 lg:px-16 py-12 md:py-20 md:py-28"

// Heading — scales up
className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px]"

// Search bar — stacks on mobile
// Mobile: city select full-width top, input + button below
// Tablet+: single row layout

// Stats row — 2×2 on mobile, 4-col on tablet+
className="grid grid-cols-2 sm:grid-cols-4"
```

### Touch Targets

All interactive elements (buttons, links, cards) must be minimum **44×44px** on mobile.
- Nav buttons: `py-2 px-4` minimum
- Icon buttons: `w-9 h-9` minimum (36px — acceptable), `w-11 h-11` preferred (44px)
- Form inputs: `py-3` minimum height

### Safe Area (iPhone notch / home indicator)

Any `fixed` or `sticky` bottom element MUST include:
```jsx
className="pb-[calc(1rem+env(safe-area-inset-bottom))]"
```
This prevents the iPhone home indicator from overlapping CTA buttons.

---

## 9. Animation Rules

```css
/* Card hover */
transition: all 250ms ease;
hover: translateY(-4px) + box-shadow increase

/* Progress bar */
transition: all 500ms;

/* Category selection */
transition: all 200ms;
active:scale-95 ← tap feedback

/* Backdrop blur (header/CTA) */
backdrop-filter: blur(12px);
background: rgba(255,255,255,0.9);

/* Pulse ring (dashboard searching state) */
animation: pulse-out 2s ease-out infinite
@keyframes pulse-out { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }

/* Bouncing dots (dashboard searching state) */
animation: bounce-dot 1.2s ease-in-out infinite (staggered 0.2s)

/* Progress bar sweep (dashboard searching state) */
animation: progress-pulse 2s ease-in-out infinite

/* Map walking worker */
animation: walk 1s ease-in-out infinite alternate

/* System status */
animate-pulse ← green dot

/* Marker flyTo (map) */
duration: 1.2s ← Leaflet flyTo
```

---

## 10. Pages Not Yet Designed

The following pages will be added here as they are designed and built.
Until then, the Design Tokens above are the reference.

- [x] Worker Dashboard ← Section 5
- [ ] Worker Profile page
- [ ] Worker Registration
- [ ] Job Request Detail (`/request/[id]`) — offer comparison
- [ ] Offer Detail & Comparison
- [ ] In-app Chat (ChatWindow)
- [ ] Admin Panel
- [ ] Categories listing page
- [ ] Worker catalog + search + filters
- [ ] Real-time worker tracking map (full page)
- [ ] Reviews & Ratings
- [ ] Notifications panel
- [ ] Customer Profile page (`/profile`)
- [ ] Settings page (`/settings`)
- [ ] History page (`/dashboard/history`)
