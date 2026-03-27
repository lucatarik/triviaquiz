import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'
import { CATEGORIES } from '../data/questions'

// Animated score counter that counts up when score changes
function AnimatedScore({ score }) {
  const [display, setDisplay] = useState(score)
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(score)

  useEffect(() => {
    if (score !== prevRef.current) {
      setFlash(true)
      const start = prevRef.current
      const end = score
      const diff = end - start
      if (diff > 0) {
        let current = start
        const step = () => {
          current += 1
          setDisplay(current)
          if (current < end) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      } else {
        setDisplay(score)
      }
      prevRef.current = score
      setTimeout(() => setFlash(false), 600)
    }
  }, [score])

  return (
    <motion.div
      key={score}
      initial={{ scale: 1.6, color: '#fbbf24', y: -4 }}
      animate={{ scale: 1, color: '#ffffff', y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
      className="text-2xl font-black"
      style={{
        textShadow: flash ? '0 0 16px rgba(251,191,36,0.9)' : 'none',
      }}
    >
      {display}
    </motion.div>
  )
}

const PLAYER_STYLES = [
  {
    gradient: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
    borderColor: '#7c3aed',
    glowColor: 'rgba(124,58,237,0.55)',
    textColor: '#c4b5fd',
  },
  {
    gradient: 'linear-gradient(135deg, #9d174d, #ec4899)',
    borderColor: '#ec4899',
    glowColor: 'rgba(236,72,153,0.55)',
    textColor: '#fbcfe8',
  },
]

export default function Navbar({ gameState, playerName, timeLeft }) {
  if (!gameState) return null

  const players = Object.entries(gameState.players)
  const currentTurn = gameState.currentTurn
  const currentCategory = gameState.currentCategory
    ? CATEGORIES.find(c => c.id === gameState.currentCategory)
    : null
  const phase = gameState.phase

  return (
    <div className="w-full max-w-sm mx-auto px-3 py-2 sticky top-0 z-50 safe-top">
      <div
        className="rounded-2xl shadow-xl overflow-hidden"
        style={{
          background: 'rgba(10,7,24,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Category/Phase indicator */}
        <AnimatePresence mode="wait">
          {phase === 'question' && currentCategory && (
            <motion.div
              key="category"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pt-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: currentCategory.color + '28',
                    color: currentCategory.color,
                    boxShadow: `0 0 10px ${currentCategory.color}33`,
                  }}
                >
                  <span>{currentCategory.emoji}</span>
                  <span>{currentCategory.label}</span>
                </div>
                {timeLeft !== null && (
                  <motion.div
                    className="flex items-center gap-1"
                    animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Clock size={12} className={timeLeft <= 5 ? 'text-red-400' : 'text-white/50'} />
                    <span className={`font-mono font-black text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-white/60'}`}>
                      {timeLeft}s
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Timer bar */}
              {timeLeft !== null && (
                <div className="h-1 bg-white/8 rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full relative overflow-hidden"
                    animate={{ width: `${(timeLeft / 15) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                    style={{
                      background: timeLeft <= 5
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : 'linear-gradient(90deg, #7c3aed, #ec4899)',
                      boxShadow: timeLeft <= 5
                        ? '0 0 8px rgba(239,68,68,0.7)'
                        : '0 0 8px rgba(124,58,237,0.5)',
                    }}
                  >
                    {/* Shimmer overlay on timer */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        backgroundSize: '50% 100%',
                      }}
                      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player score cards */}
        <div className="flex gap-2 p-2.5">
          {players.map(([name, data], idx) => {
            const isCurrentTurn = name === currentTurn
            const isMe = name === playerName
            const style = PLAYER_STYLES[isMe ? 0 : 1]
            const score = data.score || 0

            return (
              <motion.div
                key={name}
                className="flex-1 relative rounded-xl p-2.5 overflow-hidden"
                animate={isCurrentTurn ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 1.8, repeat: isCurrentTurn ? Infinity : 0 }}
                style={{
                  background: isCurrentTurn ? style.gradient : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isCurrentTurn ? style.borderColor : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isCurrentTurn
                    ? `0 4px 20px ${style.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : 'none',
                }}
              >
                {/* Active turn indicator dot */}
                {isCurrentTurn && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{ background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.9)' }}
                  />
                )}

                {/* Subtle shimmer on active card */}
                {isCurrentTurn && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent, rgba(255,255,255,0.04))' }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div
                      className="font-bold text-sm truncate max-w-[80px]"
                      style={{ color: isCurrentTurn ? '#fff' : 'rgba(255,255,255,0.7)' }}
                      title={name}
                    >
                      {isMe ? `${name} (tu)` : name}
                    </div>
                    <div className="text-xs mt-0.5">
                      {isCurrentTurn ? (
                        <motion.span
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          style={{ color: '#fde68a', fontWeight: 700 }}
                        >
                          Turno
                        </motion.span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>In attesa</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <AnimatedScore score={score} />
                    <div className="text-white/30 text-xs leading-none">/ 10</div>
                  </div>
                </div>

                {/* Score progress bar */}
                <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${(score / 10) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: isCurrentTurn
                        ? 'rgba(255,255,255,0.7)'
                        : `linear-gradient(90deg, ${style.borderColor}, ${style.textColor})`,
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Animated gradient progress line at bottom */}
        <div className="gradient-progress-line" />
      </div>
    </div>
  )
}
