import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) =>
  new Response(
    `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /

Sitemap: ${url.origin}/sitemap.xml
`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  )
