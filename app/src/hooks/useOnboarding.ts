import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

const ONBOARDING_KEY = 'memory-card-game:onboarding'

type OnboardingState = {
  hasSeenTutorial: boolean
}

const DEFAULT_STATE: OnboardingState = {
  hasSeenTutorial: false,
}

export function useOnboarding() {
  const [state, setState] = useLocalStorage<OnboardingState>(
    ONBOARDING_KEY,
    DEFAULT_STATE,
  )

  const acknowledge = useCallback(() => {
    setState({ hasSeenTutorial: true })
  }, [setState])

  return {
    hasSeenTutorial: state.hasSeenTutorial,
    acknowledge,
    reset: () => setState(DEFAULT_STATE),
  }
}
