import { useState, useCallback, useRef, useEffect } from 'react'
import { getGameState, setGameState, createInitialGameState, setPresence, getPresence } from '../lib/redis'
import { useRealtime } from './useRealtime'
import { CATEGORIES, getRandomQuestion } from '../data/questions'

const PRESENCE_STALE_MS = 25000  // player considered disconnected after 25s without heartbeat

export function useGameState(roomId, playerName, onRoomExpired) {
  const [gameState, setLocalGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isActingRef = useRef(false)
  // Local-only bomb counters — never stored in Redis to avoid race conditions
  // (any opponent write spreads gameState, which can overwrite a freshly-updated count)
  const [localCorrectCount, setLocalCorrectCount] = useState(0)
  const [localBombsUsed, setLocalBombsUsed] = useState(0)

  const handleStateUpdate = useCallback((newState) => {
    setLocalGameState(newState)
    setLoading(false)
  }, [])

  const { forceRefresh } = useRealtime(roomId, handleStateUpdate, !!roomId, onRoomExpired)

  // Heartbeat: write presence every 10s so the other player can detect disconnection
  useEffect(() => {
    if (!roomId || !playerName) return
    setPresence(roomId, playerName)
    const interval = setInterval(() => setPresence(roomId, playerName), 10000)
    return () => clearInterval(interval)
  }, [roomId, playerName])

  const initializeGame = useCallback(async () => {
    if (!roomId || !playerName) return
    setLoading(true)
    try {
      let state = await getGameState(roomId)
      if (!state) {
        state = createInitialGameState(roomId, playerName)
        await setGameState(roomId, state)
      } else if (!state.players[playerName]) {
        const existingNames = Object.keys(state.players)

        if (existingNames.length >= 2) {
          // Room is full — check if one of the existing players has gone offline
          const presences = await Promise.all(
            existingNames.map(n => getPresence(roomId, n).then(ts => ({ name: n, ts })))
          )
          const now = Date.now()
          const disconnected = presences
            .filter(p => !p.ts || now - p.ts > PRESENCE_STALE_MS)
            .sort((a, b) => (a.ts || 0) - (b.ts || 0))[0]

          if (!disconnected) {
            // Both players are active — can't join
            setError('La stanza è piena. Entrambi i giocatori sono connessi.')
            setLoading(false)
            return
          }

          // Take over the disconnected player's slot
          const oldName = disconnected.name
          const oldData = state.players[oldName]
          const newPlayers = { ...state.players }
          delete newPlayers[oldName]
          newPlayers[playerName] = { ...oldData, connected: true, joinedAt: Date.now() }

          state = {
            ...state,
            players: newPlayers,
            currentTurn: state.currentTurn === oldName ? playerName : state.currentTurn,
            answerResult: null,
            pendingAnswer: null,
          }
        } else {
          // Second player joining normally
          state = {
            ...state,
            players: {
              ...state.players,
              [playerName]: { score: 0, connected: true, joinedAt: Date.now(), correctCount: 0, bombsUsed: 0 }
            },
            phase: existingNames.length === 1 ? 'spinning' : state.phase,
            answerResult: null,
            pendingAnswer: null,
          }
        }
        await setGameState(roomId, state)
      } else {
        // Reconnecting player
        state = {
          ...state,
          players: {
            ...state.players,
            [playerName]: { ...state.players[playerName], connected: true }
          }
        }
        await setGameState(roomId, state)
      }
      setLocalGameState(state)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [roomId, playerName])

  // Called at the START of the spin so the observer can see the animation
  // Not guarded by isActingRef — lightweight fire-and-forget
  const broadcastSpinStart = useCallback(async (targetAngle, duration) => {
    if (!gameState || gameState.currentTurn !== playerName) return
    const updated = {
      ...gameState,
      isSpinning: true,
      spinTargetAngle: targetAngle,
      spinDuration: duration,
      spinStartTime: Date.now(),
    }
    await setGameState(roomId, updated)
  }, [gameState, playerName, roomId])

  const spinWheel = useCallback(async (targetAngle, selectedCategoryFromWheel) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    isActingRef.current = true

    try {
      let selectedCategory = selectedCategoryFromWheel
      if (!selectedCategory) {
        const sliceSize = 360 / CATEGORIES.length
        const normalizedAngle = ((targetAngle % 360) + 360) % 360
        const categoryIndex =
          Math.floor(((360 - normalizedAngle + sliceSize / 2) % 360) / sliceSize) % CATEGORIES.length
        selectedCategory = CATEGORIES[categoryIndex]
      }

      const nextPhase = selectedCategory.isJolly ? 'jolly_pick' : 'category_confirm'

      const updated = {
        ...gameState,
        phase: nextPhase,
        wheelAngle: targetAngle,
        currentCategory: selectedCategory.isJolly ? null : selectedCategory.id,
        pendingCategory: selectedCategory.isJolly ? null : selectedCategory,
        isSpinning: false,
        spinTargetAngle: null,
        spinDuration: null,
        spinStartTime: null,
      }
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId])

  const confirmCategory = useCallback(async () => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    isActingRef.current = true

    try {
      const categoryId = gameState.currentCategory
      const usedIds = gameState.usedQuestions?.[categoryId] || []
      const question = getRandomQuestion(categoryId, usedIds)

      if (!question) return

      const updated = {
        ...gameState,
        phase: 'question',
        currentQuestion: question,
        questionStartTime: Date.now(),
        answerResult: null,
      }
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId])

  const selectJollyCategory = useCallback(async (categoryId) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    if (gameState.phase !== 'jolly_pick') return
    isActingRef.current = true

    try {
      const category = CATEGORIES.find(c => c.id === categoryId)
      if (!category || category.isJolly) return

      const updated = {
        ...gameState,
        phase: 'category_confirm',
        currentCategory: category.id,
        pendingCategory: category,
      }
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId])

  // Saves the option the active player just tapped — visible to the opponent via polling.
  // Intentionally NOT guarded by isActingRef (lightweight, fire-and-forget).
  const reportPendingAnswer = useCallback(async (optionIndex) => {
    if (!gameState || gameState.currentTurn !== playerName) return
    if (gameState.phase !== 'question') return
    const updated = {
      ...gameState,
      pendingAnswer: { playerName, optionIndex, timestamp: Date.now() },
    }
    await setGameState(roomId, updated)
    setLocalGameState(updated)
  }, [gameState, playerName, roomId])

  // clientSpeedBonus is passed from QuestionCard based on the local countdown timer
  // (timeLeft > 10 means answered within the first 5 seconds as seen on screen).
  // We do NOT use Date.now() - questionStartTime here because that timestamp is set
  // in Redis and the polling delay (~1.5 s) would eat into the bonus window unfairly.
  const submitAnswer = useCallback(async (selectedIndex, clientSpeedBonus = false) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    if (gameState.phase !== 'question') return
    isActingRef.current = true

    try {
      const question = gameState.currentQuestion
      const isCorrect = selectedIndex === question.correct

      const speedBonus = isCorrect && clientSpeedBonus
      const pointsEarned = isCorrect ? (speedBonus ? 2 : 1) : 0

      const players = { ...gameState.players }
      const prevPlayer = players[playerName] || {}
      if (isCorrect) setLocalCorrectCount(prev => prev + 1)
      players[playerName] = {
        ...prevPlayer,
        score: (prevPlayer.score || 0) + pointsEarned,
      }

      // Track used questions
      const categoryId = gameState.currentCategory
      const usedQuestions = {
        ...gameState.usedQuestions,
        [categoryId]: [...(gameState.usedQuestions?.[categoryId] || []), question.id]
      }

      // Determine next turn
      const allPlayers = Object.keys(gameState.players)
      const currentIndex = allPlayers.indexOf(playerName)
      const nextPlayer = allPlayers[(currentIndex + 1) % allPlayers.length]

      // Check win condition (first to 10 points)
      const newScore = players[playerName].score
      const phase = newScore >= 10 ? 'ended' : 'spinning'

      const updated = {
        ...gameState,
        players,
        phase,
        currentTurn: phase === 'ended' ? playerName : nextPlayer,
        currentQuestion: null,
        currentCategory: null,
        pendingCategory: null,
        pendingAnswer: null,
        usedQuestions,
        endedAt: phase === 'ended' ? Date.now() : gameState.endedAt ?? null,
        readyToRestart: phase === 'ended' ? [] : (gameState.readyToRestart ?? []),
        answerResult: {
          playerName,
          selectedIndex,
          selectedOption: question.options[selectedIndex],
          correctIndex: question.correct,
          correctOption: question.options[question.correct],
          isCorrect,
          speedBonus,
          pointsEarned,
          timestamp: Date.now(),
        },
        winner: phase === 'ended' ? playerName : null,
      }

      await setGameState(roomId, updated)
      setLocalGameState(updated)

      // Haptic feedback
      if (navigator.vibrate) {
        if (isCorrect) navigator.vibrate(100)
        else navigator.vibrate([100, 50, 100])
      }
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId])

  const timeoutAnswer = useCallback(async (callerName) => {
    if (!gameState || isActingRef.current) return
    if (gameState.phase !== 'question') return
    isActingRef.current = true

    try {
      const question = gameState.currentQuestion
      const allPlayers = Object.keys(gameState.players)
      const currentIndex = allPlayers.indexOf(gameState.currentTurn)
      const nextPlayer = allPlayers[(currentIndex + 1) % allPlayers.length]

      const categoryId = gameState.currentCategory
      const usedQuestions = {
        ...gameState.usedQuestions,
        [categoryId]: [...(gameState.usedQuestions?.[categoryId] || []), question.id]
      }

      const updated = {
        ...gameState,
        phase: 'spinning',
        currentTurn: nextPlayer,
        currentQuestion: null,
        currentCategory: null,
        pendingCategory: null,
        pendingAnswer: null,
        usedQuestions,
        answerResult: {
          playerName: gameState.currentTurn,
          selectedIndex: -1,
          correct: question.correct,
          isCorrect: false,
          timedOut: true,
          timestamp: Date.now(),
        },
      }

      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, roomId])

  const useBomb = useCallback(() => {
    setLocalBombsUsed(prev => prev + 1)
  }, [])

  const restartGame = useCallback(async () => {
    if (!gameState) return
    // Re-fetch fresh state to avoid stale readyToRestart
    const current = (await getGameState(roomId)) || gameState
    const readyToRestart = [...new Set([...(current.readyToRestart || []), playerName])]
    const allPlayers = Object.keys(current.players)

    if (readyToRestart.length >= allPlayers.length) {
      // Both voted — do the actual restart
      const newPlayers = {}
      allPlayers.forEach(name => {
        newPlayers[name] = { score: 0, connected: true, joinedAt: Date.now(), correctCount: 0, bombsUsed: 0 }
      })
      const updated = {
        ...current,
        players: newPlayers,
        currentTurn: allPlayers[0],
        phase: 'spinning',
        currentCategory: null,
        currentQuestion: null,
        pendingCategory: null,
        wheelAngle: 0,
        usedQuestions: {},
        answerResult: null,
        winner: null,
        endedAt: null,
        readyToRestart: [],
        leftGame: null,
      }
      setLocalCorrectCount(0)
      setLocalBombsUsed(0)
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } else {
      // Just register this player's vote
      const updated = { ...current, readyToRestart }
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    }
  }, [gameState, roomId, playerName])

  const leaveGame = useCallback(async () => {
    if (!gameState) return
    const updated = { ...gameState, leftGame: playerName }
    await setGameState(roomId, updated)
  }, [gameState, playerName, roomId])

  return {
    gameState,
    loading,
    error,
    localCorrectCount,
    localBombsUsed,
    initializeGame,
    broadcastSpinStart,
    spinWheel,
    confirmCategory,
    selectJollyCategory,
    reportPendingAnswer,
    submitAnswer,
    timeoutAnswer,
    useBomb,
    leaveGame,
    restartGame,
    forceRefresh,
  }
}
