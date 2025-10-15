import { useEffect, useState } from 'react'
import type { Difficulty } from '../hooks/useGameEngine'
import { sampleFrontCards, sampleCardBack } from '../data/sampleCards'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
}

type HowToPlayModalProps = {
  open: boolean
  onClose: () => void
  difficulty: Difficulty
}

const steps = [
  {
    icon: '👀',
    title: 'カードをよく観察',
    description:
      '同じ絵柄を見つけるために、めくったカードの場所を覚えよう。',
  },
  {
    icon: '🃏',
    title: '2枚めくってチャレンジ',
    description:
      'カードは1度に2枚まで。絵柄が同じならキラキラ演出でゲット！',
  },
  {
    icon: '⏱️',
    title: 'タイムとヒント',
    description:
      '難易度によって制限時間やヒントの回数が変わるよ。ヒントはやさしいモードで1回だけ。',
  },
  {
    icon: '🏆',
    title: '最高スコアを狙え！',
    description:
      'ミスを減らしてタイムを残すほど高得点。記録は端末に自動保存されるで。',
  },
]

export function HowToPlayModal({ open, onClose, difficulty }: HowToPlayModalProps) {
  if (!open) {
    return null
  }

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sampleFrontCards.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  const currentCard = sampleFrontCards[activeIndex]
  const partnerCard = sampleFrontCards[(activeIndex + 1) % sampleFrontCards.length]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-sky-500/10 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
            How to Play
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            きらめきメモリーカードの遊び方
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            ゲームの基本とコツをサクッとチェックしよか。今は「{DIFFICULTY_LABEL[difficulty]}」モードで遊べるで。
          </p>
        </header>

        <div className="space-y-4 px-6 py-5">
          <PreviewDemo
            backAsset={sampleCardBack}
            currentCard={currentCard}
            partnerCard={partnerCard}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />

          {steps.map((step) => (
            <article
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-2xl">
                <span aria-hidden>{step.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-700">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="flex flex-col gap-3 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
          >
            はじめる
          </button>
        </footer>
      </div>
    </div>
  )
}

type PreviewDemoProps = {
  backAsset: string
  currentCard: { id: string; title: string; description: string; asset: string }
  partnerCard: { id: string; title: string; description: string; asset: string }
  activeIndex: number
  onSelect: (index: number) => void
}

function PreviewDemo({
  backAsset,
  currentCard,
  partnerCard,
  activeIndex,
  onSelect,
}: PreviewDemoProps) {
  return (
    <section className="rounded-2xl border border-sky-100 bg-white/60 p-4">
      <h3 className="text-sm font-semibold text-sky-700">カードの動きを見てみよう</h3>
      <p className="mt-2 text-xs text-slate-500">
        左のカードは自動でくるっとひっくり返る実演。右側は同じカードを揃えたときのイメージやで。
      </p>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-28 w-20" style={{ perspective: '900px' }} aria-hidden>
            <div className="demo-flip-card relative h-full w-full">
              <div className="demo-card-face demo-card-face--back border-sky-300">
                <img
                  src={backAsset}
                  alt="カードの裏面サンプル"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="demo-card-face demo-card-face--front border-amber-200">
                <img
                  src={currentCard.asset}
                  alt="カードの表面サンプル"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">めくると…</p>
            <p className="text-xs text-slate-500">{currentCard.title}カードが登場！</p>
          </div>
        </div>

        <span className="hidden text-2xl text-slate-400 sm:block" aria-hidden>
          ⟶
        </span>

        <div className="flex items-center gap-3">
          <MatchedCard asset={currentCard.asset} celebrate />
          <MatchedCard asset={partnerCard.asset} />
          <span className="text-sm font-semibold text-emerald-600">そろった！</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          サンプルカード
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {sampleFrontCards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${
                activeIndex === index
                  ? 'border-sky-400 bg-sky-50'
                  : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/60'
              }`}
            >
              <div className="h-16 w-12 overflow-hidden rounded-xl border border-slate-200">
                <img src={card.asset} alt={`${card.title}カード`} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{card.title}</p>
                <p className="text-[11px] text-slate-500">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function MatchedCard({ asset, celebrate = false }: { asset: string; celebrate?: boolean }) {
  return (
    <div
      className={`h-28 w-20 overflow-hidden rounded-2xl border-2 border-emerald-300 bg-white shadow-[0_18px_24px_-16px_rgba(16,185,129,0.8)] ${
        celebrate ? 'animate-demo-celebrate' : ''
      }`}
      aria-hidden
    >
      <img
        src={asset}
        alt="カードの表面サンプル"
        className="h-full w-full object-cover"
      />
    </div>
  )
}
