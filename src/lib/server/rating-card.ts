import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { HOSTS } from '$lib/data'
import { ratingCardSvg, storyCardSvg, type AvatarData } from '$lib/share-card'
import type { Rating } from '$lib/types'
import opentype, { type Font } from 'opentype.js'

const require = createRequire(import.meta.url)
const antonFont = require.resolve('@fontsource/anton/files/anton-latin-400-normal.woff')
const barlowFont = require.resolve('@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff')

const renderOptions = {
  fitTo: { mode: 'original' as const },
  // Every visible glyph is converted to a vector path before Resvg sees it.
  // Keeping system fonts off makes local and serverless output byte-stable.
  font: { loadSystemFonts: false },
  imageRendering: 0 as const,
  textRendering: 2 as const,
}

const fontPromises = new Map<string, Promise<Font>>()

function loadFont(path: string): Promise<Font> {
  let promise = fontPromises.get(path)
  if (!promise) {
    promise = readFile(path).then((bytes) => {
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      return opentype.parse(buffer as ArrayBuffer)
    })
    fontPromises.set(path, promise)
  }
  return promise
}

async function avatarData(): Promise<AvatarData> {
  const entries = await Promise.all(HOSTS.map(async (host) => {
    const bytes = await readFile(resolve('static', host.avatar.slice(1)))
    return [host.key, `data:image/jpeg;base64,${bytes.toString('base64')}`] as const
  }))
  return Object.fromEntries(entries)
}

export async function renderRatingCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const [avatars, font, utilityFont] = await Promise.all([
    avatarData(), loadFont(antonFont), loadFont(barlowFont),
  ])
  const svg = ratingCardSvg(rating, { mulligan, avatars, font, utilityFont })
  return new Resvg(svg, renderOptions).render().asPng()
}

/** Portrait 1080x1920 for stories. Same data, different composition. */
export async function renderStoryCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const [avatars, font, utilityFont] = await Promise.all([
    avatarData(), loadFont(antonFont), loadFont(barlowFont),
  ])
  const svg = storyCardSvg(rating, { mulligan, avatars, font, utilityFont })
  return new Resvg(svg, renderOptions).render().asPng()
}
