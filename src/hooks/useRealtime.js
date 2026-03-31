import { useEffect, useRef } from 'react'
import { subscribeToGame } from '../lib/firebase'

export function useRealtime(roomId, onUpdate, enabled = true, onExpired) {
  const onUpdateRef = useRef(onUpdate)
  const onExpiredRef = useRef(onExpired)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])
  useEffect(() => { onExpiredRef.current = onExpired }, [onExpired])

  useEffect(() => {
    if (!roomId || !enabled) return
    const unsubscribe = subscribeToGame(
      roomId,
      (state) => onUpdateRef.current(state),
      () => onExpiredRef.current && onExpiredRef.current(),
    )
    return unsubscribe
  }, [roomId, enabled])

  // Firebase listener is always live — no manual refresh needed
  const forceRefresh = () => {}

  return { forceRefresh }
}
