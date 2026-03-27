import { useState, useEffect } from 'react'

// This hook is PURELY LOCAL - never sends data anywhere
export function useCheat() {
  const [cheatActive, setCheatActive] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        setCheatActive(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return cheatActive
}
