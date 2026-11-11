import type { Handle } from '@sveltejs/kit'
import { archiveMarkdown } from '$lib/server/markdown'

const MARKDOWN_LINK = '</index.md>; rel="alternate"; type="text/markdown", </index.md>; rel="describedby"; type="text/markdown"'

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname !== '/') return resolve(event)

  if (event.request.headers.get('accept')?.includes('text/markdown')) {
    return new Response(archiveMarkdown(), {
      headers: { 'content-type': 'text/markdown; charset=utf-8', vary: 'Accept' },
    })
  }

  const response = await resolve(event)
  response.headers.append('link', MARKDOWN_LINK)
  response.headers.append('vary', 'Accept')
  return response
}
