import type { CardModel } from '../hooks/useGameEngine'

type MemoryCardProps = {
  card: CardModel
  onFlip: (cardId: string) => void
  disabled?: boolean
  revealFront?: boolean
}

export function MemoryCard({
  card,
  onFlip,
  disabled = false,
  revealFront = false,
}: MemoryCardProps) {
  const isFaceUp = card.status !== 'hidden' || revealFront
  const isMatched = card.status === 'matched'

  return (
    <button
      type="button"
      className="group relative h-28 w-full max-w-[120px] cursor-pointer rounded-xl border-2 border-sky-200 bg-transparent p-0 transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-80 sm:h-32"
      onClick={() => onFlip(card.id)}
      disabled={
        disabled ||
        isMatched ||
        (card.status !== 'hidden' && !revealFront)
      }
      aria-pressed={isFaceUp}
      aria-label={isFaceUp ? '表面のカード' : 'カードをめくる'}
    >
      <div
        className={`relative h-full w-full transition-transform duration-300 [transform-style:preserve-3d] group-hover:scale-[1.03] ${
          revealFront ? 'pointer-events-none' : ''
        }`}
        style={{
          transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-sky-600 text-3xl text-sky-50 shadow-lg [backface-visibility:hidden]">
          🎴
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-white text-4xl shadow-lg transition-opacity duration-300 [backface-visibility:hidden]"
          style={{ transform: 'rotateY(180deg)', opacity: isMatched ? 0.75 : 1 }}
        >
          <span aria-hidden>{card.icon}</span>
        </div>
      </div>
    </button>
  )
}
