'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Kateqoriyaya uyğun video faylları ───────────────────────────────────────
// Hər faylı /public/videos/ qovluğuna yerləşdirin
const CATEGORY_VIDEOS = [
  {
    src: '/videos/plumbing.mp4',
    label: 'Santexnik',
    icon: '🔧',
  },
  {
    src: '/videos/electrical.mp4',
    label: 'Elektrik',
    icon: '⚡',
  },
  {
    src: '/videos/painting.mp4',
    label: 'Boyaqçı',
    icon: '🎨',
  },
  {
    src: '/videos/repair.mp4',
    label: 'Ev təmiri',
    icon: '🏠',
  },
  {
    src: '/videos/moving.mp4',
    label: 'Köçmə',
    icon: '📦',
  },
  {
    src: '/videos/cleaning.mp4',
    label: 'Təmizlik',
    icon: '✨',
  },
]

const INTERVAL_MS = 5000   // 5 saniyə
const FADE_MS     = 800    // crossfade müddəti

export default function HeroVideoBackground() {
  const [current, setCurrent]   = useState(0)
  const [next, setNext]         = useState<number | null>(null)
  const [fading, setFading]     = useState(false)
  const [muted, setMuted]       = useState(true)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentVideoRef         = useRef<HTMLVideoElement>(null)
  const nextVideoRef            = useRef<HTMLVideoElement>(null)

  // ─── Keçid funksiyası ────────────────────────────────────────────────────
  const goTo = (index: number) => {
    if (fading || index === current) return
    setNext(index)
    setFading(true)

    setTimeout(() => {
      setCurrent(index)
      setNext(null)
      setFading(false)
    }, FADE_MS)
  }

  // ─── Avtomatik keçid ─────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % CATEGORY_VIDEOS.length)
    }, INTERVAL_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, fading])

  // ─── Next video-nu əvvəlcədən yüklə ─────────────────────────────────────
  useEffect(() => {
    if (next !== null && nextVideoRef.current) {
      nextVideoRef.current.load()
      nextVideoRef.current.play().catch(() => {})
    }
  }, [next])

  // ─── Mute toggle ─────────────────────────────────────────────────────────
  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev
      if (currentVideoRef.current) currentVideoRef.current.muted = newMuted
      if (nextVideoRef.current)    nextVideoRef.current.muted    = newMuted
      return newMuted
    })
  }

  return (
    <>
      {/* ── Cari video ────────────────────────────────────────────────── */}
      <video
        ref={currentVideoRef}
        key={`current-${current}`}
        autoPlay
        muted={muted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          opacity: fading ? 0 : 0.45,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      >
        <source src={CATEGORY_VIDEOS[current].src} type="video/mp4" />
      </video>

      {/* ── Keçid zamanı göstərilən növbəti video ────────────────────── */}
      {next !== null && (
        <video
          ref={nextVideoRef}
          key={`next-${next}`}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            opacity: fading ? 0.45 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        >
          <source src={CATEGORY_VIDEOS[next].src} type="video/mp4" />
        </video>
      )}

      {/* ── Qaranlıq overlay (mətn oxunaqlığı üçün) ──────────────────── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(13,31,60,0.35) 0%, rgba(13,31,60,0.55) 50%, rgba(13,31,60,0.80) 100%)',
        }}
      />

      {/* ── Grid overlay ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
        }}
      />

      {/* ── Kateqoriya göstəriciləri (aşağı sol) ─────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {CATEGORY_VIDEOS.map((cat, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            title={cat.label}
            className="flex items-center gap-1.5 transition-all duration-300"
            style={{ opacity: i === current ? 1 : 0.4 }}
            aria-label={cat.label}
          >
            {/* Aktiv xətt / passiv nöqtə */}
            {i === current ? (
              <div
                className="h-[3px] rounded-full bg-white"
                style={{
                  width: 28,
                  transition: 'width 0.3s ease',
                }}
              />
            ) : (
              <div className="w-[6px] h-[6px] rounded-full bg-white" />
            )}
          </button>
        ))}

        {/* Aktiv kateqoriya label */}
        <span
          className="ml-2 text-[11px] font-semibold text-white/70"
          style={{ minWidth: 72 }}
        >
          {CATEGORY_VIDEOS[current].icon} {CATEGORY_VIDEOS[current].label}
        </span>
      </div>

      {/* ── Mute düyməsi (aşağı sağ) ─────────────────────────────────── */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-20 w-8 h-8 rounded-full
                   bg-white/10 border border-white/20 backdrop-blur-sm
                   flex items-center justify-center hover:bg-white/20 transition-all"
        aria-label={muted ? 'Səsi aç' : 'Səsi bağla'}
      >
        {muted ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </>
  )
}
