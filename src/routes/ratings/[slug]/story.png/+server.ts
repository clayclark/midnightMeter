import { error } from '@sveltejs/kit'
import { ORIGINAL_RATINGS } from '$lib/data'
import { renderStoryCard } from '$lib/server/rating-card'
import { getRatingBySlug, ratingSlug } from '$lib/share'
import type { RequestHandler } from './$types'

export const prerender = true
export const entries = () => ORIGINAL_RATINGS.map((rating) => ({ slug: ratingSlug(rating) }))

export const GET: RequestHandler = async ({ params }) => {
  const rating = getRatingBySlug(params.slug)
  if (!rating) error(404, 'Rating not found')
  const png = await renderStoryCard(rating, false)
  const body = new ArrayBuffer(png.byteLength)
  new Uint8Array(body).set(png)
  return new Response(body, {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' },
  })
}
