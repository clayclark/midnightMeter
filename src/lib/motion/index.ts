export const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface RevealOptions {
  /** Fixed delay in ms. Omit to let neighbours that arrive together cascade. */
  delay?: number
  threshold?: number
  /** Named entrance variant, consumed by CSS via [data-reveal-from]. */
  from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'slam'
}

const STAGGER_STEP = 70
const STAGGER_MAX = 6
/** Matches the entrance duration in app.css. */
const REVEAL_MS = 560

let pending: HTMLElement[] = []
let flushQueued = false

/**
 * Once the entrance is done, drop the hooks so the element goes back to its own
 * component styles — otherwise the leftover `--reveal-delay` would stall the
 * next hover by up to a full stagger.
 */
function settle(node: HTMLElement, delay: number) {
  setTimeout(() => {
    node.style.removeProperty('--reveal-delay')
    delete node.dataset.reveal
    delete node.dataset.revealFrom
  }, delay + REVEAL_MS + 60)
}

/**
 * A stagger has to key off *what crossed the fold together*, not where an
 * element sits in a list — an index says nothing about how many neighbours
 * arrived in the same frame, which is the only thing you actually see.
 *
 * Each node owns its own observer, so callback order is arbitrary. Collect a
 * frame's worth, sort by document position, then cascade down the page.
 */
function queueReveal(node: HTMLElement) {
  pending.push(node)
  if (flushQueued) return

  flushQueued = true
  requestAnimationFrame(() => {
    flushQueued = false
    const batch = pending.sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    pending = []

    for (const [index, element] of batch.entries()) {
      const delay = Math.min(index, STAGGER_MAX) * STAGGER_STEP
      element.style.setProperty('--reveal-delay', `${delay}ms`)
      element.dataset.reveal = 'visible'
      settle(element, delay)
    }
  })
}

/**
 * Marks a node with `data-reveal="ready" | "visible"` the first time it scrolls
 * into view. All the actual movement lives in CSS so each theme can style its
 * own entrance.
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  let observer: IntersectionObserver | undefined

  const apply = ({ delay, threshold = 0, from = 'up' }: RevealOptions) => {
    node.dataset.revealFrom = from

    if (prefersReducedMotion()) {
      node.dataset.reveal = 'visible'
      return
    }

    node.dataset.reveal = 'ready'
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer?.disconnect()

        /* resolved at reveal time, not setup time — the cascade only exists
           once we know what else crossed the fold in the same frame */
        if (delay === undefined) {
          queueReveal(node)
          return
        }

        node.style.setProperty('--reveal-delay', `${delay}ms`)
        node.dataset.reveal = 'visible'
        settle(node, delay)
      },
      /* A small positive margin: enough of a head start that the entrance never
         reads as late, but not so much that it finishes off-screen and the
         element appears to have simply been there all along. */
      { threshold, rootMargin: '0px 0px 6% 0px' },
    )
    observer.observe(node)
  }

  apply(options)

  /* No update handler: the delay is chosen at reveal time, and rewriting it
     afterwards would clobber the cascade the element already used. */
  return { destroy: () => observer?.disconnect() }
}

export interface TiltOptions {
  /** Max rotation in degrees. */
  max?: number
  /** Extra px the card lifts toward the viewer. */
  lift?: number
  glare?: boolean
}

/**
 * Pointer-follow 3D tilt. Writes `--tilt-x`, `--tilt-y` and `--pointer-x/y`
 * so the card CSS decides how far to take it.
 */
export function tilt(node: HTMLElement, options: TiltOptions = {}) {
  const { max = 7, lift = 14, glare = true } = options
  if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return

  let frame = 0

  const onMove = (event: PointerEvent) => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      node.style.setProperty('--tilt-y', `${(px - 0.5) * max * 2}deg`)
      node.style.setProperty('--tilt-x', `${(0.5 - py) * max * 2}deg`)
      node.style.setProperty('--tilt-lift', `${lift}px`)
      if (glare) {
        node.style.setProperty('--pointer-x', `${px * 100}%`)
        node.style.setProperty('--pointer-y', `${py * 100}%`)
      }
    })
  }

  const reset = () => {
    cancelAnimationFrame(frame)
    node.style.setProperty('--tilt-x', '0deg')
    node.style.setProperty('--tilt-y', '0deg')
    node.style.setProperty('--tilt-lift', '0px')
  }

  node.dataset.tilt = 'on'
  node.addEventListener('pointermove', onMove)
  node.addEventListener('pointerleave', reset)

  return {
    destroy() {
      cancelAnimationFrame(frame)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', reset)
    },
  }
}

/**
 * Sets `--parallax` to the node's progress through the viewport (-1 → 1) so
 * backgrounds and hero type can drift on scroll.
 */
export function parallax(node: HTMLElement, speed = 1) {
  if (prefersReducedMotion()) return

  let frame = 0
  const update = () => {
    frame = 0
    const rect = node.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    const progress = (center - window.innerHeight / 2) / window.innerHeight
    node.style.setProperty('--parallax', `${(progress * speed).toFixed(4)}`)
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }

  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)

  return {
    destroy() {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    },
  }
}

/** Adds `data-stuck` once a sticky element has left its natural position. */
export function stuck(node: HTMLElement) {
  /* An in-flow marker at the sticky element's natural top. It has to stay in
     flow: as `position: absolute` it resolved against the nearest positioned
     ancestor — the page wrapper — so it sat at the top of the document and the
     flag only flipped once you had scrolled past the entire hero. The negative
     margin keeps its 1px out of the layout. */
  const sentinel = document.createElement('div')
  sentinel.style.cssText = 'height:1px;margin-bottom:-1px;pointer-events:none;'
  node.parentElement?.insertBefore(sentinel, node)

  const observer = new IntersectionObserver(
    ([entry]) => { node.dataset.stuck = entry.isIntersecting ? 'false' : 'true' },
    { threshold: 0 },
  )
  observer.observe(sentinel)

  return {
    destroy() {
      observer.disconnect()
      sentinel.remove()
    },
  }
}
