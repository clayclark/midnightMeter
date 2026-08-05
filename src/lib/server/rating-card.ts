import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { HOSTS } from '$lib/data'
import { ratingCardSvg, storyCardSvg, type AvatarData } from '$lib/share-card'
import type { Rating } from '$lib/types'

async function avatarData(): Promise<AvatarData> {
  const entries = await Promise.all(HOSTS.map(async (host) => {
    const bytes = await readFile(resolve('static', host.avatar.slice(1)))
    return [host.key, `data:image/jpeg;base64,${bytes.toString('base64')}`] as const
  }))
  return Object.fromEntries(entries)
}

export async function renderRatingCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const svg = ratingCardSvg(rating, { mulligan, avatars: await avatarData() })
  return new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
    imageRendering: 0,
    textRendering: 2,
  }).render().asPng()
}

/** Portrait 1080x1920 for stories. Same data, different composition. */
export async function renderStoryCard(rating: Rating, mulligan: boolean): Promise<Uint8Array> {
  const svg = storyCardSvg(rating, { mulligan, avatars: await avatarData() })
  return new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
    imageRendering: 0,
    textRendering: 2,
  }).render().asPng()
}
