import archiveRatings from '../../data/archive-ratings.json'
import manualRatings from '../../data/manual-ratings.json'
import mulliganData from '../../data/mulligans.json'
import type {
  ArchiveModel, ArchiveSummary, FormatFilter, HostKey, HostStats, Mulligan, Rating,
} from './types'

export const HOSTS: ReadonlyArray<{
  key: HostKey
  name: string
  short: string
  initial: string
  avatar: string
}> = [
  { key: 'van', name: 'Van Lathan', short: 'Van', initial: 'V', avatar: '/avatars/van.jpg' },
  { key: 'charles', name: 'Charles Holmes', short: 'Charles', initial: 'C', avatar: '/avatars/charles.jpg' },
  { key: 'jomi', name: 'Jomi Adeniran', short: 'Jomi', initial: 'J', avatar: '/avatars/jomi.jpg' },
  { key: 'steve', name: 'Steve Ahlman', short: 'Steve', initial: 'S', avatar: '/avatars/steve.jpg' },
]

export const MAX_SCORE = 12

export const ORIGINAL_RATINGS = ([...archiveRatings, ...manualRatings] as Rating[]).toSorted(
  (a, b) => b.ratedAt.localeCompare(a.ratedAt),
)

export const MULLIGANS = mulliganData as Mulligan[]
export const MULLIGAN_BY_ID = new Map(MULLIGANS.map((mulligan) => [mulligan.ratingId, mulligan]))

const SERIES_TITLES = new Set([
  'AGATHA ALL ALONG', 'AHSOKA', 'ANDOR', 'BOOK OF BOBA FETT',
  'DAREDEVIL: BORN AGAIN', 'ECHO', 'IRONHEART', 'INVINCIBLE', 'LOKI', 'MOON KNIGHT',
  'OBI-WAN KENOBI', 'PEACEMAKER', 'SECRET INVASION', 'SHOGUN',
  'SKELETON CREW', 'TALES OF THE JEDI', 'THE ACOLYTE', 'THE LAST OF US',
  'THE BOYS', 'THE MANDALORIAN', 'THE PENGUIN', 'WHAT IF', 'WONDER MAN',
])

export function getFormat(title: string): Exclude<FormatFilter, 'all'> {
  const normalized = title.toUpperCase()
  if (normalized === 'THE MANDALORIAN AND GROGU') return 'film'
  if (/\bS(?:EASON)?\s*\d|ENTIRE SERIES|HALFWAY METER/.test(normalized)) return 'series'
  for (const seriesTitle of SERIES_TITLES) {
    if (normalized.startsWith(seriesTitle)) return 'series'
  }
  return 'film'
}

export function getScores(rating: Rating): number[] {
  return HOSTS.flatMap(({ key }) => {
    const score = rating.scores[key]
    return score === null ? [] : [score]
  })
}

export function getAverage(rating: Rating): number {
  const scores = getScores(rating)
  return scores.reduce((total, score) => total + score, 0) / scores.length
}

export function getSpread(rating: Rating): number {
  const scores = getScores(rating)
  return Math.max(...scores) - Math.min(...scores)
}

function applyMulligans(ratings: Rating[]): Rating[] {
  return ratings.map((rating) => {
    const mulligan = MULLIGAN_BY_ID.get(rating.id)
    if (!mulligan) return rating

    const scores = { ...rating.scores }
    for (const host of HOSTS) {
      const change = mulligan.changes[host.key]
      if (change) scores[host.key] = change.to
    }
    return { ...rating, scores }
  })
}

function scoresFor(host: HostKey, ratings: Rating[]): { rating: Rating; score: number }[] {
  return ratings.flatMap((rating) => {
    const score = rating.scores[host]
    return score === null ? [] : [{ rating, score }]
  })
}

export function getHostAverage(host: HostKey, ratings: Rating[] = ORIGINAL_RATINGS): number {
  const entries = scoresFor(host, ratings)
  return entries.reduce((total, entry) => total + entry.score, 0) / entries.length
}

export function getHostStats(host: HostKey, ratings: Rating[]): HostStats {
  const entries = scoresFor(host, ratings)
  const sorted = [...entries].toSorted((a, b) => b.score - a.score)
  const distribution = Array.from({ length: MAX_SCORE }, (_, index) =>
    entries.filter((entry) => entry.score === index + 1).length,
  )

  return {
    host,
    count: entries.length,
    average: entries.reduce((total, entry) => total + entry.score, 0) / entries.length,
    high: sorted[0],
    low: sorted[sorted.length - 1],
    perfect: entries.filter((entry) => entry.score >= 11).length,
    harsh: entries.filter((entry) => entry.score <= 4).length,
    distribution,
    peak: Math.max(...distribution),
  }
}

function buildModel(ratings: Rating[]): ArchiveModel {
  const hostStats = HOSTS.map((host) => getHostStats(host.key, ratings))
  const summary: ArchiveSummary = {
    total: ratings.length,
    hosts: HOSTS.length,
    gameChangers: ratings.filter((rating) => getAverage(rating) >= 11).length,
    films: ratings.filter((rating) => getFormat(rating.title) === 'film').length,
    series: ratings.filter((rating) => getFormat(rating.title) === 'series').length,
    average: ratings.reduce((total, rating) => total + getAverage(rating), 0) / ratings.length,
    firstYear: Number(ratings[ratings.length - 1].ratedAt.slice(0, 4)),
    lastYear: Number(ratings[0].ratedAt.slice(0, 4)),
    highest: ratings.toSorted((a, b) => getAverage(b) - getAverage(a))[0],
    lowest: ratings.toSorted((a, b) => getAverage(a) - getAverage(b))[0],
    mostDebated: ratings.toSorted((a, b) => getSpread(b) - getSpread(a))[0],
  }
  const rankById = new Map(
    ratings.toSorted((a, b) => getAverage(b) - getAverage(a))
      .map((rating, index) => [rating.id, index + 1]),
  )
  const careerAverage = new Map(hostStats.map((stats) => [stats.host, stats.average]))
  return { ratings, hostStats, summary, rankById, careerAverage }
}

export const ORIGINAL_MODEL = buildModel(ORIGINAL_RATINGS)
export const MULLIGAN_MODEL = buildModel(applyMulligans(ORIGINAL_RATINGS))

/** The adjusted archive remains the default for non-interactive consumers. */
export const RATINGS = MULLIGAN_MODEL.ratings
export const HOST_STATS = MULLIGAN_MODEL.hostStats
export const ARCHIVE_SUMMARY = MULLIGAN_MODEL.summary

export function getRank(rating: Rating, model: ArchiveModel = MULLIGAN_MODEL): number {
  return model.rankById.get(rating.id) ?? 0
}

export function getDelta(host: HostKey, score: number, model: ArchiveModel = MULLIGAN_MODEL): number {
  return score - (model.careerAverage.get(host) ?? 0)
}

/** Only expose podcast/video episode links in the UI, never X archive links. */
export function episodeSourceHref(rating: Rating): string | null {
  if (!rating.archiveUrl) return null

  try {
    const hostname = new URL(rating.archiveUrl).hostname.toLowerCase()
    if (hostname === 'x.com' || hostname.endsWith('.x.com')
      || hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) return null
    return rating.archiveUrl
  } catch {
    return null
  }
}

export function mulliganSourceHref(mulligan: Mulligan): string {
  if (!mulligan.timestamp || !mulligan.sourceUrl.includes('youtu')) return mulligan.sourceUrl
  const parts = mulligan.timestamp.split(':').map(Number)
  const seconds = parts.reduce((total, part) => total * 60 + part, 0)
  const joiner = mulligan.sourceUrl.includes('?') ? '&' : '?'
  return `${mulligan.sourceUrl}${joiner}t=${seconds}s`
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric',
  })
}
