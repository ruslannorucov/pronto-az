'use client'

import dynamic from 'next/dynamic'

const HeroVideoBackground = dynamic(
  () => import('./HeroVideoBackground'),
  { ssr: false }
)

export default function HeroVideoBackgroundWrapper() {
  return <HeroVideoBackground />
}
