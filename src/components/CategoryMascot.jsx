import React from 'react'
import { motion } from 'framer-motion'

const MASCOTS = {
  storia: {
    emoji: '🧙‍♂️',
    name: 'Archimede',
    subtitle: 'Il Grande Saggio',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.5)',
    mainAnim: {
      animate: { y: [0, -10, 0], rotate: [-4, 4, -4] },
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '📜', dx: -52, dy: -8,  anim: { rotate: [0, 15, 0], scale: [0.9, 1.1, 0.9] }, dur: 3,   delay: 0 },
      { emoji: '⭐', dx:  48, dy: -22, anim: { y: [0, -10, 0], opacity: [0.6, 1, 0.6] },       dur: 2,   delay: 0.5 },
      { emoji: '📚', dx:  50, dy:  22, anim: { rotate: [-8, 8, -8], scale: [1, 1.12, 1] },     dur: 2.5, delay: 1   },
      { emoji: '✨', dx: -38, dy:  28, anim: { scale: [0, 1.2, 0], opacity: [0, 1, 0] },       dur: 1.8, delay: 0.8 },
    ],
  },
  scienza: {
    emoji: '👨‍🔬',
    name: 'Prof. Plasma',
    subtitle: 'Il Genio del Lab',
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.5)',
    mainAnim: {
      animate: { y: [0, -6, 0], scaleX: [1, 1.04, 1] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '⚛️', dx: -50, dy: -18, anim: { rotate: [0, 360] },                              dur: 2,   delay: 0   },
      { emoji: '🧪', dx:  48, dy: -8,  anim: { rotate: [-15, 15, -15], y: [0, -8, 0] },        dur: 2.2, delay: 0.3 },
      { emoji: '💡', dx:   4, dy: -56, anim: { scale: [0.7, 1.3, 0.7], opacity: [0.5, 1, 0.5] }, dur: 1.5, delay: 0 },
      { emoji: '🔭', dx: -44, dy:  26, anim: { rotate: [-5, 5, -5] },                           dur: 3,   delay: 0.7 },
    ],
  },
  arte: {
    emoji: '👩‍🎨',
    name: 'Pittorella',
    subtitle: "L'Artista del Cuore",
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.5)',
    mainAnim: {
      animate: { rotate: [-5, 5, -5], y: [0, -6, 0] },
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '🎨', dx: -52, dy: -10, anim: { rotate: [0, 18, 0], scale: [0.9, 1.1, 0.9] },  dur: 2.5, delay: 0   },
      { emoji: '✏️', dx:  46, dy: -22, anim: { rotate: [-30, 30, -30] },                       dur: 1.8, delay: 0.4 },
      { emoji: '🌈', dx:   2, dy: -54, anim: { scale: [0.8, 1.1, 0.8], opacity: [0.7, 1, 0.7] }, dur: 2, delay: 0.2 },
      { emoji: '🖌️', dx:  46, dy:  24, anim: { rotate: [0, -22, 0], y: [0, -7, 0] },          dur: 2.2, delay: 0.8 },
    ],
  },
  sport: {
    emoji: '🏃',
    name: 'Campionissimo',
    subtitle: "L'Atleta Invincibile",
    color: '#10B981',
    glow: 'rgba(16,185,129,0.5)',
    mainAnim: {
      animate: { y: [0, -14, 0], scaleY: [1, 0.94, 1] },
      transition: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '⚽', dx:  48, dy:  22, anim: { rotate: [0, 360], y: [0, -18, 0] }, dur: 0.9,  delay: 0   },
      { emoji: '🏆', dx: -48, dy: -16, anim: { scale: [0.9, 1.15, 0.9], rotate: [-5, 5, -5] }, dur: 2,  delay: 0.3 },
      { emoji: '⭐', dx:   2, dy: -54, anim: { scale: [0, 1.3, 0], opacity: [0, 1, 0] }, dur: 0.7, delay: 0 },
      { emoji: '💨', dx: -52, dy:  16, anim: { x: [-5, 6, -5], opacity: [0.5, 1, 0.5] }, dur: 0.65, delay: 0.2 },
    ],
  },
  geografia: {
    emoji: '🧭',
    name: 'Marco il Nav.',
    subtitle: "L'Esploratore del Mondo",
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.5)',
    mainAnim: {
      animate: { rotate: [0, 360] },
      transition: { duration: 4, repeat: Infinity, ease: 'linear' },
    },
    particles: [
      { emoji: '🌍', dx: -50, dy: -10, anim: { rotate: [0, 360], scale: [0.9, 1.0, 0.9] }, dur: 6,   delay: 0   },
      { emoji: '✈️', dx:  46, dy: -26, anim: { x: [-10, 10, -10], y: [0, -8, 0] },         dur: 2.5, delay: 0.5 },
      { emoji: '📍', dx:  42, dy:  22, anim: { scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }, dur: 1.8, delay: 0.3 },
      { emoji: '🗺️', dx: -46, dy:  26, anim: { rotate: [-5, 5, -5] },                      dur: 3,   delay: 1   },
    ],
  },
  intrattenimento: {
    emoji: '🎤',
    name: 'Stellina',
    subtitle: 'La Star dello Show',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.5)',
    mainAnim: {
      animate: { rotate: [-10, 10, -10], y: [0, -9, 0], scale: [1, 1.08, 1] },
      transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '🌟', dx: -48, dy: -20, anim: { scale: [0.5, 1.3, 0.5], rotate: [0, 180, 360] }, dur: 1.4, delay: 0 },
      { emoji: '🎵', dx:  46, dy: -26, anim: { y: [0, -22, -44], opacity: [1, 0.5, 0] },         dur: 1.8, delay: 0.3 },
      { emoji: '🎬', dx: -42, dy:  22, anim: { rotate: [-10, 10, -10] },                          dur: 2,   delay: 0.6 },
      { emoji: '💫', dx:  44, dy:  18, anim: { rotate: [0, 360], scale: [0.7, 1.1, 0.7] },       dur: 1.8, delay: 0.9 },
    ],
  },
  tecnologia: {
    emoji: '🤖',
    name: 'Bot3000',
    subtitle: 'Il Cervello Digitale',
    color: '#6366F1',
    glow: 'rgba(99,102,241,0.5)',
    mainAnim: {
      animate: { y: [0, -5, 0], scaleX: [1, 1.05, 1] },
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '⚙️', dx: -48, dy: -12, anim: { rotate: [0, 360] },                             dur: 1.8, delay: 0   },
      { emoji: '⚙️', dx:  46, dy:  18, anim: { rotate: [360, 0] },                             dur: 1.4, delay: 0   },
      { emoji: '💻', dx: -42, dy:  28, anim: { y: [0, -8, 0], rotate: [-5, 5, -5] },           dur: 2.5, delay: 0.5 },
      { emoji: '⚡', dx:  42, dy: -28, anim: { scale: [0.5, 1.4, 0.5], opacity: [0.3, 1, 0.3] }, dur: 0.75, delay: 0.2 },
    ],
  },
  news: {
    emoji: '📡',
    name: 'Flash Reporter',
    subtitle: 'Il Cronista Instancabile',
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.5)',
    mainAnim: {
      animate: { rotate: [-9, 9, -9], scale: [1, 1.07, 1] },
      transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
    },
    particles: [
      { emoji: '📰', dx: -52, dy: -10, anim: { rotate: [-10, 10, -10], y: [0, -6, 0] },            dur: 2,   delay: 0   },
      { emoji: '🎙️', dx:  48, dy: -22, anim: { scale: [0.9, 1.1, 0.9], rotate: [-5, 5, -5] },      dur: 1.5, delay: 0.3 },
      { emoji: '📻', dx:  46, dy:  24, anim: { opacity: [0.6, 1, 0.6] },                            dur: 1,   delay: 0   },
      { emoji: '⚡', dx: -44, dy:  22, anim: { scale: [0, 1.3, 0], opacity: [0, 1, 0] },            dur: 0.85, delay: 0.4 },
    ],
  },
  geopolitica: {
    emoji: '🌐',
    name: "L'Ambasciatore",
    subtitle: 'Il Diplomatico Globale',
    color: '#14B8A6',
    glow: 'rgba(20,184,166,0.5)',
    mainAnim: {
      animate: { rotate: [0, 360] },
      transition: { duration: 5, repeat: Infinity, ease: 'linear' },
    },
    particles: [
      { emoji: '🤝', dx: -52, dy: -6,  anim: { scale: [0.9, 1.1, 0.9] },                       dur: 2,   delay: 0   },
      { emoji: '✈️', dx:  46, dy: -22, anim: { x: [-8, 8, -8], y: [-3, 3, -3] },               dur: 2.5, delay: 0.4 },
      { emoji: '🏛️', dx: -46, dy:  24, anim: { y: [0, -6, 0] },                                dur: 3,   delay: 0.8 },
      { emoji: '🗳️', dx:  44, dy:  20, anim: { rotate: [-5, 5, -5], scale: [0.9, 1.05, 0.9] }, dur: 2.5, delay: 0.6 },
    ],
  },
}

export default function CategoryMascot({ categoryId, size = 'lg', showLabel = true }) {
  const mascot = MASCOTS[categoryId]
  if (!mascot) return null

  const isLg = size === 'lg'
  const mainSize   = isLg ? '5rem'  : '2.6rem'
  const decoSize   = isLg ? '1.5rem' : '0.85rem'
  const container  = isLg ? 160 : 86   // px, square
  const scale      = isLg ? 1 : 0.54

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Mascot stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: container, height: container }}
      >
        {/* Glow aura */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: container * 0.65,
            height: container * 0.65,
            background: `radial-gradient(circle, ${mascot.glow}, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orbiting ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none border"
          style={{
            width: container * 0.82,
            height: container * 0.82,
            borderColor: mascot.color + '30',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Main emoji */}
        <motion.span
          className="relative z-10 leading-none"
          style={{ fontSize: mainSize }}
          animate={mascot.mainAnim.animate}
          transition={mascot.mainAnim.transition}
        >
          {mascot.emoji}
        </motion.span>

        {/* Particle decorations */}
        {mascot.particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute leading-none pointer-events-none"
            style={{
              fontSize: decoSize,
              left: container / 2 + p.dx * scale - 10,
              top:  container / 2 + p.dy * scale - 10,
            }}
            animate={p.anim}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>

      {/* Label */}
      {showLabel && isLg && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="font-black text-white text-base leading-tight">{mascot.name}</div>
          <div className="text-xs font-medium mt-0.5" style={{ color: mascot.color }}>
            {mascot.subtitle}
          </div>
        </motion.div>
      )}
    </div>
  )
}
