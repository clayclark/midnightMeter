export type HostKey = 'van' | 'charles' | 'jomi' | 'steve'

export type CoreScores = Record<HostKey, number | null>

export interface GuestScore {
  name: string
  score: number
}

export interface Rating {
  id: string
  title: string
  ratedAt: string
  scores: CoreScores
  guests: GuestScore[]
  rawText: string
  archiveUrl: string | null
  note: string | null
}

export interface ScoreChange {
  from: number | null
  to: number | null
}

export interface Mulligan {
  ratingId: string
  revisedAt: string
  sourceUrl: string
  sourceLabel: string
  timestamp: string | null
  changes: Partial<Record<HostKey, ScoreChange>>
  note: string | null
}

export interface HostStats {
  host: HostKey
  count: number
  average: number
  high: { rating: Rating; score: number }
  low: { rating: Rating; score: number }
  perfect: number
  harsh: number
  distribution: number[]
  peak: number
}

export interface ArchiveSummary {
  total: number
  hosts: number
  gameChangers: number
  films: number
  series: number
  average: number
  firstYear: number
  lastYear: number
  highest: Rating
  lowest: Rating
  mostDebated: Rating
}

export interface ArchiveModel {
  ratings: Rating[]
  hostStats: HostStats[]
  summary: ArchiveSummary
  rankById: Map<string, number>
  careerAverage: Map<HostKey, number>
}

export type SortMode = 'newest' | 'oldest' | 'highest' | 'lowest' | 'debated'
export type FormatFilter = 'all' | 'film' | 'series'
