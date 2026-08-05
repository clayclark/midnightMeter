import { HOSTS, formatDate } from '$lib/data'
import type { HostKey, Rating } from '$lib/types'
import type { Font } from 'opentype.js'

export type AvatarData = Partial<Record<HostKey, string>>

const COLORS: Record<HostKey, string> = {
  van: '#22c7e8',
  charles: '#ff4da6',
  jomi: '#46b93f',
  steve: '#ffd400',
}

const SPECTRUM = [
  '#ff8a75', '#ffd98a', '#ffe9a8', '#fbf0ad', '#e4f5b4', '#b6f0dc',
  '#a7e9f2', '#bde3f7', '#d7c9f5', '#ecb9ec', '#f6a9d4', '#ffc46b',
]

const xml = (value: string | number) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

type TitleLayout = { lines: string[]; size: number }

/** Wrap against the actual bundled display font, not a character-count guess. */
function titleLayout(
  title: string,
  {
    font, sizes, maxWidth, maxLines,
  }: { font?: Font; sizes: number[]; maxWidth: number; maxLines: number },
): TitleLayout {
  const words = title.toUpperCase().trim().split(/\s+/)
  const measure = (value: string, size: number) => font
    ? font.getAdvanceWidth(value, size)
    : value.length * size * 0.52

  for (const size of sizes) {
    const lines: string[] = []
    for (const word of words) {
      const current = lines.at(-1)
      const candidate = current ? `${current} ${word}` : word
      if (!current || measure(candidate, size) <= maxWidth) {
        if (current) lines[lines.length - 1] = candidate
        else lines.push(word)
      } else {
        lines.push(word)
      }
    }

    if (lines.length <= maxLines && lines.every((line) => measure(line, size) <= maxWidth)) {
      return { lines, size }
    }
  }

  // The archive has no unbroken words this wide, but keep a lossless fallback
  // so an unexpected title is never silently truncated.
  const size = sizes.at(-1) ?? 48
  const lines = words.reduce<string[]>((result, word) => {
    const current = result.at(-1)
    if (!current || (result.length < maxLines && measure(`${current} ${word}`, size) > maxWidth)) result.push(word)
    else result[result.length - 1] = `${current} ${word}`
    return result
  }, [])
  return { lines, size }
}

function displayText(
  text: string | number,
  {
    x, y, size, fill, anchor = 'start', stroke, strokeWidth, opacity,
  }: {
    x: number
    y: number
    size: number
    fill: string
    anchor?: 'start' | 'middle' | 'end'
    stroke?: string
    strokeWidth?: number
    opacity?: number
  },
  font?: Font,
): string {
  const value = String(text)
  if (!font) {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Impact, Arial Black, sans-serif" font-size="${size}" fill="${fill}"${opacity === undefined ? '' : ` opacity="${opacity}"`}${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth ?? 0}" paint-order="stroke"` : ''}>${xml(value)}</text>`
  }

  const width = font.getAdvanceWidth(value, size)
  const startX = x - (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0)
  return `<path d="${font.getPath(value, startX, y, size).toPathData(1)}" fill="${fill}"${opacity === undefined ? '' : ` opacity="${opacity}"`}${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth ?? 0}" paint-order="stroke" stroke-linejoin="round"` : ''}/>`
}

const railStart = 355
const railWidth = 760
const stopX = (stop: number) => railStart + ((stop - 1) / 11) * railWidth

/**
 * The site's logotype, rebuilt in SVG: CSS gets its extrusion from a stack of
 * `text-shadow` offsets, which has no SVG equivalent, so each word is drawn
 * once per layer from the deepest offset forward.
 */
function extruded(
  text: string,
  {
    x = 0, y, size, fill, depth, under, anchor = 'start', font,
  }: {
    x?: number
    y: number
    size: number
    fill: string
    depth: number
    under?: string
    anchor?: 'start' | 'middle' | 'end'
    font?: Font
  },
): string {
  const layers: string[] = []
  const deepest = under ? depth + 2 : depth
  const startX = font
    ? x - (anchor === 'end' ? font.getAdvanceWidth(text, size) : anchor === 'middle' ? font.getAdvanceWidth(text, size) / 2 : 0)
    : x

  const layer = (layerX: number, layerY: number, color: string) => font
    ? `<path d="${font.getPath(text, layerX, layerY, size).toPathData(1)}" fill="${color}"/>`
    : `<text y="${layerY}" x="${layerX}" text-anchor="${anchor}" font-size="${size}" fill="${color}">${text}</text>`

  for (let step = deepest; step >= 1; step -= 1) {
    layers.push(layer(startX + step * 2, y + step * 2, under && step > depth ? under : '#101418'))
  }
  layers.push(layer(startX, y, fill))
  return layers.join('')
}

/* Right-aligned so it sits opposite the rating title, skewed the same -4° as
   the masthead on the site. */
const logotype = (font?: Font) => `<g transform="translate(1152 80) skewY(-4)"
    font-family="Anton, sans-serif" letter-spacing="1">
  ${extruded('THE', { y: 0, size: 34, fill: '#fff3d6', depth: 5, anchor: 'end', font })}
  ${extruded('MIDNIGHT', { y: 52, size: 64, fill: '#fff3d6', depth: 5, anchor: 'end', font })}
  ${extruded('METER', { y: 100, size: 54, fill: '#ffd400', depth: 5, under: '#e6007e', anchor: 'end', font })}
</g>`

function meterRow(
  rating: Rating,
  host: (typeof HOSTS)[number],
  index: number,
  avatars?: AvatarData,
  font?: Font,
  utilityFont?: Font,
): string {
  const score = rating.scores[host.key]
  const fillWidth = score === null || score < 1
    ? 0
    : Math.min(railWidth, ((Math.min(score, 12) - 1) / 11) * railWidth + 9)
  const avatar = avatars?.[host.key]
  const stops = Array.from({ length: 11 }, (_, offset) => offset + 1)

  return `<g transform="translate(0 ${262 + index * 78})">
    <rect x="25" width="1150" height="68" rx="7" fill="#151a1f" stroke="#101418" stroke-width="5"/>
    <circle cx="66" cy="34" r="28" fill="#fff3d6" stroke="${COLORS[host.key]}" stroke-width="5"/>
    ${avatar
      ? `<image x="40" y="8" width="52" height="52" href="${avatar}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-${host.key})"/>`
      : displayText(host.initial, { x: 66, y: 45, size: 30, fill: '#101418', anchor: 'middle' }, utilityFont)}
    <path d="M105 15h133l-15 39H105z" fill="#61169a" stroke="#8e31ce" stroke-width="3"/>
    ${displayText(host.short.toUpperCase(), { x: 118, y: 44, size: 24, fill: '#fff3d6' }, font)}
    ${displayText(score ?? '—', { x: 268, y: 52, size: 48, fill: COLORS[host.key], anchor: 'middle' }, font)}
    <path d="M315 10l12 48M326 10l12 48" stroke="#ffd400" stroke-width="4" opacity=".72"/>

    <rect x="${railStart}" y="34" width="${railWidth}" height="10" rx="5" fill="#eef1f4" opacity=".9"/>
    <rect x="${railStart}" y="34" width="${fillWidth}" height="10" rx="5" fill="url(#spectrum)"/>
    ${stops.map((stop) => {
      const lit = score !== null && score >= stop
      const x = stopX(stop)
      return `${displayText(stop, { x, y: 21, size: 13, fill: lit ? '#ffd400' : '#fff3d6', anchor: 'middle', opacity: lit ? 1 : .42 }, utilityFont)}
        <circle cx="${x}" cy="39" r="8" fill="${lit ? SPECTRUM[stop - 1] : '#d9dee3'}" stroke="#101418" stroke-opacity=".28" stroke-width="2" ${lit ? 'filter="url(#glow)"' : ''}/>`
    }).join('')}
    <circle cx="${stopX(12)}" cy="39" r="24" fill="${score !== null && score >= 12 ? '#ffc46b' : '#eef1f4'}" stroke="#101418" stroke-width="5" ${score !== null && score >= 12 ? 'filter="url(#glow)"' : ''}/>
    ${displayText(12, { x: stopX(12), y: 47, size: 24, fill: score !== null && score >= 12 ? '#8a4305' : '#727b85', anchor: 'middle' }, font)}
  </g>`
}

export function ratingCardSvg(
  rating: Rating,
  options: { mulligan: boolean; avatars?: AvatarData; font?: Font; utilityFont?: Font } = { mulligan: false },
): string {
  const { lines, size: titleSize } = titleLayout(rating.title, {
    font: options.font,
    sizes: [62, 58, 54, 50, 46],
    maxWidth: 760,
    maxLines: 2,
  })
  const titleY = lines.length === 1 ? 144 : 102
  const guestText = rating.guests.length
    ? ` · GUEST: ${rating.guests.map((guest) => `${guest.name.toUpperCase()} ${guest.score}`).join(' · ')}`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#22b8ae"/><stop offset="1" stop-color="#08716f"/></linearGradient>
      <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">${SPECTRUM.map((color, index) => `<stop offset="${index / 11}" stop-color="${color}"/>`).join('')}</linearGradient>
      <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#101418" opacity=".13"/></pattern>
      <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      ${HOSTS.map((host) => `<clipPath id="avatar-${host.key}" clipPathUnits="userSpaceOnUse"><circle cx="66" cy="34" r="25"/></clipPath>`).join('')}
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#dots)"/>
    <g stroke="#fff3d6" stroke-width="22" opacity=".12"><path d="M650 230 0 18M650 230 194 0M650 230 465 0M650 230 730 0M650 230 1018 0M650 230 1200 70M650 230 1200 290M650 230 1200 530M650 230 970 630M650 230 703 630M650 230 410 630M650 230 100 630M650 230 0 476M650 230 0 240"/></g>
    ${logotype(options.font)}

    ${lines.map((line, index) => displayText(line, { x: 48, y: titleY + index * 68, size: titleSize, fill: '#fff3d6', stroke: '#101418', strokeWidth: 7 }, options.font)).join('')}
    ${displayText(`${formatDate(rating.ratedAt).toUpperCase()}${guestText}`, { x: 52, y: 216, size: 19, fill: '#101418' }, options.utilityFont)}


    ${HOSTS.map((host, index) => meterRow(rating, host, index, options.avatars, options.font, options.utilityFont)).join('')}
  </svg>`
}

/* ---------------------------------------------------------------------------
   Portrait variant, 1080x1920 — Instagram / TikTok stories. Deliberately a
   separate function rather than a responsive version of the landscape card:
   at 9:16 the four meters want to stack tall and the logotype wants the top,
   which is a different composition, not a reflow. The landscape card stays
   available as a 1200x630 export, while link unfurls use the site's one static
   social image.
--------------------------------------------------------------------------- */

const STORY_W = 1080
const STORY_H = 1920

const storyRailStart = 96
const storyRailWidth = 810
const storyStopX = (stop: number) => storyRailStart + ((stop - 1) / 11) * storyRailWidth

function storyRow(
  rating: Rating,
  host: (typeof HOSTS)[number],
  index: number,
  top: number,
  avatars?: AvatarData,
  font?: Font,
  utilityFont?: Font,
): string {
  const score = rating.scores[host.key]
  const fill = score === null || score < 1
    ? 0
    : Math.min(storyRailWidth, ((Math.min(score, 12) - 1) / 11) * storyRailWidth + 11)
  const avatar = avatars?.[host.key]

  return `<g transform="translate(0 ${top + index * 236})">
    <rect x="42" width="996" height="208" rx="16" fill="#151a1f" stroke="#101418" stroke-width="7"/>
    <circle cx="118" cy="72" r="48" fill="#fff3d6" stroke="${COLORS[host.key]}" stroke-width="7"/>
    ${avatar
      ? `<image x="74" y="28" width="88" height="88" href="${avatar}" preserveAspectRatio="xMidYMid slice" clip-path="url(#story-avatar-${host.key})"/>`
      : displayText(host.initial, { x: 118, y: 90, size: 52, fill: '#101418', anchor: 'middle' }, utilityFont)}
    <path d="M186 40h232l-26 66H186z" fill="#61169a" stroke="#8e31ce" stroke-width="4"/>
    ${displayText(host.short.toUpperCase(), { x: 206, y: 90, size: 40, fill: '#fff3d6' }, font)}
    ${displayText(score ?? '—', { x: 986, y: 98, size: 86, fill: COLORS[host.key], anchor: 'end' }, font)}

    <rect x="${storyRailStart}" y="150" width="${storyRailWidth}" height="13" rx="7" fill="#eef1f4" opacity=".9"/>
    <rect x="${storyRailStart}" y="150" width="${fill}" height="13" rx="7" fill="url(#spectrum)"/>
    ${Array.from({ length: 11 }, (_, offset) => offset + 1).map((stop) => {
      const lit = score !== null && score >= stop
      const x = storyStopX(stop)
      return `<circle cx="${x}" cy="157" r="10" fill="${lit ? SPECTRUM[stop - 1] : '#d9dee3'}" stroke="#101418" stroke-opacity=".28" stroke-width="2" ${lit ? 'filter="url(#glow)"' : ''}/>`
    }).join('')}
    <circle cx="${storyStopX(12)}" cy="157" r="30" fill="${score !== null && score >= 12 ? '#ffc46b' : '#eef1f4'}" stroke="#101418" stroke-width="6" ${score !== null && score >= 12 ? 'filter="url(#glow)"' : ''}/>
    ${displayText(12, { x: storyStopX(12), y: 167, size: 28, fill: score !== null && score >= 12 ? '#8a4305' : '#727b85', anchor: 'middle' }, font)}
  </g>`
}

export function storyCardSvg(
  rating: Rating,
  options: { mulligan: boolean; avatars?: AvatarData; font?: Font; utilityFont?: Font } = { mulligan: false },
): string {
  const { lines, size: titleSize } = titleLayout(rating.title, {
    font: options.font,
    sizes: [96, 88, 80, 72, 64],
    maxWidth: STORY_W - 128,
    maxLines: 3,
  })
  const titleTop = 560
  const metersTop = titleTop + lines.length * (titleSize + 12) + 96

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#22b8ae"/><stop offset="1" stop-color="#08716f"/></linearGradient>
      <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">${SPECTRUM.map((color, index) => `<stop offset="${index / 11}" stop-color="${color}"/>`).join('')}</linearGradient>
      <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.4" fill="#101418" opacity=".13"/></pattern>
      <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      ${HOSTS.map((host) => `<clipPath id="story-avatar-${host.key}" clipPathUnits="userSpaceOnUse"><circle cx="118" cy="72" r="44"/></clipPath>`).join('')}
    </defs>
    <rect width="${STORY_W}" height="${STORY_H}" fill="url(#bg)"/>
    <rect width="${STORY_W}" height="${STORY_H}" fill="url(#dots)"/>
    <g stroke="#fff3d6" stroke-width="30" opacity=".1"><path d="M540 430 0 60M540 430 210 0M540 430 540 -40M540 430 900 0M540 430 1080 90M540 430 1080 520M540 430 1080 980M540 430 820 1920M540 430 540 1920M540 430 240 1920M540 430 0 980M540 430 0 520"/></g>

    <!-- logotype centred and oversized: at arm's length on a phone this is the
         only thing anyone reads before the scores -->
    <!-- centred; nudged 7px left because the extrusion layers all offset right,
         so a true centre would read as leaning -->
    <g transform="translate(290 200) skewY(-4)"
        font-family="Anton, sans-serif" letter-spacing="2">
      ${extruded('THE', { x: 22, y: 0, size: 62, fill: '#fff3d6', depth: 7, font: options.font })}
      ${extruded('MIDNIGHT', { y: 96, size: 116, fill: '#fff3d6', depth: 7, font: options.font })}
      ${extruded('METER', { x: 108, y: 186, size: 98, fill: '#ffd400', depth: 7, under: '#e6007e', font: options.font })}
    </g>


    ${lines.map((line, index) => displayText(line, { x: 64, y: titleTop + index * (titleSize + 12), size: titleSize, fill: '#fff3d6', stroke: '#101418', strokeWidth: 10 }, options.font)).join('')}
    ${displayText(formatDate(rating.ratedAt).toUpperCase(), { x: 68, y: titleTop + lines.length * (titleSize + 12) + 14, size: 30, fill: '#101418' }, options.utilityFont)}

    ${HOSTS.map((host, index) => storyRow(rating, host, index, metersTop, options.avatars, options.font, options.utilityFont)).join('')}

  </svg>`
}
