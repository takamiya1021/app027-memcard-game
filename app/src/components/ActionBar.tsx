type ActionBarProps = {
  onRestart: () => void
  onHint: () => void
  onOpenSettings: () => void
  onResume?: () => void
  onShowHowTo: () => void
  canUseHint: boolean
  isResolving?: boolean
  isHintPreviewing?: boolean
  resumeAvailable?: boolean
}

export function ActionBar({
  onRestart,
  onHint,
  onOpenSettings,
  onResume = () => {},
  onShowHowTo,
  canUseHint,
  isResolving = false,
  isHintPreviewing = false,
  resumeAvailable = false,
}: ActionBarProps) {
  return (
    <div className="flex w-full flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onRestart}
        disabled={isResolving}
        className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        もう一度スタート
      </button>

      <button
        type="button"
        onClick={onHint}
        disabled={!canUseHint || isHintPreviewing || isResolving}
        className="rounded-full border border-sky-200 bg-white px-6 py-2 text-base font-semibold text-sky-600 shadow-sm transition hover:bg-sky-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        ヒント
      </button>

      <button
        type="button"
        onClick={onShowHowTo}
        className="rounded-full border border-amber-200 bg-amber-100 px-6 py-2 text-base font-semibold text-amber-700 shadow-sm transition hover:bg-amber-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
      >
        遊び方
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        className="rounded-full border border-slate-200 bg-white px-6 py-2 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
      >
        設定
      </button>

      {resumeAvailable ? (
        <button
          type="button"
          onClick={onResume}
          className="rounded-full border border-emerald-200 bg-emerald-500 px-6 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          続きから
        </button>
      ) : null}
    </div>
  )
}
