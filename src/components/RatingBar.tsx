import { useEffect, useState } from 'react'
import { RATING_TAGS, getRating, saveRating } from '../engine/rating'

type RatingBarProps = {
  designId: string
}

export function RatingBar({ designId }: RatingBarProps) {
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    const existing = getRating(designId)
    setStars(existing?.stars ?? 0)
    setTags(existing?.tags ?? [])
  }, [designId])

  function persist(nextStars: number, nextTags: string[]) {
    setStars(nextStars)
    setTags(nextTags)
    if (nextStars > 0) {
      saveRating({ designId, stars: nextStars, tags: nextTags, at: Date.now() })
    }
  }

  return (
    <div className="rating">
      <p className="eyebrow">Değerlendir</p>
      <div className="rating__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= stars ? 'is-on' : ''}
            onClick={() => persist(n, tags)}
            aria-label={`${n} yıldız`}
          >
            {n <= stars ? '●' : '○'}
          </button>
        ))}
      </div>
      <div className="rating__tags">
        {RATING_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={tags.includes(tag) ? 'is-on' : ''}
            onClick={() => {
              const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
              persist(stars || 1, next)
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
