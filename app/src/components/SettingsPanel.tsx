import type { Difficulty } from '../hooks/useGameEngine'
import type { SoundSettings } from '../hooks/useSound'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
}

type SettingsPanelProps = {
  open: boolean
  onClose: () => void
  difficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
  bestScores: Record<Difficulty, number>
  onResetProgress: () => void
  soundSettings: SoundSettings
  onToggleSfx: (enabled: boolean) => void
  onToggleBgm: (enabled: boolean) => void
}

export function SettingsPanel({
  open,
  onClose,
  difficulty,
  onSelectDifficulty,
  bestScores,
  onResetProgress,
  soundSettings,
  onToggleSfx,
  onToggleBgm,
}: SettingsPanelProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            とじる
          </button>
        </div>

        <section className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">難易度</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((mode) => {
              const isActive = mode === difficulty
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectDifficulty(mode)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${
                    isActive
                      ? 'border-sky-400 bg-sky-100 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{DIFFICULTY_LABEL[mode]}</span>
                    <span className="text-xs text-slate-400">
                      ベスト {bestScores[mode] ?? 0}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">サウンド</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-600">効果音</span>
              <input
                type="checkbox"
                checked={soundSettings.sfx}
                onChange={(event) => onToggleSfx(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-600">BGM</span>
              <input
                type="checkbox"
                checked={soundSettings.bgm}
                onChange={(event) => onToggleBgm(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
              />
            </label>
            <p className="text-xs text-slate-400">
              初回の操作後にBGMが流れます。端末の音量に気をつけて楽しんでください。
            </p>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">進捗リセット</h3>
          <p className="text-xs text-slate-500">
            ベストスコアと続きからプレイするデータを削除します。やり直したいときに使ってください。
          </p>
          <button
            type="button"
            onClick={onResetProgress}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
          >
            進捗をリセット
          </button>
        </section>
      </div>
    </div>
  )
}
