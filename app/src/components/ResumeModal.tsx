import type { Difficulty, Theme } from '../hooks/useGameEngine'
import { THEME_LABEL } from '../hooks/useGameEngine'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
}

type ResumeModalProps = {
  open: boolean
  onResume: () => void
  onDiscard: () => void
  onClose: () => void
  savedAt?: number | null
  score?: number
  matchedPairs?: number
  totalPairs: number
  remainingTimeMs?: number | null
  difficulty: Difficulty
  theme: Theme
}

function formatDate(timestamp?: number | null) {
  if (!timestamp) {
    return '日時は不明や'
  }
  const date = new Date(timestamp)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date
    .toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    .replace(':', '時')}分`
}

function formatTime(ms: number | null | undefined) {
  if (ms === null || ms === undefined) {
    return '∞'
  }
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ResumeModal({
  open,
  onResume,
  onDiscard,
  onClose,
  savedAt,
  score,
  matchedPairs,
  totalPairs,
  remainingTimeMs,
  difficulty,
  theme,
}: ResumeModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
            Resume
          </p>
          <h2 className="text-2xl font-bold text-slate-800">
            つづきから遊ぶ？
          </h2>
          <p className="text-sm text-slate-600">
            前にプレイしたデータがあるで。途中から再開するか、新しく始めるか選んでな。
          </p>
        </header>

        <section className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
          <dl className="grid grid-cols-2 gap-y-2">
            <Detail label="難易度" value={DIFFICULTY_LABEL[difficulty]} />
            <Detail label="テーマ" value={THEME_LABEL[theme]} />
            <Detail label="保存時刻" value={formatDate(savedAt)} />
            <Detail label="スコア" value={`${score ?? 0} 点`} />
            <Detail label="そろえたペア" value={`${matchedPairs ?? 0} / ${totalPairs}`} />
            <Detail label="残り時間" value={formatTime(remainingTimeMs)} />
          </dl>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onResume()
              onClose()
            }}
            className="flex-1 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
          >
            つづきから再開
          </button>
          <button
            type="button"
            onClick={() => {
              onDiscard()
              onClose()
            }}
            className="flex-1 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
          >
            最初から
          </button>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  )
}
