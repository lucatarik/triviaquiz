import { Redis } from '@upstash/redis'

let redis = null

function getRedis() {
  if (redis) return redis
  const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL
  const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('Upstash Redis credentials not set. Using localStorage fallback.')
    return null
  }
  redis = new Redis({ url, token })
  return redis
}

// LocalStorage fallback for development without Redis
const localStore = {
  async get(key) {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : null
    } catch { return null }
  },
  async set(key, value, opts) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) { console.error(e) }
  },
  async del(key) {
    localStorage.removeItem(key)
  }
}

export async function getGameState(roomId) {
  const client = getRedis()
  const key = `game:${roomId}`
  if (!client) return localStore.get(key)
  try {
    return await client.get(key)
  } catch (e) {
    console.error('Redis get error:', e)
    return localStore.get(key)
  }
}

export async function setGameState(roomId, state) {
  const client = getRedis()
  const key = `game:${roomId}`
  const withTimestamp = { ...state, lastActivity: Date.now() }
  if (!client) {
    await localStore.set(key, withTimestamp)
    return withTimestamp
  }
  try {
    // TTL of 10 minutes of inactivity
    await client.set(key, withTimestamp, { ex: 600 })
    return withTimestamp
  } catch (e) {
    console.error('Redis set error:', e)
    await localStore.set(key, withTimestamp)
    return withTimestamp
  }
}

export async function updateGameState(roomId, updater) {
  const current = await getGameState(roomId)
  const updated = updater(current)
  return setGameState(roomId, updated)
}

// Lightweight presence keys (TTL 30s) — separate from game state to avoid race conditions
export async function setPresence(roomId, playerName) {
  const client = getRedis()
  const key = `presence:${roomId}:${playerName}`
  if (!client) {
    try { localStorage.setItem(key, Date.now()) } catch {}
    return
  }
  try { await client.set(key, Date.now(), { ex: 30 }) } catch {}
}

export async function getPresence(roomId, playerName) {
  const client = getRedis()
  const key = `presence:${roomId}:${playerName}`
  if (!client) {
    try {
      const v = localStorage.getItem(key)
      return v ? Number(v) : null
    } catch { return null }
  }
  try {
    const v = await client.get(key)
    return v ? Number(v) : null
  } catch { return null }
}

export async function deleteGameState(roomId) {
  const client = getRedis()
  const key = `game:${roomId}`
  if (!client) {
    await localStore.del(key)
    return
  }
  try {
    await client.del(key)
  } catch (e) {
    console.error('Redis del error:', e)
    await localStore.del(key)
  }
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
