import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/LandingPage'
import WaitingRoom from './components/WaitingRoom'
import Navbar from './components/Navbar'
import Wheel from './components/Wheel'
import CategoryModal from './components/CategoryModal'
import JollyPicker from './components/JollyPicker'
import QuestionCard from './components/QuestionCard'
import ScoreBoard from './components/ScoreBoard'
import { useGameState } from './hooks/useGameState'
import { deleteGameState } from './lib/redis'

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    player: params.get('player') || '',
    room: params.get('room') || '',
  }
}

function setUrlParams(player, room) {
  const url = new URL(window.location.href)
  url.searchParams.set('player', player)
  url.searchParams.set('room', room)
  window.history.pushState({}, '', url.toString())
}

function clearUrlParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('player')
  url.searchParams.delete('room')
  window.history.pushState({}, '', url.toString())
}

export default function App() {
  const [authState, setAuthState] = useState(() => {
    const { player, room } = getUrlParams()
    return { player, room, ready: !!(player && room) }
  })

  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  // Brief lock after each answer so both players see the result before the wheel re-appears
  const [wheelLocked, setWheelLocked] = useState(false)
  // End-of-game expiry countdown (150s)
  const [endTimeLeft, setEndTimeLeft] = useState(null)

  const { player: playerName, room: roomId, ready } = authState

  const {
    gameState,
    loading,
    error,
    initializeGame,
    spinWheel,
    confirmCategory,
    selectJollyCategory,
    reportPendingAnswer,
    submitAnswer,
    timeoutAnswer,
    useBomb,
    restartGame,
  } = useGameState(ready ? roomId : null, ready ? playerName : null)

  // Initialize game when auth is ready
  useEffect(() => {
    if (ready && roomId && playerName) {
      initializeGame()
    }
  }, [ready, roomId, playerName])

  // Lock wheel for 2.5 s after each answer so both players see the result clearly.
  // IMPORTANT: must explicitly reset to false when answerResult becomes null (restart/new game)
  // otherwise the cleanup cancels the timeout without ever calling setWheelLocked(false).
  useEffect(() => {
    if (!gameState?.answerResult?.timestamp) {
      setWheelLocked(false)
      return
    }
    setWheelLocked(true)
    const t = setTimeout(() => setWheelLocked(false), 2500)
    return () => clearTimeout(t)
  }, [gameState?.answerResult?.timestamp])

  // 150s end-of-game expiry: if both players don't restart, delete room and go home
  useEffect(() => {
    if (gameState?.phase !== 'ended' || !gameState?.endedAt) {
      setEndTimeLeft(null)
      return
    }
    const EXPIRY = 150
    const elapsed = Math.floor((Date.now() - gameState.endedAt) / 1000)
    const remaining = Math.max(0, EXPIRY - elapsed)
    setEndTimeLeft(remaining)
    if (remaining <= 0) {
      deleteGameState(roomId).then(() => handleHome())
      return
    }
    const interval = setInterval(() => {
      setEndTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          deleteGameState(roomId).then(() => handleHome())
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gameState?.phase, gameState?.endedAt])

  // Timer management for question phase
  useEffect(() => {
    if (!gameState) return

    if (gameState.phase === 'question' && gameState.currentTurn === playerName) {
      setTimeLeft(15)
      setTimerActive(true)
    } else {
      setTimeLeft(null)
      setTimerActive(false)
    }
  }, [gameState?.phase, gameState?.currentQuestion?.id, gameState?.currentTurn, playerName])

  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameState?.currentQuestion?.id])

  const handleJoin = useCallback((name, room) => {
    setUrlParams(name, room)
    setAuthState({ player: name, room, ready: true })
  }, [])

  const handleHome = useCallback(() => {
    clearUrlParams()
    setAuthState({ player: '', room: '', ready: false })
  }, [])

  const handleSpinComplete = useCallback((angle, selectedCategory) => {
    spinWheel(angle, selectedCategory)
  }, [spinWheel])

  const handleSubmitAnswer = useCallback(async (index, speedBonus) => {
    setTimerActive(false)
    await submitAnswer(index, speedBonus)
  }, [submitAnswer])

  const handleTimeout = useCallback(async () => {
    setTimerActive(false)
    await timeoutAnswer()
  }, [timeoutAnswer])

  const handleRestart = useCallback(async () => {
    await restartGame()
  }, [restartGame])

  // ---- Render Logic ----

  // Landing page
  if (!ready) {
    return <LandingPage onJoin={handleJoin} />
  }

  // Loading
  if (loading && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent"
        />
        <p className="text-white/50 text-sm">Connessione alla stanza...</p>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6"
        style={{ background: '#0f0a1e' }}>
        <div className="text-5xl">⚠️</div>
        <h2 className="text-white text-xl font-bold">Errore di connessione</h2>
        <p className="text-white/50 text-sm text-center">{error}</p>
        <button
          onClick={handleHome}
          className="mt-4 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold"
        >
          Torna alla home
        </button>
      </div>
    )
  }

  // Waiting room (1 player)
  if (!gameState || gameState.phase === 'waiting' || Object.keys(gameState?.players || {}).length < 2) {
    return <WaitingRoom playerName={playerName} roomId={roomId} />
  }

  // End game
  if (gameState.phase === 'ended') {
    return (
      <ScoreBoard
        gameState={gameState}
        playerName={playerName}
        onRestart={handleRestart}
        onHome={handleHome}
        endTimeLeft={endTimeLeft}
      />
    )
  }

  // Main game screen
  const phase = gameState.phase
  const isMyTurn = gameState.currentTurn === playerName

  return (
    <div
      className="min-h-screen flex flex-col safe-top"
      style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)' }}
    >
      {/* Navbar - always visible during game */}
      <Navbar
        gameState={gameState}
        playerName={playerName}
        timeLeft={phase === 'question' ? timeLeft : null}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 safe-bottom">
        <AnimatePresence mode="wait">
          {/* Spinning phase */}
          {(phase === 'spinning') && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* Turn indicator */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-2"
              >
                {isMyTurn ? (
                  <div>
                    <p className="text-white font-bold text-lg">
                      È il tuo turno, <span className="gradient-text">{playerName}</span>!
                    </p>
                    <p className="text-white/40 text-sm mt-1">Gira la ruota per scegliere la categoria</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white/60 text-sm">
                      <strong className="text-purple-400">{gameState.currentTurn}</strong> sta girando la ruota
                    </p>
                    <motion.p
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/30 text-xs mt-1"
                    >
                      Aspetta il tuo turno...
                    </motion.p>
                  </div>
                )}
              </motion.div>

              <Wheel
                onSpinComplete={handleSpinComplete}
                isMyTurn={isMyTurn && !wheelLocked}
                initialAngle={gameState.wheelAngle || 0}
              />

              {/* Answer result from previous question */}
              {gameState.answerResult && (() => {
                const r = gameState.answerResult
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm px-3"
                  >
                    {r.timedOut ? (
                      <div className="rounded-xl p-3 text-center text-sm font-semibold border bg-orange-500/15 border-orange-500/30 text-orange-400">
                        ⏰ Tempo scaduto per <strong>{r.playerName}</strong>!
                        {r.correctOption && (
                          <div className="mt-1 text-xs text-white/50 font-normal">
                            Risposta corretta: <span className="text-green-400 font-semibold">"{r.correctOption}"</span>
                          </div>
                        )}
                      </div>
                    ) : r.isCorrect ? (
                      <div className="rounded-xl p-3 text-center text-sm font-semibold border bg-green-500/15 border-green-500/30 text-green-400">
                        {r.speedBonus ? '⚡' : '✅'} <strong>{r.playerName}</strong>
                        {r.speedBonus ? ' risposta fulminea! +2 punti!' : ' risposta corretta! +1 punto'}
                        <div className="mt-1 text-xs text-green-300/70 font-normal">
                          "{r.correctOption}"
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl p-3 text-sm font-semibold border bg-red-500/15 border-red-500/30 space-y-1">
                        <div className="text-red-400 text-center">
                          ❌ <strong>{r.playerName}</strong> ha sbagliato
                        </div>
                        <div className="flex items-start gap-2 text-xs font-normal mt-1">
                          <span className="text-red-400/80 shrink-0">Scelta:</span>
                          <span className="text-white/60 line-through">"{r.selectedOption}"</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs font-normal">
                          <span className="text-green-400 shrink-0">Corretta:</span>
                          <span className="text-green-300 font-semibold">"{r.correctOption}"</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })()}
            </motion.div>
          )}

          {/* Question phase */}
          {phase === 'question' && gameState.currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full"
            >
              <QuestionCard
                gameState={gameState}
                playerName={playerName}
                onSubmitAnswer={handleSubmitAnswer}
                onTimeout={handleTimeout}
                onReportSelection={reportPendingAnswer}
                onUseBomb={useBomb}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Jolly picker (overlay) — shown when wheel lands on ⭐ */}
      <JollyPicker
        gameState={gameState}
        playerName={playerName}
        onSelectCategory={selectJollyCategory}
      />

      {/* Category Modal (overlay) */}
      <CategoryModal
        gameState={gameState}
        playerName={playerName}
        onConfirm={confirmCategory}
      />

      {/* Debug info in dev */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 right-2 text-[8px] text-white/20 font-mono">
          phase:{gameState.phase} turn:{gameState.currentTurn}
        </div>
      )}
    </div>
  )
}
