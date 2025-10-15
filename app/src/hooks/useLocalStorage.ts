import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) {
        return initialValue
      }
      return JSON.parse(raw) as T
    } catch (error) {
      console.warn('localStorage読み込みに失敗したで', error)
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn('localStorage書き込みに失敗したで', error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}

