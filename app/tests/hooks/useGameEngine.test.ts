import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameEngine } from '../../src/hooks/useGameEngine'

function findPair(cards: ReturnType<typeof useGameEngine>['cards']) {
  const map = new Map<string, string[]>()
  for (const card of cards) {
    const arr = map.get(card.pairId) ?? []
    arr.push(card.id)
    map.set(card.pairId, arr)
  }
  for (const ids of map.values()) {
    if (ids.length === 2) {
      return ids as [string, string]
    }
  }
  throw new Error('pair not found')
}

function findMismatch(cards: ReturnType<typeof useGameEngine>['cards']) {
  const [first, second] = cards
  if (!first || !second) {
    throw new Error('cards not found')
  }
  if (first.pairId !== second.pairId) {
    return [first.id, second.id] as const
  }
  const third = cards.find((card) => card.pairId !== first.pairId)
  if (!third) {
    throw new Error('mismatch card not found')
  }
  return [first.id, third.id] as const
}

describe('useGameEngine', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('marks cards as matched and raises the score when a pair is flipped', async () => {
    const { result } = renderHook(() => useGameEngine())
    const pair = findPair(result.current.cards)

    act(() => {
      result.current.flipCard(pair[0])
      result.current.flipCard(pair[1])
    })

    await waitFor(() => {
      expect(result.current.matchedPairs).toBe(1)
      expect(result.current.score).toBe(30)
    })

    const [firstCard, secondCard] = pair.map((id) =>
      result.current.cards.find((card) => card.id === id),
    )

    expect(firstCard?.status).toBe('matched')
    expect(secondCard?.status).toBe('matched')
  })

  it('penalises mismatches and flips the cards back after the delay', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useGameEngine())
    const mismatch = findMismatch(result.current.cards)

    act(() => {
      result.current.flipCard(mismatch[0])
      result.current.flipCard(mismatch[1])
    })

    expect(result.current.isResolving).toBe(true)

    act(() => {
      vi.advanceTimersByTime(900)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isResolving).toBe(false)

    const [firstCard, secondCard] = mismatch.map((id) =>
      result.current.cards.find((card) => card.id === id),
    )

    expect(firstCard?.status).toBe('hidden')
    expect(secondCard?.status).toBe('hidden')
    expect(result.current.score).toBe(0)
  })

  it('counts down the timer and ends the game when time runs out', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.changeDifficulty('hard')
    })

    const pair = findPair(result.current.cards)

    act(() => {
      result.current.flipCard(pair[0])
      result.current.flipCard(pair[1])
    })

    act(() => {
      vi.advanceTimersByTime(3_000)
    })

    expect(result.current.remainingTimeMs).toBe(57_000)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.status).toBe('finished')
    expect(result.current.remainingTimeMs).toBe(0)
  })

  it('shows a brief hint preview and marks the hint as used', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useGameEngine())

    const firstCard = result.current.cards[0]

    act(() => {
      result.current.flipCard(firstCard.id)
    })

    act(() => {
      result.current.useHint()
    })

    expect(result.current.isHintPreviewing).toBe(true)
    expect(result.current.hintUsed).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(result.current.isHintPreviewing).toBe(false)
  })

  it('can discard a saved session', async () => {
    const { result } = renderHook(() => useGameEngine())
    const firstCard = result.current.cards[0]

    act(() => {
      result.current.flipCard(firstCard.id)
    })

    await waitFor(() => {
      expect(result.current.resumeAvailable).toBe(true)
    })

    act(() => {
      result.current.discardSession()
    })

    expect(result.current.resumeAvailable).toBe(false)
  })

  it('restores the saved state when resuming a session', async () => {
    const initial = renderHook(() => useGameEngine())
    const pair = findPair(initial.result.current.cards)

    act(() => {
      initial.result.current.flipCard(pair[0])
      initial.result.current.flipCard(pair[1])
    })

    await waitFor(() => {
      expect(initial.result.current.resumeAvailable).toBe(true)
    })

    initial.unmount()

    const resumed = renderHook(() => useGameEngine())
    expect(resumed.result.current.resumeAvailable).toBe(true)
    const savedPair = pair

    act(() => {
      resumed.result.current.resumeSession()
    })

    const [firstId, secondId] = savedPair
    const firstCard = resumed.result.current.cards.find((card) => card.id === firstId)
    const secondCard = resumed.result.current.cards.find((card) => card.id === secondId)
    expect(firstCard?.status).toBe('matched')
    expect(secondCard?.status).toBe('matched')
  })
})
