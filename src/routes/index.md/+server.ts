import { archiveMarkdown } from '$lib/server/markdown'

export const prerender = true

export const GET = () =>
  new Response(archiveMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
