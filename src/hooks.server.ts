import type { Handle } from '@sveltejs/kit'
import { archiveMarkdown } from '$lib/server/markdown'

const MARKDOWN_LINK = '</index.md>; rel="alternate"; type="text/markdown", </index.md>; rel="describedby"; type="text/markdown"'

/** q-value the Accept header gives an exact media type (0 when absent). */
function quality(accept: string, type: string): number {
  for (const part of accept.split(',')) {
    const [range, ...params] = part.split(';').map((piece) => piece.trim())
    if (range !== type) continue
    const q = params.find((param) => param.startsWith('q='))
    return q ? Number(q.slice(2)) || 0 : 1
  }
  return 0
}

/* Markdown only when the client names it and doesn't rank HTML higher.
   Browsers never name text/markdown, so they always get the page. */
function wantsMarkdown(accept: string): boolean {
  const markdown = quality(accept, 'text/markdown')
  return markdown > 0 && markdown >= quality(accept, 'text/html')
}

export const handle: Handle = async ({ event, resolve }) => {
  // __data.json requests also arrive with pathname '/'
  if (event.url.pathname !== '/' || event.isDataRequest) return resolve(event)

  if (wantsMarkdown(event.request.headers.get('accept') ?? '')) {
    return new Response(archiveMarkdown(), {
      headers: { 'content-type': 'text/markdown; charset=utf-8', vary: 'Accept' },
    })
  }

  const response = await resolve(event)
  response.headers.append('link', MARKDOWN_LINK)
  response.headers.append('vary', 'Accept')
  return response
}
