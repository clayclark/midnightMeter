import type { RequestHandler } from './$types'
import { ORIGINAL_RATINGS } from '$lib/data'

export const GET: RequestHandler = ({ url }) => {
  const urls = [{ path: '/', lastmod: ORIGINAL_RATINGS[0].ratedAt }]
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
