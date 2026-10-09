import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProgressContext } from './progressContext'
import './ProgressBar.css'

function ProgressProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }, [])

  const start = useCallback(() => {
    clearTimers()
    setVisible(true)
    setWidth(10)
    let current = 10
    const tick = () => {
      current = Math.min(90, current + 6 + Math.random() * 10)
      setWidth(current)
      if (current < 90) timers.current.push(window.setTimeout(tick, 220 + Math.random() * 220))
    }
    timers.current.push(window.setTimeout(tick, 160))
  }, [clearTimers])

  const done = useCallback(() => {
    clearTimers()
    setWidth(100)
    timers.current.push(window.setTimeout(() => setVisible(false), 260))
    timers.current.push(window.setTimeout(() => setWidth(0), 520))
  }, [clearTimers])

  const value = useMemo(() => ({ start, done }), [start, done])

  return (
    <ProgressContext.Provider value={value}>
      <div className={`top-progress${visible ? ' is-visible' : ''}`} aria-hidden="true">
        <span className="top-progress-bar" style={{ width: `${width}%` }} />
      </div>
      {children}
    </ProgressContext.Provider>
  )
}

export default ProgressProvider
