type ScoreModalProps = {
  open: boolean
  score: number
  bestScore: number
  isBestUpdated: boolean
  onRestart: () => void
  onClose: () => void
}

export function ScoreModal({
  open,
  score,
  bestScore,
  isBestUpdated,
  onRestart,
  onClose,
}: ScoreModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800">
          やったね！全部そろったよ
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          今回のスコアは{' '}
          <span className="text-lg font-semibold text-sky-600">{score}</span>
          点やで。
        </p>

        <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
          <p>
            ベストスコア:{' '}
            <span className="font-semibold text-sky-600">{bestScore}</span>
            点
          </p>
          {isBestUpdated ? (
            <p className="mt-1 text-sky-700">最高記録更新！キラキラのお祝いや！</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
          >
            もう一回あそぶ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  )
}

