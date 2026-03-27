import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Hash, Zap, ArrowRight, Shuffle } from 'lucide-react'

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const PARTICLES = [
  { emoji: '⭐', x: 8,  dur: 9,  delay: 0,   size: '1.4rem' },
  { emoji: '🎯', x: 20, dur: 11, delay: 1.5, size: '1.1rem' },
  { emoji: '🏆', x: 35, dur: 8,  delay: 3,   size: '1.3rem' },
  { emoji: '🔥', x: 50, dur: 10, delay: 0.8, size: '1rem'   },
  { emoji: '💡', x: 65, dur: 12, delay: 2.2, size: '1.2rem' },
  { emoji: '🌍', x: 78, dur: 9,  delay: 4,   size: '1.1rem' },
  { emoji: '⭐', x: 90, dur: 11, delay: 1,   size: '0.9rem' },
  { emoji: '🎯', x: 45, dur: 7,  delay: 5.5, size: '1rem'   },
]

// Tiny static stars
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  dur: Math.random() * 3 + 2,
  delay: Math.random() * 4,
}))

export default function LandingPage({ onJoin }) {
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [nameError, setNameError] = useState('')
  const [roomError, setRoomError] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [roomFocused, setRoomFocused] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const pulseTimerRef = useRef(null)

  useEffect(() => {
    pulseTimerRef.current = setInterval(() => setPulsing(p => !p), 2000)
    return () => clearInterval(pulseTimerRef.current)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    let valid = true

    if (!playerName.trim()) {
      setNameError('Inserisci il tuo nome!')
      valid = false
    } else if (playerName.trim().length < 2) {
      setNameError('Il nome deve avere almeno 2 caratteri')
      valid = false
    } else if (playerName.trim().length > 20) {
      setNameError('Il nome è troppo lungo (max 20 caratteri)')
      valid = false
    } else {
      setNameError('')
    }

    if (!roomId.trim()) {
      setRoomError('Inserisci o genera un codice stanza!')
      valid = false
    } else {
      setRoomError('')
    }

    if (valid) {
      onJoin(playerName.trim(), roomId.trim().toUpperCase())
    }
  }

  const handleRandomRoom = () => {
    setRoomId(generateRoomId())
    setRoomError('')
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  }

  const itemVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0718 0%, #130d2a 40%, #1a0f35 70%, #0a0718 100%)' }}
    >
      {/* Static starfield */}
      <div className="starfield">
        {STARS.map(s => (
          <div
            key={s.id}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              '--dur': `${s.dur}s`,
              '--delay': `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Floating emoji particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="float-particle"
          style={{
            left: `${p.x}%`,
            '--dur': `${p.dur}s`,
            '--delay': `${p.delay}s`,
            '--size': p.size,
            zIndex: 1,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-15%', left: '-15%' }}
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)', bottom: '-15%', right: '-15%' }}
          animate={{ scale: [1.3, 1, 1.3], rotate: [360, 180, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)', top: '40%', right: '5%' }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative"
        style={{ zIndex: 10 }}
      >
        {/* Logo / Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="inline-block text-7xl mb-4 cursor-default"
            animate={{
              y: [0, -10, 0],
              filter: [
                'drop-shadow(0 0 8px rgba(251,191,36,0.6))',
                'drop-shadow(0 0 24px rgba(251,191,36,1))',
                'drop-shadow(0 0 8px rgba(251,191,36,0.6))',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎯
          </motion.div>

          <motion.h1
            className="text-5xl font-black mb-3 gradient-text leading-tight"
            style={{ letterSpacing: '-1px' }}
            animate={{
              textShadow: [
                '0 0 20px rgba(167,139,250,0.3)',
                '0 0 40px rgba(167,139,250,0.7)',
                '0 0 20px rgba(167,139,250,0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            TriviaQuiz
          </motion.h1>

          <motion.p
            className="text-white/50 text-xs font-semibold tracking-[0.25em] uppercase"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Multiplayer · 9 Categorie · Prima a 10
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="glass rounded-3xl p-6 shadow-2xl"
          style={{ boxShadow: '0 8px 60px rgba(124,58,237,0.2), 0 2px 16px rgba(0,0,0,0.5)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player Name */}
            <motion.div variants={itemVariants}>
              <label className="text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
                <Users size={14} />
                Il tuo nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => { setPlayerName(e.target.value); setNameError('') }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="Mario, Giulia, ..."
                  maxLength={20}
                  className="w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none transition-all text-sm"
                  style={{
                    borderColor: nameFocused ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.12)',
                    boxShadow: nameFocused ? '0 0 0 3px rgba(124,58,237,0.25), 0 0 20px rgba(124,58,237,0.15)' : 'none',
                    background: nameFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                  }}
                  autoFocus
                  autoComplete="off"
                />
                {nameFocused && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ boxShadow: 'inset 0 0 12px rgba(124,58,237,0.1)' }}
                  />
                )}
              </div>
              <AnimatePresence>
                {nameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="text-red-400 text-xs mt-1 ml-1"
                  >
                    {nameError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Room ID */}
            <motion.div variants={itemVariants}>
              <label className="text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
                <Hash size={14} />
                Codice Stanza
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setRoomError('') }}
                    onFocus={() => setRoomFocused(true)}
                    onBlur={() => setRoomFocused(false)}
                    placeholder="Es. ABC123"
                    maxLength={10}
                    className="w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none transition-all text-sm font-mono tracking-widest"
                    style={{
                      borderColor: roomFocused ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.12)',
                      boxShadow: roomFocused ? '0 0 0 3px rgba(124,58,237,0.25), 0 0 20px rgba(124,58,237,0.15)' : 'none',
                      background: roomFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                    }}
                    autoComplete="off"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={handleRandomRoom}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(124,58,237,0.3)' }}
                  className="border border-white/20 rounded-xl px-3 py-3 text-white/70 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  title="Genera stanza casuale"
                >
                  <Shuffle size={18} />
                </motion.button>
              </div>
              <AnimatePresence>
                {roomError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="text-red-400 text-xs mt-1 ml-1"
                  >
                    {roomError}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-white/25 text-xs mt-1 ml-1">
                Condividi il codice con un amico per giocare insieme
              </p>
            </motion.div>

            {/* Submit CTA */}
            <motion.div variants={itemVariants} className="relative">
              {/* Pulse ring */}
              <AnimatePresence>
                {pulsing && (
                  <motion.div
                    key="pulse"
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.08, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', zIndex: -1 }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shimmer-btn relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #f97316 100%)',
                  boxShadow: '0 4px 24px rgba(124,58,237,0.5), 0 2px 8px rgba(236,72,153,0.3)',
                }}
              >
                <Zap size={18} />
                GIOCA!
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </form>

          {/* Info row */}
          <motion.div
            variants={itemVariants}
            className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-3"
          >
            {[
              { emoji: '🎯', label: '9 categorie' },
              { emoji: '👥', label: '2 giocatori' },
              { emoji: '🏆', label: 'Prima a 10' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="text-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div className="text-2xl mb-1">{item.emoji}</div>
                <div className="text-white/40 text-xs font-medium">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Tip */}
        <motion.p
          variants={itemVariants}
          className="text-center text-white/20 text-xs mt-6"
        >
          Premi H durante la partita per un piccolo aiuto
        </motion.p>
      </motion.div>
    </div>
  )
}
