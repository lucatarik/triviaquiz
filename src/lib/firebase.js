import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, remove, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "progettomlx.firebaseapp.com",
  databaseURL: "https://progettomlx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "progettomlx",
  storageBucket: "progettomlx.firebasestorage.app",
  messagingSenderId: "857416814607",
  appId: "1:857416814607:web:7f3e81dc715f66a7eb937a",
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

const ROOM_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

export async function getGameState(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}`))
  return snap.val()
}

export async function setGameState(roomId, state) {
  const withTimestamp = { ...state, lastActivity: Date.now() }
  await set(ref(db, `rooms/${roomId}`), withTimestamp)
  return withTimestamp
}

export async function deleteGameState(roomId) {
  await remove(ref(db, `rooms/${roomId}`))
}

export async function setPresence(roomId, playerName) {
  await set(ref(db, `presence/${roomId}/${playerName}`), { ts: Date.now() })
}

export async function getPresence(roomId, playerName) {
  const snap = await get(ref(db, `presence/${roomId}/${playerName}`))
  const val = snap.val()
  return val ? val.ts : null
}

// Returns an unsubscribe function. Calls callback(state) on every change.
// If state is null after having had data, calls onExpired().
export function subscribeToGame(roomId, callback, onExpired) {
  let hadData = false
  const unsubscribe = onValue(ref(db, `rooms/${roomId}`), (snap) => {
    const state = snap.val()
    if (state !== null) {
      // Auto-expire rooms inactive for > 10 minutes
      if (state.lastActivity && Date.now() - state.lastActivity > ROOM_EXPIRY_MS) {
        remove(ref(db, `rooms/${roomId}`))
        if (hadData) onExpired && onExpired()
        return
      }
      hadData = true
      callback(state)
    } else if (hadData) {
      onExpired && onExpired()
    }
  })
  return unsubscribe
}

export async function saveHistory(roomId, data) {
  await set(ref(db, `history/${roomId}`), { ...data, savedAt: Date.now() })
}

export async function getHistory(historyId) {
  const snap = await get(ref(db, `history/${historyId}`))
  return snap.val()
}

export function createInitialGameState(roomId, playerName) {
  return {
    roomId,
    players: {
      [playerName]: { score: 0, connected: true, joinedAt: Date.now(), correctCount: 0, bombsUsed: 0 }
    },
    currentTurn: playerName,
    phase: 'waiting',
    currentCategory: null,
    currentQuestion: null,
    wheelAngle: 0,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    usedQuestions: {},
    answerResult: null,
  }
}
