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
  const borderClass = card.theme === 'storybook' ? 'border-amber-200' : 'border-sky-200'
  const backgroundClass =
    card.theme === 'storybook' ? 'bg-white/70' : 'bg-transparent'
  const ariaLabel = isFaceUp ? card.front.label : 'カードをめくる'

  const faceBaseClass =
    'absolute inset-0 overflow-hidden rounded-xl shadow-lg [backface-visibility:hidden]'
  const backFaceClass =
    card.back.kind === 'emoji'
      ? `${faceBaseClass} flex items-center justify-center bg-sky-600 text-3xl text-sky-50`
      : `${faceBaseClass} border ${
          card.theme === 'storybook' ? 'border-amber-200' : 'border-slate-200'
        } bg-white`
  const frontFaceClass =
    card.front.kind === 'emoji'
      ? `${faceBaseClass} flex items-center justify-center bg-white text-4xl transition-opacity duration-300`
      : `${faceBaseClass} border ${
          card.theme === 'storybook' ? 'border-amber-200' : 'border-slate-200'
        } bg-white transition-opacity duration-300`

  return (
    <button
      type="button"
      className={`group relative h-28 w-full max-w-[120px] cursor-pointer rounded-xl border-2 ${borderClass} ${backgroundClass} p-0 transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-80 sm:h-32`}
      onClick={() => onFlip(card.id)}
      disabled={
        disabled ||
        isMatched ||
        (card.status !== 'hidden' && !revealFront)
      }
      aria-pressed={isFaceUp}
      aria-label={ariaLabel}
    >
      <div
        className={`relative h-full w-full transition-transform duration-300 [transform-style:preserve-3d] group-hover:scale-[1.03] ${
          revealFront ? 'pointer-events-none' : ''
        }`}
        style={{
          transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div className={backFaceClass}>
          {card.back.kind === 'emoji' ? (
            <>
              <span aria-hidden>{card.back.value}</span>
              <span className="sr-only">{card.back.label}</span>
            </>
          ) : (
            <img
              src={card.back.src}
              alt={card.back.alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
        </div>

        <div
          className={frontFaceClass}
          style={{ transform: 'rotateY(180deg)', opacity: isMatched ? 0.75 : 1 }}
        >
          {card.front.kind === 'emoji' ? (
            <>
              <span aria-hidden>{card.front.value}</span>
              <span className="sr-only">{card.front.label}</span>
            </>
          ) : (
            <img
              src={card.front.src}
              alt={card.front.alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
        </div>
      </div>
    </button>
  )
}
