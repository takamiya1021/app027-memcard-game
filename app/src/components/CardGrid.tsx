import { MemoryCard } from './MemoryCard'
import type { CardModel } from '../hooks/useGameEngine'

type CardGridProps = {
  cards: CardModel[]
  onFlip: (cardId: string) => void
  disabled?: boolean
  revealFront?: boolean
}

export function CardGrid({
  cards,
  onFlip,
  disabled = false,
  revealFront = false,
}: CardGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          card={card}
          onFlip={onFlip}
          disabled={disabled}
          revealFront={revealFront}
        />
      ))}
    </div>
  )
}
