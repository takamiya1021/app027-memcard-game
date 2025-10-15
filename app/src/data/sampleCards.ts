import cardFox from '../assets/sample-card-fox.svg'
import cardPenguin from '../assets/sample-card-penguin.svg'
import cardStrawberry from '../assets/sample-card-strawberry.svg'
import cardStar from '../assets/sample-card-star.svg'
import cardBack from '../assets/sample-card-back.svg'

export type SampleCard = {
  id: string
  title: string
  description: string
  asset: string
}

export const sampleFrontCards: SampleCard[] = [
  {
    id: 'fox',
    title: 'きつね',
    description: 'すばしっこいきつねカード。動物テーマのペアで大活躍や。',
    asset: cardFox,
  },
  {
    id: 'penguin',
    title: 'ペンギン',
    description: 'ひんやり南極からやってきたペンギンカード。',
    asset: cardPenguin,
  },
  {
    id: 'strawberry',
    title: 'いちご',
    description: 'あま〜いデザートの仲間。食べ物テーマにピッタリや。',
    asset: cardStrawberry,
  },
  {
    id: 'star',
    title: 'スター',
    description: '夜空にキラリと光るスターカード。スペシャル演出用にも使えるで。',
    asset: cardStar,
  },
]

export { cardBack as sampleCardBack }
