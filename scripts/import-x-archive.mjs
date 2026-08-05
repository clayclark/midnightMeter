import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ids = JSON.parse(await readFile(path.join(ROOT, 'data/archive-post-ids.json'), 'utf8'))
const overrides = JSON.parse(await readFile(path.join(ROOT, 'data/archive-overrides.json'), 'utf8'))

const CORE_HOSTS = ['van', 'charles', 'jomi', 'steve']
const DISPLAY_NAMES = {
  van: 'Van',
  charles: 'Charles',
  jomi: 'Jomi',
  steve: 'Steve',
  joanna: 'Joanna',
  kerm: 'Kerm',
  sean: 'Sean',
}

function stripHtml(html) {
  const body = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''
  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('\u00a0', ' ')
    .trim()
}

function pacificDateFromSnowflake(id) {
  const ms = Number((BigInt(id) >> 22n) + 1288834974657n)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ms)
  const pick = (type) => parts.find((part) => part.type === type)?.value
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

function finalScore(line, name) {
  const escapedName = DISPLAY_NAMES[name]
  const match = line.match(new RegExp(`^${escapedName}\\*?:?\\s+(-?\\d+(?:\\.\\d+)?)(?:\\s*(?:—>|->)\\s*(-?\\d+(?:\\.\\d+)?))?`, 'i'))
  if (!match) return null
  return Number(match[2] ?? match[1])
}

function parsePost(id, html) {
  const rawText = stripHtml(html)
  const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean)
  const scores = Object.fromEntries(CORE_HOSTS.map((host) => [host, null]))
  const guests = []

  for (const line of lines) {
    for (const host of CORE_HOSTS) {
      if (scores[host] === null) scores[host] = finalScore(line, host)
    }
    for (const guest of ['joanna', 'kerm', 'sean']) {
      const score = finalScore(line, guest)
      if (score !== null && !guests.some((item) => item.name === DISPLAY_NAMES[guest])) {
        guests.push({ name: DISPLAY_NAMES[guest], score })
      }
    }
  }

  if (id === '1570479466769711106') scores.van = 11
  const hasRating = Object.values(scores).some((score) => score !== null) || guests.length > 0
  if (!hasRating) return null

  const title = lines[0]
    .replace(/@(?:VanLathan|charlesxholmes|JomiAdeniran|steveahlman).*$/, '')
    .trim()

  const override = overrides[id] ?? {}
  return {
    id,
    title: override.title ?? title,
    ratedAt: pacificDateFromSnowflake(id),
    scores: { ...scores, ...(override.scores ?? {}) },
    guests,
    rawText,
    archiveUrl: `https://x.com/MidnightMeter/status/${id}`,
    note: override.note ?? null,
  }
}

async function fetchPost(id) {
  const url = new URL('https://publish.x.com/oembed')
  url.searchParams.set('url', `https://x.com/MidnightMeter/status/${id}`)
  url.searchParams.set('omit_script', '1')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`oEmbed request failed for ${id}: ${response.status}`)
  const payload = await response.json()
  return parsePost(id, payload.html)
}

const imported = (await Promise.all(ids.map(fetchPost))).filter(Boolean)
const archive = [...imported, ...overrides.manualEntries].sort((a, b) => {
  const byDate = b.ratedAt.localeCompare(a.ratedAt)
  return byDate || b.id.localeCompare(a.id)
})

await writeFile(
  path.join(ROOT, 'data/archive-ratings.json'),
  `${JSON.stringify(archive, null, 2)}\n`,
)

console.log(`Imported ${archive.length} rating entries into data/archive-ratings.json`)
