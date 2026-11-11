import {
  ARCHIVE_SUMMARY, HOSTS, MAX_SCORE, MULLIGAN_BY_ID, ORIGINAL_RATINGS,
  episodeSourceHref, getAverage, getHostAverage, RATINGS,
} from '$lib/data'
import { ratingSlug } from '$lib/share'
import type { Rating } from '$lib/types'

const cell = (value: string) => value.replaceAll('|', '\\|')
const fmt = (n: number) => n.toFixed(2)

const adjustedById = new Map(RATINGS.map((rating) => [rating.id, rating]))

function scoreCells(rating: Rating): string[] {
  const mulligan = MULLIGAN_BY_ID.get(rating.id)
  return HOSTS.map(({ key }) => {
    const original = rating.scores[key]
    const change = mulligan?.changes[key]
    const show = (score: number | null) => score === null ? '-' : String(score)
    return change ? `${show(change.from)} → ${show(change.to)}` : show(original)
  })
}

/** The whole archive as Markdown, for agents that send `Accept: text/markdown`. */
export function archiveMarkdown(): string {
  const { total, firstYear, lastYear } = ARCHIVE_SUMMARY
  const hostRows = HOSTS.map(({ key, name }) => {
    const count = ORIGINAL_RATINGS.filter((rating) => rating.scores[key] !== null).length
    return `| ${name} | ${count} | ${fmt(getHostAverage(key, ORIGINAL_RATINGS))} | ${fmt(getHostAverage(key, RATINGS))} |`
  })
  const ratingRows = ORIGINAL_RATINGS.map((rating) => {
    const adjusted = adjustedById.get(rating.id) ?? rating
    const guests = rating.guests.map((g) => `${g.name} ${g.score}`).join(', ')
    const source = episodeSourceHref(rating)
    return `| ${rating.ratedAt} | [${cell(rating.title)}](/ratings/${ratingSlug(rating)}) | ${scoreCells(rating).join(' | ')} | ${fmt(getAverage(adjusted))} | ${cell(guests)} | ${source ? `[Episode](${source})` : ''} |`
  })

  return `# Midnight Meter

> Every movie and TV rating given by ${new Intl.ListFormat('en').format(HOSTS.map((h) => h.name))} on The Midnight Boys podcast, ${firstYear} to ${lastYear}. Fan-maintained; not affiliated with The Ringer or Spotify. The podcast episodes are the source of record.

- Scale: 1 to 10 is the standard scale; 11 and ${MAX_SCORE} are "game changers".
- Midnight Mulligans: once a year the hosts revise past scores. Revised scores are shown as \`original → revised\`, and averages include them.
- Ratings: ${total}

## Hosts

| Host | Ratings | Career average | With Mulligans |
| --- | --- | --- | --- |
${hostRows.join('\n')}

## Ratings

Newest first. \`-\` means the host did not rate it.

| Date | Title | ${HOSTS.map((h) => h.short).join(' | ')} | Average | Guests | Source |
| --- | --- | ${HOSTS.map(() => '---').join(' | ')} | --- | --- | --- |
${ratingRows.join('\n')}
`
}
