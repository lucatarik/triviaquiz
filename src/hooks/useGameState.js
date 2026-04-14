import { useState, useCallback, useRef, useEffect } from 'react'
import { getGameState, setGameState, createInitialGameState, setPresence, getPresence, saveHistory } from '../lib/firebase'
import { useRealtime } from './useRealtime'
import { CATEGORIES, getRandomQuestion } from '../data/questions'

const PRESENCE_STALE_MS = 25000

// Append an event to the events log (immutable)
function appendEvent(events, event) {
  return [...(events || []), { ...event, ts: Date.now() }]
}

// Shuffle a question's options and update the correct index accordingly.
// Called before storing in Firebase so both players see the same order.
function shuffleQuestion(question) {
  const indices = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return {
    ...question,
    options: indices.map(i => question.options[i]),
    correct: indices.indexOf(question.correct),
  }
}

export function useGameState(roomId, playerName, onRoomExpired) {
  const [gameState, setLocalGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isActingRef = useRef(false)
  // Power-up counts — local only, never stored in Firebase (avoids race conditions)
  const [localBombCount, setLocalBombCount] = useState(0)
  const [localSmistaCount, setLocalSmistaCount] = useState(0)

  const handleStateUpdate = useCallback((newState) => {
    setLocalGameState(newState)
    setLoading(false)
  }, [])

  const { forceRefresh } = useRealtime(roomId, handleStateUpdate, !!roomId, onRoomExpired)

  // Polling fallback while waiting for the second player to join
  useEffect(() => {
    if (!roomId) return
    const playerCount = gameState ? Object.keys(gameState.players || {}).length : 0
    if (playerCount >= 2) return
    const interval = setInterval(async () => {
      try {
        const state = await getGameState(roomId)
        if (state && Object.keys(state.players || {}).length >= 2) {
          setLocalGameState(state)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [roomId, gameState ? Object.keys(gameState.players || {}).length : 0])

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
          const presences = await Promise.all(
            existingNames.map(n => getPresence(roomId, n).then(ts => ({ name: n, ts })))
          )
          const now = Date.now()
          const disconnected = presences
            .filter(p => !p.ts || now - p.ts > PRESENCE_STALE_MS)
            .sort((a, b) => (a.ts || 0) - (b.ts || 0))[0]

          if (!disconnected) {
            setError('La stanza è piena. Entrambi i giocatori sono connessi.')
            setLoading(false)
            return
          }

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
          state = {
            ...state,
            players: {
              ...state.players,
              [playerName]: { score: 0, connected: true, joinedAt: Date.now() }
            },
            phase: existingNames.length === 1 ? 'spinning' : state.phase,
            answerResult: null,
            pendingAnswer: null,
          }
        }
        await setGameState(roomId, state)
      } else {
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

  const spinWheel = useCallback(async (targetAngle, selectedSlice) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    isActingRef.current = true

    try {
      const allPlayers = Object.keys(gameState.players)
      const currentIndex = allPlayers.indexOf(playerName)
      const nextPlayer = allPlayers[(currentIndex + 1) % allPlayers.length]
      const spinBase = {
        ...gameState,
        wheelAngle: targetAngle,
        isSpinning: false,
        spinTargetAngle: null,
        spinDuration: null,
        spinStartTime: null,
      }

      const spinEvent = { type: 'spin', player: playerName, slice: selectedSlice ? { type: selectedSlice.type, label: selectedSlice.label, emoji: selectedSlice.emoji, powerupType: selectedSlice.powerupType || null } : null }

      if (!selectedSlice || selectedSlice.type === 'category') {
        // Legacy path or category: show category confirm
        let category = selectedSlice
        if (!category) {
          const sliceSize = 360 / CATEGORIES.length
          const norm = ((targetAngle % 360) + 360) % 360
          const idx = Math.floor(((360 - norm + sliceSize / 2) % 360) / sliceSize) % CATEGORIES.length
          category = CATEGORIES[idx]
        }
        const nextPhase = category.isJolly ? 'jolly_pick' : 'category_confirm'
        const updated = {
          ...spinBase,
          phase: nextPhase,
          currentCategory: category.isJolly ? null : category.id,
          pendingCategory: category.isJolly ? null : category,
          events: appendEvent(spinBase.events, spinEvent),
        }
        await setGameState(roomId, updated)
        setLocalGameState(updated)

      } else if (selectedSlice.type === 'passa_turno') {
        const updated = {
          ...spinBase,
          phase: 'spinning',
          currentTurn: nextPlayer,
          answerResult: { playerName, passaTurno: true, timestamp: Date.now() },
          events: appendEvent(spinBase.events, spinEvent),
        }
        await setGameState(roomId, updated)
        setLocalGameState(updated)

      } else if (selectedSlice.type === 'powerup') {
        if (selectedSlice.powerupType === 'bomb') setLocalBombCount(prev => prev + 1)
        else if (selectedSlice.powerupType === 'smista') setLocalSmistaCount(prev => prev + 1)
        // Keep same player's turn — they spin again to pick a category
        const updated = {
          ...spinBase,
          phase: 'spinning',
          currentTurn: playerName,
          answerResult: { playerName, powerup: selectedSlice.powerupType, timestamp: Date.now() },
          events: appendEvent(spinBase.events, spinEvent),
        }
        await setGameState(roomId, updated)
        setLocalGameState(updated)

      } else if (selectedSlice.type === 'minus_punto') {
        const players = { ...gameState.players }
        const prev = players[playerName] || {}
        players[playerName] = { ...prev, score: (prev.score || 0) - 1 }
        const updated = {
          ...spinBase,
          phase: 'spinning',
          players,
          currentTurn: nextPlayer,
          answerResult: { playerName, minusPunto: true, timestamp: Date.now() },
          events: appendEvent(spinBase.events, spinEvent),
        }
        await setGameState(roomId, updated)
        setLocalGameState(updated)
      }
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
        currentQuestion: shuffleQuestion(question),
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
      players[playerName] = {
        ...prevPlayer,
        score: (prevPlayer.score || 0) + pointsEarned,
      }

      const categoryId = gameState.currentCategory
      const usedQuestions = {
        ...gameState.usedQuestions,
        [categoryId]: [...(gameState.usedQuestions?.[categoryId] || []), question.id]
      }

      const allPlayers = Object.keys(gameState.players)
      const currentIndex = allPlayers.indexOf(playerName)
      const nextPlayer = allPlayers[(currentIndex + 1) % allPlayers.length]

      const newScore = players[playerName].score
      const phase = newScore >= 10 ? 'ended' : 'spinning'

      const answerEvent = {
        type: 'answer',
        player: playerName,
        category: categoryId,
        question: question.question,
        options: question.options,
        selectedIndex,
        correctIndex: question.correct,
        isCorrect,
        speedBonus,
        pointsEarned,
      }
      const updatedEvents = appendEvent(gameState.events, answerEvent)

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
        events: updatedEvents,
      }

      await setGameState(roomId, updated)
      setLocalGameState(updated)

      if (phase === 'ended') {
        saveHistory(roomId, { ...updated, historyId: roomId }).catch(() => {})
      }

      if (navigator.vibrate) {
        if (isCorrect) navigator.vibrate(100)
        else navigator.vibrate([100, 50, 100])
      }
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId])

  const timeoutAnswer = useCallback(async () => {
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

      const timeoutEvent = {
        type: 'timeout',
        player: gameState.currentTurn,
        category: categoryId,
        question: question.question,
        options: question.options,
        correctIndex: question.correct,
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
          correctOption: question.options[question.correct],
          isCorrect: false,
          timedOut: true,
          timestamp: Date.now(),
        },
        events: appendEvent(gameState.events, timeoutEvent),
      }

      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, roomId])

  const useBomb = useCallback(() => {
    setLocalBombCount(prev => Math.max(0, prev - 1))
    // Note: bomb effect is local-only (eliminates options on screen), no Firebase write needed
  }, [])

  const useSmista = useCallback(async () => {
    if (!gameState || isActingRef.current) return
    if (gameState.phase !== 'question') return
    if (gameState.currentTurn !== playerName) return
    if (localSmistaCount <= 0) return
    isActingRef.current = true

    try {
      const categoryId = gameState.currentCategory
      // Mark current question as used so it doesn't come back
      const usedIds = [...(gameState.usedQuestions?.[categoryId] || []), gameState.currentQuestion.id]
      const newQuestion = getRandomQuestion(categoryId, usedIds)
      if (!newQuestion) return // no more questions in this category

      setLocalSmistaCount(prev => prev - 1)

      const smistaEvent = { type: 'smista_used', player: playerName, category: categoryId, skippedQuestion: gameState.currentQuestion.question }

      const updated = {
        ...gameState,
        currentQuestion: shuffleQuestion(newQuestion),
        questionStartTime: Date.now(),
        pendingAnswer: null,
        usedQuestions: {
          ...gameState.usedQuestions,
          [categoryId]: usedIds,
        },
        events: appendEvent(gameState.events, smistaEvent),
      }
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } finally {
      isActingRef.current = false
    }
  }, [gameState, playerName, roomId, localSmistaCount])

  const restartGame = useCallback(async () => {
    if (!gameState) return
    const current = (await getGameState(roomId)) || gameState
    const readyToRestart = [...new Set([...(current.readyToRestart || []), playerName])]
    const allPlayers = Object.keys(current.players)

    if (readyToRestart.length >= allPlayers.length) {
      const newPlayers = {}
      allPlayers.forEach(name => {
        newPlayers[name] = { score: 0, connected: true, joinedAt: Date.now() }
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
      setLocalBombCount(0)
      setLocalSmistaCount(0)
      await setGameState(roomId, updated)
      setLocalGameState(updated)
    } else {
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
    localBombCount,
    localSmistaCount,
    initializeGame,
    broadcastSpinStart,
    spinWheel,
    confirmCategory,
    selectJollyCategory,
    reportPendingAnswer,
    submitAnswer,
    timeoutAnswer,
    useBomb,
    useSmista,
    leaveGame,
    restartGame,
    forceRefresh,
  }
}
