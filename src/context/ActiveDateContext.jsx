import { createContext, useContext, useState, useEffect } from 'react'
import { ensureDailySnapshot } from '../services/snapshotService'

const ActiveDateContext = createContext()

export function ActiveDateProvider({ children }) {
  const [activeDate, setActiveDate] = useState(new Date())
  const [isInitializing, setIsInitializing] = useState(true)

  // Format date as YYYY-MM-DD
  const dateStr = activeDate.toLocaleDateString('en-CA')

  useEffect(() => {
    let mounted = true
    const initSnapshot = async () => {
      setIsInitializing(true)
      await ensureDailySnapshot(dateStr)
      if (mounted) setIsInitializing(false)
    }
    initSnapshot()
    return () => { mounted = false }
  }, [dateStr])

  return (
    <ActiveDateContext.Provider value={{ activeDate, setActiveDate, dateStr, isInitializing }}>
      {children}
    </ActiveDateContext.Provider>
  )
}

export function useActiveDate() {
  return useContext(ActiveDateContext)
}
