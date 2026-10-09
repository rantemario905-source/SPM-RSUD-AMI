import { createContext, useContext } from 'react'

export interface ProgressContextValue { start: () => void; done: () => void }

export const ProgressContext = createContext<ProgressContextValue>({ start: () => undefined, done: () => undefined })

export function useProgress() {
  return useContext(ProgressContext)
}
