import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, RefreshCw, Home, Clock } from 'lucide-react'

export default function ScoreBoard({ gameState, playerName, onRestart, onHome, endTimeLeft }) {
  if (!gameState) return null

  const players = Object.entries(gameState.players).sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
  const winner = gameState.winner
  const isWinner = winner === playerName
  const isDraw = !winner

  const readyToRestart = gameState.readyToRestart || []
  const iHaveVoted = readyToRestart.includes(playerName)
  const otherPlayers = Object.keys(gameState.players).filter(n => n !== playerName)
  const opponentHasVoted = otherPlayers.some(n => readyToRestart.includes(n))

  const medals = ['🥇', '🥈', '🥉']

  const timerColor = endTimeLeft !== null && endTimeLeft <= 30 ? '#ef4444' : '#a78bfa'
  const timerPct = endTimeLeft !== null ? (endTimeLeft / 150) * 100 : 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0"
        style={{ background: isWinner ? 'linear-gradient(135deg, #1a0f35 0%, #2d1a00 50%, #1a0f35 100%)' : 'linear-gradient(135deg, #0f0a1e 0%, #1a0a0a 50%, #0f0a1e 100%)' }}
      />

      {/* Confetti for winner */}
      {isWinner && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                backgroundColor: ['#fbbf24', '#7c3aed', '#ec4899', '#10b981', '#3b82f6'][i % 5],
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [`${(Math.random() - 0.5) * 100}px`],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-6xl mb-3"
          >
            {isDraw ? '🤝' : isWinner ? '🏆' : '😤'}
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">
            {isDraw ? 'Pareggio!' : isWinner ? 'Hai vinto!' : 'Hai perso!'}
          </h1>
          <p className="text-white/50 text-sm">
            {isDraw
              ? 'Bella partita a entrambi!'
              : isWinner
              ? `Complimenti ${playerName}! Sei il campione!`
              : `Ben giocato ${playerName}! La prossima volta andrà meglio!`}
          </p>
        </div>

        {/* Scores card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl overflow-hidden mb-5 shadow-2xl"
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 justify-center text-white/60 text-sm font-semibold">
              <Trophy size={16} />
              Risultati finali
            </div>
          </div>

          <div className="p-4 space-y-3">
            {players.map(([name, data], index) => {
              const isMe = name === playerName
              const isTopPlayer = index === 0
              const isThisWinner = name === winner

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    isThisWinner
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40'
                      : isMe
                      ? 'bg-purple-600/20 border border-purple-500/40'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="text-3xl">{medals[index] || '🎮'}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-base">
                      {name} {isMe && <span className="text-purple-400 text-xs">(tu)</span>}
                    </div>
                    <div className="text-white/40 text-xs">
                      {isThisWinner ? '🏆 Vincitore!' : index > 0 ? 'Buona partita' : ''}
                    </div>
                    <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((data.score || 0) / 10) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: isThisWinner
                            ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                            : 'linear-gradient(90deg, #7c3aed, #ec4899)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, type: 'spring' }}
                      className={`text-3xl font-black ${isThisWinner ? 'text-yellow-400' : 'text-white'}`}
                    >
                      {data.score || 0}
                    </motion.div>
                    <div className="text-white/30 text-xs">punti</div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              {[
                { label: 'Categorie', value: '9', icon: '🎯' },
                { label: 'Prima a', value: '10 pt', icon: '🏆' },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white/5 rounded-xl p-3">
                  <div className="text-lg">{stat.icon}</div>
                  <div className="text-white font-bold">{stat.value}</div>
                  <div className="text-white/40 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stars for winner */}
        {isWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-2 mb-5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1 + i * 0.15, type: 'spring' }}
              >
                <Star size={28} className="text-yellow-400" fill="#fbbf24" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Expiry countdown bar */}
        {endTimeLeft !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-white/40 flex items-center gap-1">
                <Clock size={11} />
                La stanza scade tra
              </span>
              <motion.span
                key={endTimeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-mono font-black"
                style={{ color: timerColor }}
              >
                {endTimeLeft}s
              </motion.span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: timerColor, transition: 'background-color 1s ease' }}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {!iHaveVoted ? (
              <motion.button
                key="vote"
                onClick={onRestart}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
              >
                <RefreshCw size={18} />
                Gioca ancora!
              </motion.button>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-4 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-1 border border-purple-500/30 bg-purple-500/10"
              >
                <div className="flex items-center gap-2 text-purple-300">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    ⏳
                  </motion.span>
                  {opponentHasVoted
                    ? 'Entrambi pronti, riavvio...'
                    : 'In attesa dell\'avversario...'}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-white/40">
                  <span className={iHaveVoted ? 'text-green-400' : 'text-white/30'}>
                    {iHaveVoted ? '✓' : '○'} Tu
                  </span>
                  {otherPlayers.map(n => (
                    <span key={n} className={opponentHasVoted ? 'text-green-400' : 'text-white/30'}>
                      {opponentHasVoted ? '✓' : '○'} {n}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={onHome}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-bold text-white/70 text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <Home size={16} />
            Torna alla home
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
