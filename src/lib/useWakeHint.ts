import { useEffect, useState } from 'react'

export const THINKING_DELAY_MS = 500
export const WAKE_HINT_DELAY_MS = 2000

export type WakeHintStage = 0 | 1 | 2

/**
 * Escalates a pending indicator: 0 → just started (<500ms), 1 → still
 * thinking, 2 → probably a cold start (scale-to-zero waking up).
 */
export function useWakeHint(active: boolean): WakeHintStage {
  const [stage, setStage] = useState<WakeHintStage>(0)

  useEffect(() => {
    if (!active) {
      setStage(0)
      return
    }
    const thinking = setTimeout(() => setStage(1), THINKING_DELAY_MS)
    const waking = setTimeout(() => setStage(2), WAKE_HINT_DELAY_MS)
    return () => {
      clearTimeout(thinking)
      clearTimeout(waking)
    }
  }, [active])

  return stage
}
