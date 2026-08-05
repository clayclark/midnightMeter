<script lang="ts">
  import { onMount } from 'svelte'
  import { prefersReducedMotion } from '$lib/motion'

  export let value: number
  export let decimals = 0
  export let duration = 1200
  export let delay = 0
  /** Wait until the number scrolls into view before running. */
  export let onView = true

  let node: HTMLElement
  let shown = 0
  let mounted = false
  let lastValue = value
  let frame = 0

  /** A change of model (the Mulligans toggle) counts from where it is now. */
  const RETUNE_MS = 620

  // `run` reads `shown` internally rather than taking it as an argument, so this
  // block doesn't take a reactive dependency on it and re-fire every frame.
  $: if (mounted && value !== lastValue) {
    lastValue = value
    run(RETUNE_MS, 0)
  }

  function run(over = duration, wait = delay) {
    cancelAnimationFrame(frame)
    if (prefersReducedMotion()) {
      shown = value
      return
    }
    const from = shown
    const target = value
    const startedAt = performance.now() + wait
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / over))
      shown = from + (target - from) * (1 - Math.pow(1 - progress, 4))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  onMount(() => {
    mounted = true
    lastValue = value
    if (!onView) {
      run()
      return () => cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      run()
    }, { threshold: 0.4 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  })
</script>

<span bind:this={node} class="counter"><span aria-hidden="true">{shown.toFixed(decimals)}</span><span class="sr-only">{value.toFixed(decimals)}</span></span>

<style>
  .counter {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }
</style>
