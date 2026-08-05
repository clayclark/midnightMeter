import {
  MULLIGAN_BY_ID, MULLIGAN_MODEL, ORIGINAL_RATINGS,
} from '$lib/data'
import type { Rating } from '$lib/types'

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const ratingBySlug = new Map(ORIGINAL_RATINGS.map((rating) => [slugify(rating.title), rating]))
const adjustedById = new Map(MULLIGAN_MODEL.ratings.map((rating) => [rating.id, rating]))

export const ratingSlug = (rating: Rating): string => slugify(rating.title)
export const getRatingBySlug = (slug: string): Rating | null => ratingBySlug.get(slug) ?? null
export const hasMulligan = (rating: Rating): boolean => MULLIGAN_BY_ID.has(rating.id)

export function ratingForView(rating: Rating, mulligan: boolean): Rating {
  return mulligan ? adjustedById.get(rating.id) ?? rating : rating
}

export function ratingCardPath(rating: Rating, mulligan: boolean): string {
  const base = `/ratings/${ratingSlug(rating)}`
  return `${mulligan && hasMulligan(rating) ? `${base}/mulligan` : base}/card.png?v=7`
}

/** Portrait 1080x1920 — what the share buttons hand over. */
export function ratingStoryPath(rating: Rating, mulligan: boolean): string {
  const base = `/ratings/${ratingSlug(rating)}`
  return `${mulligan && hasMulligan(rating) ? `${base}/mulligan` : base}/story.png?v=4`
}
