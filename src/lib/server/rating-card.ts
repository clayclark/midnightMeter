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

const renderOptions = {
  fitTo: { mode: 'original' as const },
  font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
  imageRendering: 0 as const,
  textRendering: 2 as const,
}

let fontPromise: Promise<Font> | undefined

function anton(): Promise<Font> {
  fontPromise ??= readFile(antonFont).then((bytes) => {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return opentype.parse(buffer as ArrayBuffer)
  })
  return fontPromise
}

async function avatarData(): Promise<AvatarData> {
  const entries = await Promise.all(HOSTS.map(async (host) => {
    const bytes = await readFile(resolve('static', host.avatar.slice(1)))
    return [host.key, `data:image/jpeg;base64,${bytes.toString('base64')}`] as const
  }))
  return Object.fromEntries(entries)
}

export async function renderRatingCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const [avatars, font] = await Promise.all([avatarData(), anton()])
  const svg = ratingCardSvg(rating, { mulligan, avatars, font })
  return new Resvg(svg, renderOptions).render().asPng()
}

/** Portrait 1080x1920 for stories. Same data, different composition. */
export async function renderStoryCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const [avatars, font] = await Promise.all([avatarData(), anton()])
  const svg = storyCardSvg(rating, { mulligan, avatars, font })
  return new Resvg(svg, renderOptions).render().asPng()
}
