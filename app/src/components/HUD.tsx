import type { Difficulty } from '../hooks/useGameEngine'

type HUDProps = {
  score: number
  matchedPairs: number
  totalPairs: number
  bestScore: number
  bestScores: Record<Difficulty, number>
  remainingTimeMs: number | null
  difficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
  hintAvailable: boolean
  hintUsed: boolean
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
}

function formatTime(ms: number | null) {
  if (ms === null) {
    return '∞'
  }
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function HUD({
  score,
  matchedPairs,
  totalPairs,
  bestScore,
  bestScores,
  remainingTimeMs,
  difficulty,
  onSelectDifficulty,
  hintAvailable,
  hintUsed,
}: HUDProps) {
  return (
    <section
      className="flex w-full flex-col gap-4 rounded-2xl bg-white/90 p-4 shadow-md ring-1 ring-sky-100"
      aria-label="ゲーム情報"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm sm:text-base">
        <Stat label="スコア" value={score} highlight />
        <Stat label="ベスト" value={bestScore} />
        <Stat label="ペア" value={`${matchedPairs}/${totalPairs}`} />
        <Stat label="タイム" value={formatTime(remainingTimeMs)} />
        <Stat
          label="ヒント"
          value={hintAvailable ? (hintUsed ? '使用済' : '1回だけ') : 'なし'}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          なんどもチャレンジ
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((mode) => {
            const label = DIFFICULTY_LABEL[mode]
            const personalBest = bestScores[mode] ?? 0
            const isActive = mode === difficulty
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onSelectDifficulty(mode)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${
                  isActive
                    ? 'border-sky-400 bg-sky-100 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{label}</span>
                <span className="text-xs font-medium text-slate-400">
                  ベスト {personalBest}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type StatProps = {
  label: string
  value: number | string
  highlight?: boolean
}

function Stat({ label, value, highlight = false }: StatProps) {
  return (
    <div className="flex flex-col items-center text-slate-700">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span
        className={`font-bold ${
          highlight ? 'text-2xl text-sky-600' : 'text-lg text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
