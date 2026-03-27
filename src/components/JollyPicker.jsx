import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QUESTION_CATEGORIES } from '../data/questions'

export default function JollyPicker({ gameState, playerName, onSelectCategory }) {
  const isMyTurn = gameState?.currentTurn === playerName
  const isVisible = gameState?.phase === 'jolly_pick'

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        <motion.div
          initial={{ scale: 0.5, y: 60 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 60 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #1a0f35, #0f0a1e)' }}
        >
          {/* Header */}
          <div
            className="p-5 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFD70022, #FFD70011)',
              borderBottom: '2px solid #FFD70044',
            }}
          >
            {/* Rotating star */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-2 inline-block"
            >
              ⭐
            </motion.div>
            <h2 className="text-2xl font-black text-white">JOLLY!</h2>
            <p className="text-yellow-300/80 text-sm mt-1 font-semibold">
              {isMyTurn ? 'Scegli la categoria che preferisci' : `${gameState.currentTurn} sta scegliendo...`}
            </p>
          </div>

          {/* Category grid — only shown to the active player */}
          {isMyTurn ? (
            <div className="p-4 grid grid-cols-3 gap-2">
              {QUESTION_CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.06 }}
                  onClick={() => onSelectCategory(cat.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all"
                  style={{
                    backgroundColor: cat.color + '22',
                    borderColor: cat.color + '55',
                  }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span
                    className="text-[10px] font-black text-center leading-tight"
                    style={{ color: cat.color }}
                  >
                    {cat.label}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center gap-3">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex gap-2"
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-3 h-3 rounded-full bg-yellow-400/60"
                  />
                ))}
              </motion.div>
              <p className="text-white/40 text-sm text-center">
                <strong className="text-yellow-300">{gameState.currentTurn}</strong> sta scegliendo la categoria...
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
