import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'
import { CATEGORIES } from '../data/questions'

export default function Navbar({ gameState, playerName, timeLeft }) {
  if (!gameState) return null

  const players = Object.entries(gameState.players)
  const currentTurn = gameState.currentTurn
  const currentCategory = gameState.currentCategory
    ? CATEGORIES.find(c => c.id === gameState.currentCategory)
    : null
  const phase = gameState.phase

  return (
    <div className="w-full max-w-sm mx-auto px-3 py-2 sticky top-0 z-50">
      <div className="glass rounded-2xl p-3 shadow-lg">
        {/* Category/Phase indicator */}
        <AnimatePresence mode="wait">
          {phase === 'question' && currentCategory && (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-2"
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: currentCategory.color + '33', color: currentCategory.color }}
                >
                  <span>{currentCategory.emoji}</span>
                  <span>{currentCategory.label}</span>
                </div>
                {timeLeft !== null && (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Clock size={12} />
                    <span className={`font-mono font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white/60'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                )}
              </div>
              {/* Timer bar */}
              {timeLeft !== null && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${(timeLeft / 15) * 100}%`,
                      background: timeLeft <= 5
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : 'linear-gradient(90deg, #7c3aed, #ec4899)',
                      transition: 'width 1s linear, background 0.3s ease'
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player scores */}
        <div className="flex gap-2">
          {players.map(([name, data]) => {
            const isCurrentTurn = name === currentTurn
            const isMe = name === playerName
            const playerColors = isMe
              ? { bg: 'from-purple-600 to-purple-800', border: 'border-purple-500', glow: 'shadow-purple-500/50' }
              : { bg: 'from-pink-600 to-pink-800', border: 'border-pink-500', glow: 'shadow-pink-500/50' }

            return (
              <motion.div
                key={name}
                className={`flex-1 relative rounded-xl p-2.5 border ${
                  isCurrentTurn
                    ? `bg-gradient-to-br ${playerColors.bg} ${playerColors.border} shadow-lg ${playerColors.glow}`
                    : 'bg-white/5 border-white/10'
                }`}
                animate={isCurrentTurn ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: isCurrentTurn ? Infinity : 0 }}
              >
                {isCurrentTurn && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm truncate max-w-[90px]" title={name}>
                      {isMe ? `${name} (tu)` : name}
                    </div>
                    <div className="text-white/60 text-xs mt-0.5">
                      {isCurrentTurn ? (
                        <span className="text-yellow-400 font-semibold">Turno attuale</span>
                      ) : (
                        <span>In attesa</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      key={data.score}
                      initial={{ scale: 1.5, color: '#fbbf24' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      className="text-2xl font-black text-white"
                    >
                      {data.score || 0}
                    </motion.div>
                    <div className="text-white/40 text-xs">/ 10</div>
                  </div>
                </div>

                {/* Score progress bar */}
                <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white/80"
                    animate={{ width: `${((data.score || 0) / 10) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
