import { browser } from '$app/environment'
import { derived, writable } from 'svelte/store'
import { MULLIGAN_MODEL, ORIGINAL_MODEL } from '$lib/data'

const STORAGE_KEY = 'midnight-meter:mulligans'
let initialized = false

export const mulligansEnabled = writable(true)
export const archiveModel = derived(
  mulligansEnabled,
  (enabled) => enabled ? MULLIGAN_MODEL : ORIGINAL_MODEL,
)

export function initializeMulligans(initial?: boolean): void {
  if (!browser) return

  /* A shared rating URL is an explicit view choice and must win over the
     recipient's saved preference. The regular homepage still restores it. */
  if (initial !== undefined) mulligansEnabled.set(initial)
  if (initialized) return
  initialized = true

  if (initial === undefined) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'on' || saved === 'off') mulligansEnabled.set(saved === 'on')
  }

  mulligansEnabled.subscribe((enabled) => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  })
}
