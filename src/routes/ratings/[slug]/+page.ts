import { error } from '@sveltejs/kit'
import { getRatingBySlug } from '$lib/share'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const rating = getRatingBySlug(params.slug)
  if (!rating) error(404, 'Rating not found')
  return { rating }
}
