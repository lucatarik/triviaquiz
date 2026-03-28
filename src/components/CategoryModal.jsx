import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { CATEGORIES } from '../data/questions'
import CategoryMascot from './CategoryMascot'

export default function CategoryModal({ gameState, playerName, onConfirm }) {
  const categoryId = gameState?.currentCategory
  const category = categoryId ? CATEGORIES.find(c => c.id === categoryId) : null
  const isMyTurn = gameState?.currentTurn === playerName
  const isVisible = gameState?.phase === 'category_confirm' && !!category

  if (!isVisible || !category) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #1a0f35, #0f0a1e)' }}
        >
          {/* Header */}
          <div
            className="pt-6 pb-4 text-center relative overflow-hidden"
            style={{ backgroundColor: category.color + '18', borderBottom: `2px solid ${category.color}44` }}
          >
            <div className="flex justify-center mb-2">
              <CategoryMascot categoryId={category.id} size="lg" showLabel={true} />
            </div>
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-bold mt-1"
              style={{ backgroundColor: category.color + '33', color: category.color }}
            >
              Categoria selezionata!
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {isMyTurn ? (
              <>
                <p className="text-white/60 text-sm text-center mb-5">
                  La ruota ha scelto <strong style={{ color: category.color }}>{category.label}</strong>!
                  Sei pronto per la domanda?
                </p>
                <motion.button
                  onClick={onConfirm}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}88)` }}
                >
                  <CheckCircle size={22} />
                  Inizia la domanda!
                </motion.button>
              </>
            ) : (
              <>
                <p className="text-white/60 text-sm text-center mb-4">
                  <strong className="text-purple-400">{gameState.currentTurn}</strong> ha lanciato la ruota
                  e ha ottenuto <strong style={{ color: category.color }}>{category.label}</strong>.
                </p>
                <div className="flex items-center justify-center gap-2 text-white/40">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-white/40"
                  />
                  <span className="text-sm">In attesa della domanda...</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
