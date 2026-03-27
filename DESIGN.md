# Pronto.az — UI Dizayn Spesifikasiyası

> **Əhatə:** Ana Səhifə (Landing Page) + Müştəri Sifariş Forması
> **Qeyd:** Digər səhifələrin dizaynı (worker dashboard, customer dashboard, worker profile, admin panel, və s.) hələ tamamlanmayıb. Onlar yazıldıqca bu fayla əlavə ediləcək. O vaxta qədər bütün komponentlər aşağıdakı Design Tokens-ə uyğun brend stilini qoruyur.
> **Stack:** Next.js 14 · Tailwind CSS · shadcn/ui · Supabase
> **Hibrid Yanaşma:** Web App tərzi (Ana Səhifə) + Mobil App tərzi (Forma)

---

## 1. Dizayn Sistemi (Design Tokens)

### Rənglər

| Token (CSS var) | Hex | İstifadə |
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
| `--orange` | `#F59E0B` | "Populyar" badge, warning |
| `--orange-pale` | `#FEF3C7` | Warning background |
| `--accent` | `#E8521A` | Accent color |
| `--accent-bg` | `#FFF4EE` | Accent background |

### Tipografiya

```css
/* Display / Başlıqlar */
font-family: 'Playfair Display', serif;   /* CSS var: var(--font-playfair) */
/* Body / UI elementləri */
font-family: 'DM Sans', sans-serif;        /* CSS var: var(--font-dm-sans) */
```

| Rol | Font | Ölçü | Çəki |
|---|---|---|---|
| Hero title | Playfair Display | 52px | 800 |
| Section title | Playfair Display | 30px | 700 |
| Nav logo | Playfair Display | 24px | 700 |
| Body text | DM Sans | 15–17px | 400 |
| Button | DM Sans | 14px | 600 |
| Label / tag | DM Sans | 11–12px | 500–700 |

**Tailwind class-ları:**
- `font-serif` → Playfair Display
- `font-sans` → DM Sans (default body)

### Radius & Kölgə

```css
/* Kod-da birbaşa Tailwind class-ları istifadə edilir */
rounded-lg   → 16px
rounded-xl   → ~18px
rounded-2xl  → 24px
rounded-full → 9999px

shadow-sm  → 0 1px 3px rgba(13,31,60,0.08)
shadow-md  → 0 4px 16px rgba(13,31,60,0.12)
shadow-lg  → 0 8px 32px rgba(13,31,60,0.18)
shadow-xl  → 0 16px 48px rgba(13,31,60,0.22)
```

### Kateqoriya Kart Rəngləri (bannerGradients)

Worker kartı banner və kateqoriya badge-ləri üçün:

| Index | Gradient (Tailwind) | Kateqoriya |
|---|---|---|
| 0 | `from-[#1B4FD8] to-[#2563EB]` | Santexnik |
| 1 | `from-[#B45309] to-[#D97706]` | Elektrik |
| 2 | `from-[#0A7A4F] to-[#10B981]` | Boyaqçı |
| 3 | `from-[#6D28D9] to-[#7C3AED]` | Ev təmiri |
| 4 | `from-[#C2410C] to-[#EA580C]` | Köçmə |
| 5 | `from-[#0369A1] to-[#0EA5E9]` | Təmizlik |

---

## 2. Ana Səhifə (Landing Page)

> **Tamamlanmış:** `app/page.tsx`
> **Məqsəd:** İstifadəçi sayta girən kimi böyük axtarış çubuğunu və xidmətləri rahat görsün.

### 2.1 Navbar (`components/Navbar.tsx`)

```
[ Pronto.az logo ]    [ Xidmətlər | Ustalar | Necə İşləyir | Qiymətlər ]    [ Usta ol (outline) | Sifariş ver (primary) ]
```

**Xüsusiyyətlər:**
- `position: sticky; top: 0` — scroll-da qalır
- Scroll-da `shadow-[0_2px_12px_rgba(13,31,60,0.08)]` əlavə olunur
- Background: `white` + `border-bottom: 1px solid --border`
- Height: `68px`, padding: `0 64px`
- Logo: Playfair Display, `--navy` + `.` nöqtəsi `--primary` rəngdə
- Nav linklər: `text-sm font-medium text-[--gray-600]`, hover: `--primary`
- "Usta ol" düyməsi: `border-[1.5px] border-[--gray-200]`, hover: `--primary`
- "Sifariş ver" düyməsi: `bg-[--primary]`, `border-radius: full`, `font-weight: 600`

### 2.2 Hero Section

**Fon:**
```jsx
className="bg-gradient-to-br from-[#0D1F3C] via-[#162F6A] to-[#1E1B6E]"
```

**Grid overlay effekti:**
```jsx
style={{
  backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
}}
```

**Radial glow-lar:**
- Sağ yuxarı: `rgba(27,79,216,0.25)`, `600x600px`
- Sol aşağı: `rgba(30,27,110,0.4)`, `400x400px`

**Hero məzmunu mərkəzləşdirilib:** `flex flex-col items-center text-center`

**Badge:**
```jsx
className="inline-flex items-center gap-1.5 rounded-full
           border border-[rgba(147,180,255,0.25)] bg-[rgba(27,79,216,0.18)]
           px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#93B4FF]"
```

**Başlıq:**
```jsx
<h1 className="font-serif text-[44px] md:text-[52px] font-extrabold text-white leading-[1.15] max-w-[620px] mx-auto">
  Evdə problem?
  <em className="not-italic bg-gradient-to-r from-[#93B4FF] to-[#60A5FA] bg-clip-text text-transparent">
    Pronto
  </em> həll edir.
</h1>
```

**Axtarış çubuğu:**
- Container: `bg-white, border-radius: 24px, padding: 6px, shadow-xl, max-w-[660px], mx-auto, w-full`
- Sol: şəhər seçimi + "Şəhər" label-i + `border-right: 1.5px solid --border`, `min-w-[160px]`
- Orta: `<input>` placeholder ilə, `text-[15px]`
- Sağ: `48x48px` mavi `border-radius: 16px` axtarış düyməsi

**Chip-lər:**
- `rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px]`
- Hover: `bg-white/18 text-white`
- Layout: `flex flex-wrap gap-2 justify-center`

**Statistika sırası:**
- Layout: `flex flex-wrap justify-center border-t border-white/8 pt-9 w-full max-w-2xl`
- Hər stat: `flex-1 text-center px-8`, aralarında `border-r border-white/8`
- Rəqəm: Playfair Display `30px`, bold, white
- Etiket: DM Sans `12px`, `text-white/45`

### 2.3 Kateqoriyalar Bölməsi

**Fon:** `bg-white py-20 px-16`

**Grid:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`

**Data:** Supabase-dən real data (`parent_id IS NULL`, usta sayı `worker_profiles (count)` ilə)

**Featured kart (ilk kateqoriya — 2 sütun):**
```jsx
className="col-span-2 flex items-center gap-5 bg-gradient-to-br from-[#1B4FD8] to-[#2563EB] rounded-2xl p-7 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(27,79,216,0.35)]"
// İkon: 56x56px, bg-white/15, rounded-xl içində
// Usta sayı: "X usta hazır" — 0 isə "Ustalar gəlir"
```

**Normal kart:**
```jsx
className="bg-[--gray-50] rounded-2xl px-4 py-6 text-center border-[1.5px] border-[--gray-200]
           hover:border-[--primary] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(27,79,216,0.13)] hover:bg-white"
// İkon: 28px
// Usta sayı: 0 isə "Tezliklə"
```

### 2.4 "Necə İşləyir" Bölməsi

**Fon:** `bg-gradient-to-br from-[#0D1F3C] to-[#162F6A] px-16 py-20` + grid overlay

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`

**Step kart:**
```jsx
className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8"
```
- Nömrə: Playfair Display `52px`, `rgba(27,79,216,0.3)`
- İkon: `28px` emoji
- Başlıq: `15px font-semibold white`
- Açıqlama: `13px text-white/50 leading-relaxed`
- Connector xətti (desktop): `hidden lg:block absolute top-10 -right-3 w-6 h-[1.5px] bg-white/10`

**CTA düyməsi:** `bg-[--primary] rounded-full px-7 py-3.5`

### 2.5 Usta Kartları

**Fon:** `bg-[--gray-50] py-20 px-16`

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

**Göstərmə şərti:** Yalnız `is_active=true, verified=true` ustalar — boşdursa bölmə görünmür

**Kart strukturu:**
- Banner: `80px`, gradient (bannerGradients-dən)
- Avatar: `60x60px`, `rounded-full`, `border-3px white`, `absolute -bottom-[30px] left-5`
- Body padding: `pt-10 px-5 pb-5`
- Başlıq: `font-serif 16px font-semibold`

**Düymələr:**
- "Profil" → outline blue, `flex-1`
- "Sifariş ver" → solid blue, `flex-1`

---

## 3. Sifariş Forması (Order Form)

> **Tamamlanmış:** `app/(customer)/request/new/page.tsx`
> **Məqsəd:** Mobil-optimized, 4 addımlı sifariş forması

### 3.1 Forma Arxitekturası

```
Addım 1         Addım 2              Addım 3         Addım 4
Kateqoriya  →   Problem + Media  →   Ünvan & Vaxt →  Təkliflər
Seç             İzah et              Seç             Müqayisə et
```

**Layout:** `max-w-lg mx-auto` — mobil görünüş

**App header (sticky):**
```jsx
className="bg-white/90 backdrop-blur-md border-b border-[--gray-200] px-5 pt-4 sticky top-0 z-10"
// Geri düyməsi: 36x36px rounded-full bg-[--gray-100]
// Başlıq + "Addım X / 4"
// Sağda: animated step dots
```

**Progress bar:** `h-0.5 flex-1 rounded-full`, aktiv: `bg-[--primary]`, passiv: `bg-[--gray-200]`, `transition-all duration-500`

**Sticky CTA:**
```jsx
className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-white/90 backdrop-blur-md border-t"
// Aktiv: bg-[--primary] shadow-[0_4px_16px_rgba(27,79,216,0.3)]
// Disabled: bg-[--gray-200] text-[--gray-400] cursor-not-allowed
```

### 3.2 Addım 1 — Kateqoriya Seçimi

**Başlıq:** `22px font-bold`

**Kateqoriya grid:** `grid-cols-3 gap-3`

**Kateqoriya kart:**
```jsx
// Normal
className="rounded-2xl py-4 px-3 text-center border-[1.5px] border-[--gray-200] bg-white hover:border-[--primary-mid] hover:shadow-sm"
// Selected
className="bg-[--primary] border-[--primary] shadow-[0_4px_16px_rgba(27,79,216,0.3)]"
// Selected indicator: top-right ağ nöqtə
// İkon: text-2xl, ad: text-[11px] font-bold
// Seçiləndə mətn: text-white
```

**Alt kateqoriya separator:**
```jsx
<div className="flex items-center gap-3 mb-4">
  <div className="h-px flex-1 bg-[--gray-200]" />
  <p className="text-[11px] font-bold text-[--gray-400] uppercase tracking-wider">Alt kateqoriya</p>
  <div className="h-px flex-1 bg-[--gray-200]" />
</div>
```

**Alt kateqoriya pill:**
```jsx
// Normal
className="text-[12px] font-semibold px-4 py-2 rounded-full border-[1.5px] border-[--gray-200] bg-white text-[--navy]"
// Selected
className="bg-[--primary] border-[--primary] text-white shadow-sm"
```

**Davranış:**
- Əsas kateqoriya seçilmədən alt kateqoriyalar görünmür
- Hər ikisi seçilmədən "Növbəti" disabled
- Kateqoriya dəyişdikdə alt kateqoriya sıfırlanır

### 3.3 Addım 2 — Problem İzahı + Media

**Textarea:**
```jsx
className="w-full border-[1.5px] border-[--gray-200] rounded-2xl p-4 text-[14px] bg-white resize-none
           focus:border-[--primary] focus:shadow-[0_0_0_3px_rgba(27,79,216,0.08)] leading-relaxed"
// Validation indicator: "✓ Kifayət qədər" (green) / "Minimum 10 simvol (X/10)" (gray)
```

**Media Upload (Optional):**
- Badge: `{count}/5 · Optional`
- Drop zone: drag & drop dəstəyi, `border-2 border-dashed`, hover + drag-over state
- `accept="image/*,video/*"` — həm şəkil həm video
- Thumbnail: `72x72px rounded-xl`
- Sil düyməsi: `-top-1.5 -right-1.5`, `w-5 h-5`, navy → hover: red-500
- Video thumbnail: 🎬 ikonu ilə fərqləndirilir
- Max: 5 fayl

### 3.4 Addım 3 — Ünvan & Vaxt

**Xəritə (`components/MapPicker.tsx`):**
- Kitabxana: Leaflet.js + OpenStreetMap
- Hündürlük: `220px`
- Funksiyalar: klik, marker sürüklə, "Cari məkan" düyməsi
- "Cari məkan" düyməsi: `absolute top-3 left-3 z-[1000]`, ağ bg, `--primary` rəng
- Reverse geocoding: Nominatim API
- Ünvan sətri: xəritənin altında, `✓ Seçildi` badge
- ⚠️ Post-MVP: Google Maps API ilə əvəz ediləcək

**Ünvan input card (iOS Settings stili):**
```jsx
className="bg-white rounded-2xl border border-[--gray-200] overflow-hidden shadow-sm"
// İçi: 2 input, aralarında border-t
// Label: text-[11px] font-bold uppercase tracking-wider
// Input: bg-transparent, no border, outline-none
```

**Vaxt növü kartları:** `grid grid-cols-2 gap-3`
```jsx
// Normal
className="flex flex-col items-start gap-1 p-4 rounded-2xl border-[1.5px] border-[--gray-200] bg-white text-left"
// Selected
className="border-[--primary] bg-[--primary-bg] shadow-sm"
// İkon: text-2xl, başlıq: 13px font-bold, alt mətn: 11px text-[--gray-400]
```

**Custom MiniCalendar:**
- Azərbaycan ayları və günlər
- Keçmiş günlər: disabled + `text-[--gray-200]`
- Bugün: `ring-1 ring-[--primary] text-[--primary]`
- Seçili: `bg-[--primary] text-white shadow-sm`
- Əvvəl/sonra ay naviqasiyası

**Saat seçimi:** `grid grid-cols-4 gap-2`
- Yarım saatlıq intervallar: 08:00 – 20:30
- Normal: `bg-white border-[--gray-200] text-[--navy]`
- Selected: `bg-[--primary] border-[--primary] text-white`

**Çevik vaxt urgency:** `grid grid-cols-3 gap-2.5`
- "Bu gün" ⚡, "Bu həftə" 📅, "Çevik" 🔄
- Seçiləndə: `bg-[--primary] text-white`

**Zaman dilimi:** `space-y-2.5`, hər biri full-width card
- Səhər 🌅, Gündüz ☀️, Axşam 🌆
- Seçiləndə: `bg-[--primary-bg] border-[--primary]` + `✓` badge

### 3.5 Addım 4 — Gələn Təkliflər

**Success banner:**
```jsx
className="bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] rounded-2xl p-5 border border-[#6EE7B7]"
// İkon container: w-10 h-10 bg-[--green] rounded-xl
// Başlıq: text-[14px] font-bold text-[#065f46]
// Alt mətn: text-[12px] text-[#059669]
```

**Empty state:**
```jsx
className="bg-white rounded-2xl border border-[--gray-200] p-8 text-center shadow-sm"
// İkon container: w-16 h-16 bg-[--gray-100] rounded-2xl mx-auto
// "15–45 dəqiqə" bold vurğulanır
```

---

## 4. Footer (`components/Footer.tsx`)

**Fon:** `#0A1628` (hero-dan tünd) + `border-t border-white/8`

**Layout:** `grid-cols-1 md:grid-cols-5 gap-12`

**Brand sütunu (col-span-2):**
- Logo: Playfair Display, ağ + mavi nöqtə
- Təsvir: `text-[14px] text-white/45`, max-w-[280px]
- Sosial linklər: `w-9 h-9 rounded-full bg-white/8 border border-white/10`, hover: `bg-[--primary]`
- App badges (App Store + Google Play): `bg-white/8 border border-white/10 rounded-xl`

**Link sütunları (3 ədəd):**
- Xidmətlər, Şirkət, Dəstək
- Başlıq: `text-[12px] font-bold text-white/90 uppercase tracking-widest`
- Linklər: `text-[14px] text-white/45 hover:text-white`

**Alt sətir:**
- Copyright: `text-[13px] text-white/30`
- Sistem statusu: yaşıl `animate-pulse` nöqtə + "Bütün sistemlər işləyir"

---

## 5. Komponent Kitabxanası (Reusable)

### Düymələr

```jsx
// Primary (CTA)
className="bg-[var(--primary)] text-white font-semibold rounded-full px-5 py-2.5 text-sm
           hover:bg-[var(--primary-light)] transition-colors"

// Ghost (outline)
className="border-[1.5px] border-[var(--gray-200)] bg-transparent text-[var(--navy)]
           font-medium rounded-full px-5 py-2.5 text-sm
           hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"

// Outline Blue
className="border-[1.5px] border-[var(--primary)] bg-transparent text-[var(--primary)]
           font-semibold rounded-full px-4 py-2 text-[13px]
           hover:bg-[var(--primary-bg)]"
```

### Badge-lər

```jsx
// Verified
<span className="bg-[var(--green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
  ✓ Təsdiqlənmiş
</span>

// Popular
<span className="bg-orange-50 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
  🔥 Populyar
</span>

// New
<span className="bg-green-50 text-green-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
  🆕 Yeni
</span>

// Category tag
<span className="bg-[var(--primary-bg)] text-[var(--primary)] text-[11px] font-medium px-2.5 py-1 rounded-full">
  Boru təmiri
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
    <p className="text-sm text-[var(--text-3)] mt-1">{subtitle}</p>
  </div>
  <a href="#" className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all">
    Hamısını gör →
  </a>
</div>
```

---

## 6. Responsiv Qırılma Nöqtələri

| Ekran | Breakpoint | Dəyişikliklər |
|---|---|---|
| Desktop | `≥ 1280px` | 6-sütun kateqoriya grid, 3-sütun pro kartlar, `px-16` |
| Tablet | `768–1279px` | 3-sütun kateqoriya, 2-sütun pro kartlar |
| Mobile | `< 768px` | 2-sütun kateqoriya, tam genişlik axtarış, böyük düymələr |

**Mobile-first prioritetlər:**
- Minimum tap target: `44x44px` (active:scale-95 feedback)
- Font minimum: `14px`
- Sifariş forması: `max-w-lg mx-auto` — mobil app görünüşü
- Sticky header + sticky CTA

---

## 7. Animasiya Qaydaları

```css
/* Hover kart */
transition: all 250ms ease;
hover: translateY(-4px) + box-shadow artır

/* Progress bar */
transition: all 500ms;

/* Kateqoriya seçimi */
transition: all 200ms;
active:scale-95  ← tap feedback

/* Backdrop blur (header/CTA) */
backdrop-filter: blur(12px);
background: rgba(255,255,255,0.9);

/* Marker flyTo (xəritə) */
duration: 1.2s  ← Leaflet flyTo animasiyası

/* Sistem statusu */
animate-pulse  ← yaşıl nöqtə
```

---

## 8. Hələ Dizayn Edilməmiş Səhifələr

Aşağıdakı səhifələrin dizaynı hazırlanmadıqca bu fayla əlavə ediləcək.
O vaxta qədər yuxarıdakı Design Tokens əsas götürülür.

- [ ] Worker Dashboard
- [ ] Customer Dashboard
- [ ] Worker Profile səhifəsi
- [ ] Worker Registration
- [ ] Job Request Detail (`/request/[id]`)
- [ ] Offer Detail & Comparison
- [ ] In-app Chat (ChatWindow)
- [ ] Admin Panel
- [ ] Categories listing page
- [ ] Worker catalog + search + filters
- [ ] Real-time worker tracking map
- [ ] Reviews & Ratings
- [ ] Notifications panel
