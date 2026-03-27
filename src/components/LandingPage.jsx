import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Hash, Zap, ArrowRight, Shuffle } from 'lucide-react'

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function LandingPage({ onJoin }) {
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [nameError, setNameError] = useState('')
  const [roomError, setRoomError] = useState('')

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)' }}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-10%', left: '-10%' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)', bottom: '-10%', right: '-10%' }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-4xl font-black gradient-text mb-2">TriviaQuiz</h1>
          <p className="text-white/50 text-sm font-medium tracking-wider uppercase">Multiplayer · 9 Categorie</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player Name */}
            <div>
              <label className="text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
                <Users size={14} />
                Il tuo nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => { setPlayerName(e.target.value); setNameError('') }}
                  placeholder="Mario, Giulia, ..."
                  maxLength={20}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all text-sm"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              {nameError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-1 ml-1">
                  {nameError}
                </motion.p>
              )}
            </div>

            {/* Room ID */}
            <div>
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
                    placeholder="Es. ABC123"
                    maxLength={10}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all text-sm font-mono tracking-widest"
                    autoComplete="off"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={handleRandomRoom}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-3 text-white/70 hover:text-white transition-all"
                  title="Genera stanza casuale"
                >
                  <Shuffle size={18} />
                </motion.button>
              </div>
              {roomError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-1 ml-1">
                  {roomError}
                </motion.p>
              )}
              <p className="text-white/30 text-xs mt-1 ml-1">
                Condividi il codice con un amico per giocare insieme
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
            >
              <Zap size={18} />
              Entra nella Stanza
              <ArrowRight size={18} />
            </motion.button>
          </form>

          {/* Info row */}
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
            {[
              { emoji: '🎯', label: '9 categorie' },
              { emoji: '👥', label: '2 giocatori' },
              { emoji: '🏆', label: 'Prima a 10' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xl mb-1">{item.emoji}</div>
                <div className="text-white/40 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/20 text-xs mt-6"
        >
          Premi H durante la partita per un piccolo aiuto 😉
        </motion.p>
      </motion.div>
    </div>
  )
}
