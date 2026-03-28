import { useEffect, useRef } from 'react'
import { getGameState } from '../lib/redis'

const POLL_INTERVAL = 1500

export function useRealtime(roomId, onUpdate, enabled = true, onExpired) {
  const intervalRef = useRef(null)
  const lastStateRef = useRef(null)
  const hadStateRef = useRef(false) // true once we received at least one valid state

  useEffect(() => {
    if (!roomId || !enabled) return

    const poll = async () => {
      try {
        const state = await getGameState(roomId)
        if (state) {
          hadStateRef.current = true
          const stateStr = JSON.stringify(state)
          if (stateStr !== lastStateRef.current) {
            lastStateRef.current = stateStr
            onUpdate(state)
          }
        } else if (hadStateRef.current) {
          // Room existed but is now gone (TTL expired or deleted)
          onExpired && onExpired()
        }
      } catch (e) {
        console.error('Polling error:', e)
      }
    }

    // Initial fetch
    poll()

    // Set up interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [roomId, enabled])

  const forceRefresh = async () => {
    if (!roomId) return
    try {
      const state = await getGameState(roomId)
      if (state) {
        lastStateRef.current = JSON.stringify(state)
        onUpdate(state)
      }
    } catch (e) {
      console.error('Force refresh error:', e)
    }
  }

  return { forceRefresh }
}
