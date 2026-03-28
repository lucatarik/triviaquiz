import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { CATEGORIES } from '../data/questions'
import { useCheat } from '../hooks/useCheat'

const TIMER_DURATION = 15

export default function QuestionCard({ gameState, playerName, onSubmitAnswer, onTimeout, onReportSelection, onUseBomb }) {
  const cheatActive = useCheat()
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [eliminatedIndices, setEliminatedIndices] = useState([])
  const timerRef = useRef(null)
  const hasTimedOutRef = useRef(false)
  const questionIdRef = useRef(null)

  const question = gameState?.currentQuestion
  const isMyTurn = gameState?.currentTurn === playerName
  const category = gameState?.currentCategory
    ? CATEGORIES.find(c => c.id === gameState.currentCategory)
    : null

  // Opponent's pending selection (saved to Redis, polled every 1.5s)
  const opponentPending = gameState?.pendingAnswer
  const opponentSelectedIndex =
    opponentPending && opponentPending.playerName !== playerName
      ? opponentPending.optionIndex
      : null

  // Reset state when question changes
  useEffect(() => {
    if (!question || question.id === questionIdRef.current) return
    questionIdRef.current = question.id
    setSelectedAnswer(null)
    setTimeLeft(TIMER_DURATION)
    setHasAnswered(false)
    setShowResult(false)
    setEliminatedIndices([])
    hasTimedOutRef.current = false
  }, [question?.id])

  // Timer
  useEffect(() => {
    if (!question || hasAnswered || !isMyTurn) return
    if (hasTimedOutRef.current) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (!hasTimedOutRef.current) {
            hasTimedOutRef.current = true
            onTimeout && onTimeout()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [question?.id, hasAnswered, isMyTurn])

  // Bomb lifeline
  const playerData = gameState?.players?.[playerName] || {}
  const correctCount = playerData.correctCount || 0
  const bombsUsed = playerData.bombsUsed || 0
  const bombsAvailable = Math.floor(correctCount / 3) - bombsUsed
  const bombReady = isMyTurn && bombsAvailable > 0 && !hasAnswered && eliminatedIndices.length === 0

  const handleBomb = useCallback(() => {
    if (!bombReady || !question) return
    // Pick 2 wrong indices at random
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter(i => i !== question.correct)
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5)
    setEliminatedIndices(shuffled.slice(0, 2))
    onUseBomb && onUseBomb()
  }, [bombReady, question, onUseBomb])

  const [speedBonus, setSpeedBonus] = useState(false)

  const handleSelectAnswer = useCallback(async (optionIndex) => {
    if (!isMyTurn || hasAnswered || selectedAnswer !== null) return
    if (eliminatedIndices.includes(optionIndex)) return
    clearInterval(timerRef.current)
    // Determine speed bonus locally for immediate feedback (timeLeft > 10 means < 5s elapsed)
    const isSpeedBonus = timeLeft > 10
    setSpeedBonus(isSpeedBonus)
    setSelectedAnswer(optionIndex)
    setHasAnswered(true)
    setShowResult(true)

    // Immediately broadcast the selection so the opponent can see it
    onReportSelection && onReportSelection(optionIndex)

    // Show result briefly then submit — pass the local speed bonus flag
    setTimeout(() => {
      onSubmitAnswer && onSubmitAnswer(optionIndex, isSpeedBonus)
    }, 1500)
  }, [isMyTurn, hasAnswered, selectedAnswer, timeLeft, onSubmitAnswer, onReportSelection])

  if (!question || !category) return null

  const isCorrect = selectedAnswer !== null && selectedAnswer === question.correct
  const isWrong = selectedAnswer !== null && selectedAnswer !== question.correct

  const getOptionStyle = (index) => {
    const isSelected = selectedAnswer === index
    const isCorrectOption = index === question.correct
    const cheatHighlight = cheatActive && isCorrectOption && !hasAnswered
    const isOpponentPick = opponentSelectedIndex === index

    if (cheatHighlight) {
      return 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.9)] ring-2 ring-white'
    }

    // Eliminated by bomb — shown before answering only
    if (!showResult && eliminatedIndices.includes(index)) {
      return 'bg-white/3 border-white/8 opacity-30 line-through cursor-not-allowed'
    }

    if (!showResult) {
      if (isSelected) return 'bg-purple-600/50 border-purple-400 scale-[0.98]'
      // Opponent has selected this option — shown only to the watcher
      if (isOpponentPick) return 'bg-orange-500/20 border-orange-400 ring-2 ring-orange-400/60'
      return 'bg-white/8 border-white/15 hover:bg-white/15 hover:border-white/30 active:scale-[0.98]'
    }

    if (isCorrectOption) {
      return 'bg-green-500/30 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
    }
    if (isSelected && !isCorrectOption) {
      return 'bg-red-500/30 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    }
    return 'bg-white/5 border-white/10 opacity-50'
  }

  const getOptionIcon = (index) => {
    if (!showResult) return null
    if (index === question.correct) return <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
    if (index === selectedAnswer && index !== question.correct) return <XCircle size={18} className="text-red-400 flex-shrink-0" />
    return null
  }

  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#7c3aed'
  // Speed bonus window: first 5 seconds of 15
  const bonusActive = isMyTurn && timeLeft > 10 && !hasAnswered
  const bonusPct = Math.max(0, Math.min(100, ((timeLeft - 10) / 5) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="w-full max-w-sm mx-auto px-3"
    >
      {/* Category badge + timer */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
          style={{ backgroundColor: category.color + '33', color: category.color }}
        >
          <span>{category.emoji}</span>
          <span>{category.label}</span>
        </div>
        {isMyTurn && (
          <div className="flex items-center gap-1.5">
            {bonusActive && (
              <motion.span
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-yellow-400 text-xs font-black"
              >
                ⚡+2
              </motion.span>
            )}
            <Clock size={14} className={timeLeft <= 5 ? 'text-red-400' : 'text-white/50'} />
            <motion.span
              key={timeLeft}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`font-mono font-black text-lg ${timeLeft <= 5 ? 'text-red-400' : 'text-white/70'}`}
            >
              {timeLeft}
            </motion.span>
          </div>
        )}
      </div>

      {/* Timer bars */}
      {isMyTurn && (
        <div className="mb-4 space-y-1.5">
          {/* Main bar (15s) */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: timerColor, transition: 'background-color 0.5s ease' }}
              animate={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          {/* Speed bonus bar (first 5s window) */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: bonusActive ? '#facc15' : 'transparent' }}
              animate={{ width: `${bonusPct}%`, opacity: bonusActive ? 1 : 0 }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          {bonusActive && (
            <p className="text-yellow-400/60 text-[10px] text-right font-semibold">
              Rispondi ora per +2 punti!
            </p>
          )}
        </div>
      )}

      {/* Bomb lifeline */}
      {isMyTurn && (
        <div className="flex justify-end mb-2 min-h-[36px]">
          <AnimatePresence>
            {bombReady && (
              <motion.button
                key="bomb"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.88 }}
                onClick={handleBomb}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black border border-red-500/50 bg-red-500/15 text-red-400"
                title="Elimina 2 risposte sbagliate"
              >
                <motion.span
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  💣
                </motion.span>
                Usa bomba
              </motion.button>
            )}
            {eliminatedIndices.length > 0 && !hasAnswered && (
              <motion.span
                key="bombed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/30 self-center px-2 py-1.5"
              >
                💣 Bomba usata
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Question card */}
      <motion.div
        className="glass rounded-2xl p-5 mb-4 shadow-xl"
        style={{ borderColor: category.color + '44', borderWidth: 1 }}
      >
        <p className="text-white font-semibold text-base leading-relaxed text-center">
          {question.question}
        </p>

        {/* Cheat mode indicator */}
        {cheatActive && !hasAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1 mt-3 text-white/30 text-xs"
          >
            <Eye size={12} />
            <span>Modalità aiuto attiva</span>
          </motion.div>
        )}
      </motion.div>

      {/* Observer banner */}
      {!isMyTurn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mb-3 text-center"
        >
          <span className="text-white/40 text-xs bg-white/5 px-3 py-1.5 rounded-full">
            👀 Stai guardando la risposta di <strong className="text-purple-300">{gameState.currentTurn}</strong>
          </span>
        </motion.div>
      )}

      {/* Answer options - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, index) => (
          <motion.button
            key={`${question.id}-${index}`}
            onClick={() => handleSelectAnswer(index)}
            disabled={!isMyTurn || hasAnswered || eliminatedIndices.includes(index)}
            whileTap={isMyTurn && !hasAnswered ? { scale: 0.96 } : {}}
            className={`
              relative p-3 rounded-xl border text-left transition-all
              min-h-[70px] flex flex-col justify-between
              text-white text-sm font-medium leading-snug
              ${getOptionStyle(index)}
              ${isMyTurn && !hasAnswered ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex-1">{option}</span>
              {getOptionIcon(index)}
              {/* Opponent selection indicator — visible only to the watcher */}
              {opponentSelectedIndex === index && !showResult && (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="text-orange-400 text-xs font-black flex-shrink-0"
                  title={`${gameState.currentTurn} ha scelto questa`}
                >
                  👆
                </motion.span>
              )}
            </div>
            <div
              className="text-xs font-bold opacity-40 mt-1"
              style={{ color: category.color }}
            >
              {String.fromCharCode(65 + index)}
            </div>

            {/* Correct answer flash overlay */}
            <AnimatePresence>
              {showResult && index === question.correct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  className="absolute inset-0 rounded-xl bg-green-400 pointer-events-none"
                />
              )}
              {showResult && index === selectedAnswer && index !== question.correct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  className="absolute inset-0 rounded-xl bg-red-400 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Result message */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`mt-4 p-3 rounded-xl text-center font-bold text-sm ${
              isCorrect
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {isCorrect
              ? speedBonus
                ? '⚡ VELOCE! +2 punti!'
                : '✅ Risposta corretta! +1 punto'
              : `❌ Risposta sbagliata! La corretta era: "${question.options[question.correct]}"`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
