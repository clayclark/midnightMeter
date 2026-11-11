import { archiveMarkdown } from '$lib/server/markdown'

/* Served by the function rather than prerendered, so the content type is
   this header and not whatever the CDN infers from the extension. */
export const GET = () =>
  new Response(archiveMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
