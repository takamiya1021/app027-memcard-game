import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { shuffle } from '../utils/shuffle'
import { sampleCardBack, sampleFrontCards } from '../data/sampleCards'

const EMOJI_POOL = [
  '🐶',
  '🐱',
  '🦊',
  '🐼',
  '🐰',
  '🐸',
  '🦁',
  '🐵',
  '🐯',
  '🦄',
  '🐙',
  '🦓',
  '🐢',
]

export type CardStatus = 'hidden' | 'flipped' | 'matched'

type EmojiArtwork = {
  kind: 'emoji'
  value: string
  label: string
}

type ImageArtwork = {
  kind: 'image'
  src: string
  alt: string
  label: string
}

type CardArtwork = EmojiArtwork | ImageArtwork

export type Theme = 'emoji' | 'storybook'

export const THEME_ORDER: Theme[] = ['emoji', 'storybook']

export const THEME_LABEL: Record<Theme, string> = {
  emoji: 'えもじデッキ',
  storybook: 'サンプルデッキ',
}

export const THEME_DESCRIPTION: Record<Theme, string> = {
  emoji: 'カラフルな絵文字がいっぱいの定番デッキ',
  storybook: 'サンプルのイラストカードが主役の特別デッキ',
}

type FrontBlueprint = {
  key: string
  front: CardArtwork
}

type ThemeConfig = {
  back: CardArtwork
  blueprints: FrontBlueprint[]
  fallbackThemes?: Theme[]
}

const EMOJI_BLUEPRINTS: FrontBlueprint[] = EMOJI_POOL.map((icon) => ({
  key: `emoji-${icon.codePointAt(0)?.toString(16) ?? icon}`,
  front: {
    kind: 'emoji',
    value: icon,
    label: `${icon} のカード`,
  },
}))

const SAMPLE_BLUEPRINTS: FrontBlueprint[] = sampleFrontCards.map((card) => ({
  key: `sample-${card.id}`,
  front: {
    kind: 'image',
    src: card.asset,
    alt: `${card.title}カード`,
    label: `${card.title}カード`,
  },
}))

const THEME_CONFIG: Record<Theme, ThemeConfig> = {
  emoji: {
    back: {
      kind: 'emoji',
      value: '🎴',
      label: 'カードの裏面',
    },
    blueprints: EMOJI_BLUEPRINTS,
  },
  storybook: {
    back: {
      kind: 'image',
      src: sampleCardBack,
      alt: 'サンプルカードの裏面',
      label: 'サンプルカードの裏面',
    },
    blueprints: SAMPLE_BLUEPRINTS,
    fallbackThemes: ['emoji'],
  },
}

export type CardModel = {
  id: string
  pairId: string
  front: CardArtwork
  back: CardArtwork
  theme: Theme
  status: CardStatus
}

export type GameStatus = 'ready' | 'running' | 'finished'
export type Difficulty = 'easy' | 'normal' | 'hard'

const MATCH_REWARD = 30
const MISMATCH_PENALTY = 5
const HINT_REVEAL_MS = 1000
const MISMATCH_HIDE_MS = 900

const LAST_DIFFICULTY_KEY = 'memory-card-game:last-difficulty'
const LAST_THEME_KEY = 'memory-card-game:last-theme'
const HIGH_SCORE_KEY = 'memory-card-game:high-scores'
const SESSION_KEY = 'memory-card-game:session'

type DifficultyConfig = {
  totalPairs: number
  timeLimitMs: number | null
  hintAvailable: boolean
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: { totalPairs: 5, timeLimitMs: null, hintAvailable: true },
  normal: { totalPairs: 6, timeLimitMs: 90_000, hintAvailable: false },
  hard: { totalPairs: 7, timeLimitMs: 60_000, hintAvailable: false },
}

type PersistedSession = {
  difficulty: Difficulty
  theme: Theme
  cards: CardModel[]
  flippedIds: string[]
  matchedPairs: number
  score: number
  remainingTimeMs: number | null
  hintUsed: boolean
  status: GameStatus
  savedAt: number
}

type GameEngineSnapshot = {
  cards: CardModel[]
  score: number
  matchedPairs: number
  totalPairs: number
  status: GameStatus
  isResolving: boolean
  remainingTimeMs: number | null
  difficulty: Difficulty
  theme: Theme
  hintAvailable: boolean
  hintUsed: boolean
  isHintPreviewing: boolean
  resumeAvailable: boolean
}

function cloneArtwork(artwork: CardArtwork): CardArtwork {
  if (artwork.kind === 'emoji') {
    return { ...artwork }
  }
  return { ...artwork }
}

function pickBlueprints(theme: Theme, totalPairs: number): FrontBlueprint[] {
  const usedKeys = new Set<string>()
  const selections: FrontBlueprint[] = []
  const queue: Theme[] = [theme]

  while (queue.length > 0 && selections.length < totalPairs) {
    const current = queue.shift() as Theme
    const config = THEME_CONFIG[current]
    const candidates = shuffle(config.blueprints).filter(
      (blueprint) => !usedKeys.has(blueprint.key),
    )
    for (const blueprint of candidates) {
      selections.push(blueprint)
      usedKeys.add(blueprint.key)
      if (selections.length === totalPairs) {
        break
      }
    }
    if (
      selections.length < totalPairs &&
      current === theme &&
      config.fallbackThemes
    ) {
      queue.push(...config.fallbackThemes)
    }
  }

  return selections
}

function buildDeck(totalPairs: number, theme: Theme): CardModel[] {
  const picks = pickBlueprints(theme, totalPairs)
  const config = THEME_CONFIG[theme]
  const back = config.back

  const cards = picks.flatMap((blueprint, index) => {
    const pairId = `pair-${index}-${blueprint.key}`
    const front = blueprint.front
    return [
      {
        id: `${pairId}-a`,
        pairId,
        front: cloneArtwork(front),
        back: cloneArtwork(back),
        theme,
        status: 'hidden' as CardStatus,
      },
      {
        id: `${pairId}-b`,
        pairId,
        front: cloneArtwork(front),
        back: cloneArtwork(back),
        theme,
        status: 'hidden' as CardStatus,
      },
    ]
  })

  return shuffle(cards)
}

function loadPersistedSession(): PersistedSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as PersistedSession
    const config = DIFFICULTY_SETTINGS[parsed.difficulty]
    if (!config) {
      return null
    }
    if (!parsed.theme || !THEME_CONFIG[parsed.theme]) {
      return null
    }
    return parsed
  } catch (error) {
    console.warn('セッション読み込みでエラー発生', error)
    return null
  }
}

export function useGameEngine() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>(
    LAST_DIFFICULTY_KEY,
    'easy',
  )
  const [theme, setTheme] = useLocalStorage<Theme>(LAST_THEME_KEY, 'emoji')
  const config = useMemo(() => DIFFICULTY_SETTINGS[difficulty], [difficulty])

  const [cards, setCards] = useState<CardModel[]>(() =>
    buildDeck(config.totalPairs, theme),
  )
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<GameStatus>('ready')
  const [isResolving, setIsResolving] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [isHintPreviewing, setIsHintPreviewing] = useState(false)
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(
    config.timeLimitMs,
  )
  const [pendingSession, setPendingSession] = useState<PersistedSession | null>(
    () => loadPersistedSession(),
  )

  const [bestScores, setBestScores] = useLocalStorage<
    Record<Difficulty, number>
  >(HIGH_SCORE_KEY, {
    easy: 0,
    normal: 0,
    hard: 0,
  })
  const bestScore = bestScores[difficulty] ?? 0
  const [hasNewBest, setHasNewBest] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mismatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreRef = useRef(score)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearMismatchTimeout = useCallback(() => {
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current)
      mismatchTimeoutRef.current = null
    }
  }, [])

  const clearHintTimeout = useCallback(() => {
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
  }, [])

  const persistSession = useCallback(
    (payload: PersistedSession | null) => {
      if (typeof window === 'undefined') {
        return
      }
      if (payload === null) {
        window.localStorage.removeItem(SESSION_KEY)
        setPendingSession(null)
        return
      }
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      setPendingSession(payload)
    },
    [],
  )

  const finalizeGame = useCallback(
    (didComplete: boolean, finalScore: number) => {
      clearTimer()
      clearMismatchTimeout()
      clearHintTimeout()
      setIsResolving(false)
      setIsHintPreviewing(false)
      setStatus('finished')
      setFlippedIds([])
      persistSession(null)

      if (!didComplete) {
        setHasNewBest(false)
        return
      }

      setBestScores((prev) => {
        const next = { ...prev }
        const currentBest = next[difficulty] ?? 0
        if (finalScore > currentBest) {
          next[difficulty] = finalScore
          setHasNewBest(true)
        } else {
          setHasNewBest(false)
        }
        return next
      })
    },
    [
      clearHintTimeout,
      clearMismatchTimeout,
      clearTimer,
      difficulty,
      persistSession,
      setBestScores,
    ],
  )

  const startNewRound = useCallback(
    (nextDifficulty: Difficulty = difficulty, nextTheme: Theme = theme) => {
      const nextConfig = DIFFICULTY_SETTINGS[nextDifficulty]
      clearTimer()
      clearMismatchTimeout()
      clearHintTimeout()

      setDifficulty(nextDifficulty)
      setTheme(nextTheme)
      setCards(buildDeck(nextConfig.totalPairs, nextTheme))
      setFlippedIds([])
      setMatchedPairs(0)
      setScore(0)
      setStatus('ready')
      setIsResolving(false)
      setHintUsed(false)
      setIsHintPreviewing(false)
      setRemainingTimeMs(nextConfig.timeLimitMs)
      setHasNewBest(false)
      persistSession(null)
    },
    [
      clearHintTimeout,
      clearMismatchTimeout,
      clearTimer,
      difficulty,
      persistSession,
      setDifficulty,
      setTheme,
      theme,
    ],
  )

  useEffect(() => {
    return () => {
      clearTimer()
      clearMismatchTimeout()
      clearHintTimeout()
    }
  }, [clearHintTimeout, clearMismatchTimeout, clearTimer])

  useEffect(() => {
    if (status !== 'running' || config.timeLimitMs === null) {
      clearTimer()
      return
    }
    if (timerRef.current) {
      return
    }
    timerRef.current = setInterval(() => {
      setRemainingTimeMs((prev) => {
        if (prev === null) {
          return prev
        }
        const next = Math.max(0, prev - 1000)
        if (next === 0) {
          clearTimer()
          finalizeGame(false, scoreRef.current)
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      clearTimer()
    }
  }, [clearTimer, config.timeLimitMs, finalizeGame, status])

  const totalPairs = config.totalPairs

  useEffect(() => {
    if (flippedIds.length !== 2) {
      return
    }

    const [firstId, secondId] = flippedIds
    const firstCard = cards.find((card) => card.id === firstId)
    const secondCard = cards.find((card) => card.id === secondId)
    if (!firstCard || !secondCard) {
      return
    }

    if (firstCard.pairId === secondCard.pairId) {
      const nextScore = score + MATCH_REWARD
      setCards((prev) =>
        prev.map((card) =>
          card.id === firstId || card.id === secondId
            ? { ...card, status: 'matched' }
            : card,
        ),
      )
      setScore(nextScore)
      setMatchedPairs((prev) => {
        const next = prev + 1
        if (next === totalPairs) {
          finalizeGame(true, nextScore)
        }
        return next
      })
      setFlippedIds([])
    } else {
      setIsResolving(true)
      mismatchTimeoutRef.current = setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, status: 'hidden' }
              : card,
          ),
        )
        setScore((prev) => Math.max(0, prev - MISMATCH_PENALTY))
        setFlippedIds([])
        setIsResolving(false)
      }, MISMATCH_HIDE_MS)
    }
  }, [cards, finalizeGame, flippedIds, score, totalPairs])

  useEffect(() => {
    if (status === 'finished') {
      return
    }
    const shouldPersist =
      status === 'running' ||
      matchedPairs > 0 ||
      flippedIds.length > 0 ||
      (remainingTimeMs !== config.timeLimitMs && remainingTimeMs !== null)

    if (!shouldPersist) {
      return
    }

    persistSession({
      difficulty,
      theme,
      cards,
      flippedIds,
      matchedPairs,
      score,
      remainingTimeMs,
      hintUsed,
      status,
      savedAt: Date.now(),
    })
  }, [
    cards,
    config.timeLimitMs,
    difficulty,
    flippedIds,
    hintUsed,
    matchedPairs,
    persistSession,
    remainingTimeMs,
    score,
    status,
    theme,
  ])

  const flipCard = useCallback(
    (cardId: string) => {
      if (status === 'finished' || isResolving || isHintPreviewing) {
        return
      }

      if (flippedIds.length === 2) {
        return
      }

      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) {
            return card
          }
          if (card.status !== 'hidden') {
            return card
          }
          return { ...card, status: 'flipped' }
        }),
      )

      setFlippedIds((prev) => {
        if (prev.includes(cardId)) {
          return prev
        }
        return [...prev, cardId]
      })

      if (status === 'ready') {
        setStatus('running')
        if (config.timeLimitMs !== null && remainingTimeMs === config.timeLimitMs) {
          setRemainingTimeMs(config.timeLimitMs)
        }
      }
    },
    [config.timeLimitMs, flippedIds.length, isHintPreviewing, isResolving, remainingTimeMs, status],
  )

  const useHint = useCallback(() => {
    if (!config.hintAvailable || hintUsed || status !== 'running') {
      return
    }
    setHintUsed(true)
    setIsHintPreviewing(true)
    clearHintTimeout()
    hintTimeoutRef.current = setTimeout(() => {
      setIsHintPreviewing(false)
    }, HINT_REVEAL_MS)
  }, [clearHintTimeout, config.hintAvailable, hintUsed, status])

  const restart = useCallback(() => {
    startNewRound(difficulty, theme)
  }, [difficulty, startNewRound, theme])

  const changeDifficulty = useCallback(
    (nextDifficulty: Difficulty) => {
      if (nextDifficulty === difficulty) {
        restart()
        return
      }
      startNewRound(nextDifficulty, theme)
    },
    [difficulty, restart, startNewRound, theme],
  )

  const changeTheme = useCallback(
    (nextTheme: Theme) => {
      if (nextTheme === theme) {
        restart()
        return
      }
      startNewRound(difficulty, nextTheme)
    },
    [difficulty, restart, startNewRound, theme],
  )

  const resumeSession = useCallback(() => {
    if (!pendingSession) {
      return
    }

    const session = pendingSession
    setDifficulty(session.difficulty)
    setTheme(session.theme)
    const sessionConfig = DIFFICULTY_SETTINGS[session.difficulty]

    clearTimer()
    clearMismatchTimeout()
    clearHintTimeout()

    setCards(session.cards)
    setFlippedIds(session.flippedIds)
    setMatchedPairs(session.matchedPairs)
    setScore(session.score)
    setStatus(session.status === 'finished' ? 'ready' : session.status)
    setIsResolving(false)
    setHintUsed(session.hintUsed)
    setIsHintPreviewing(false)
    setRemainingTimeMs(
      session.remainingTimeMs ?? sessionConfig.timeLimitMs ?? null,
    )
    setHasNewBest(false)

    persistSession(null)
  }, [
    clearHintTimeout,
    clearMismatchTimeout,
    clearTimer,
    pendingSession,
    persistSession,
    setDifficulty,
    setTheme,
  ])

  const resetProgress = useCallback(() => {
    setBestScores({ easy: 0, normal: 0, hard: 0 })
    persistSession(null)
    setHasNewBest(false)
  }, [persistSession, setBestScores])

  const discardSession = useCallback(() => {
    persistSession(null)
  }, [persistSession])

  const pendingSessionMeta = useMemo(() => {
    if (!pendingSession) {
      return null
    }
    return {
      difficulty: pendingSession.difficulty,
      theme: pendingSession.theme,
      savedAt: pendingSession.savedAt,
      score: pendingSession.score,
      matchedPairs: pendingSession.matchedPairs,
      remainingTimeMs: pendingSession.remainingTimeMs,
      totalPairs: Math.floor(pendingSession.cards.length / 2),
    }
  }, [pendingSession])

  const snapshot: GameEngineSnapshot = {
    cards,
    score,
    matchedPairs,
    totalPairs,
    status,
    isResolving,
    remainingTimeMs,
    difficulty,
    theme,
    hintAvailable: config.hintAvailable,
    hintUsed,
    isHintPreviewing,
    resumeAvailable: pendingSession !== null,
  }

  return {
    ...snapshot,
    bestScore,
    bestScores,
    hasNewBest,
    pendingSession: pendingSessionMeta,
    themes: THEME_ORDER,
    flipCard,
    restart,
    changeDifficulty,
    changeTheme,
    useHint,
    startNewRound,
    resumeSession,
    resetProgress,
    discardSession,
  }
}
