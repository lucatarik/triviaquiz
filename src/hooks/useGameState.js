import { useState, useCallback, useRef } from 'react'
import { getGameState, setGameState, createInitialGameState } from '../lib/redis'
import { useRealtime } from './useRealtime'
import { CATEGORIES, getRandomQuestion } from '../data/questions'

export function useGameState(roomId, playerName) {
  const [gameState, setLocalGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isActingRef = useRef(false)

  const handleStateUpdate = useCallback((newState) => {
    setLocalGameState(newState)
    setLoading(false)
  }, [])

  const { forceRefresh } = useRealtime(roomId, handleStateUpdate, !!roomId)

  const initializeGame = useCallback(async () => {
    if (!roomId || !playerName) return
    setLoading(true)
    try {
      let state = await getGameState(roomId)
      if (!state) {
        state = createInitialGameState(roomId, playerName)
        await setGameState(roomId, state)
      } else if (!state.players[playerName]) {
        // Second player joining — reset leftover result state so wheelLocked doesn't fire
        state = {
          ...state,
          players: {
            ...state.players,
            [playerName]: { score: 0, connected: true, joinedAt: Date.now() }
          },
          phase: Object.keys(state.players).length === 1 ? 'spinning' : state.phase,
          answerResult: null,
          pendingAnswer: null,
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

  const spinWheel = useCallback(async (targetAngle, selectedCategoryFromWheel) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    isActingRef.current = true

    try {
      // Prefer the category passed directly from the Wheel animation (authoritative).
      // Fallback: recalculate using the same formula as Wheel.jsx (with +sliceSize/2 offset)
      let selectedCategory = selectedCategoryFromWheel
      if (!selectedCategory) {
        const sliceSize = 360 / CATEGORIES.length
        const normalizedAngle = ((targetAngle % 360) + 360) % 360
        const categoryIndex =
          Math.floor(((360 - normalizedAngle + sliceSize / 2) % 360) / sliceSize) % CATEGORIES.length
        selectedCategory = CATEGORIES[categoryIndex]
      }

      // Jolly → let the active player choose the category
      const nextPhase = selectedCategory.isJolly ? 'jolly_pick' : 'category_confirm'

      const updated = {
        ...gameState,
        phase: nextPhase,
        wheelAngle: targetAngle,
        currentCategory: selectedCategory.isJolly ? null : selectedCategory.id,
        pendingCategory: selectedCategory.isJolly ? null : selectedCategory,
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

  const submitAnswer = useCallback(async (selectedIndex) => {
    if (!gameState || isActingRef.current) return
    if (gameState.currentTurn !== playerName) return
    if (gameState.phase !== 'question') return
    isActingRef.current = true

    try {
      const question = gameState.currentQuestion
      const isCorrect = selectedIndex === question.correct
      const players = { ...gameState.players }

      if (isCorrect) {
        players[playerName] = {
          ...players[playerName],
          score: (players[playerName].score || 0) + 1
        }
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
        answerResult: {
          playerName,
          selectedIndex,
          correct: question.correct,
          isCorrect,
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

  const restartGame = useCallback(async () => {
    if (!gameState) return
    const playerNames = Object.keys(gameState.players)
    const newPlayers = {}
    playerNames.forEach(name => {
      newPlayers[name] = { score: 0, connected: true, joinedAt: Date.now() }
    })

    const updated = {
      ...gameState,
      players: newPlayers,
      currentTurn: playerNames[0],
      phase: 'spinning',
      currentCategory: null,
      currentQuestion: null,
      pendingCategory: null,
      wheelAngle: 0,
      usedQuestions: {},
      answerResult: null,
      winner: null,
    }

    await setGameState(roomId, updated)
    setLocalGameState(updated)
  }, [gameState, roomId])

  return {
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
    restartGame,
    forceRefresh,
  }
}
