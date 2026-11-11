import type { RequestHandler } from './$types'
import { MULLIGAN_BY_ID, ORIGINAL_RATINGS } from '$lib/data'
import { ratingSlug } from '$lib/share'

export const GET: RequestHandler = ({ url }) => {
  const ratings = ORIGINAL_RATINGS.map((rating) => {
    const revisedAt = MULLIGAN_BY_ID.get(rating.id)?.revisedAt
    return {
      path: `/ratings/${ratingSlug(rating)}`,
      lastmod: revisedAt && revisedAt > rating.ratedAt ? revisedAt : rating.ratedAt,
    }
  })
  const newest = ratings.map((r) => r.lastmod).toSorted().at(-1)
  const urls = [{ path: '/', lastmod: newest }, ...ratings]
  const body = urls
    .map(({ path, lastmod }) => `  <url><loc>${url.origin}${path}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  )
}
