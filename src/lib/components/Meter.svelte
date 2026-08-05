<script lang="ts">
  import { onMount } from 'svelte'
  import { MAX_SCORE } from '$lib/data'
  import { prefersReducedMotion } from '$lib/motion'

  /** The score to reveal. Fractional is fine — averages land between stops. */
  export let score: number | null = null
  export let max: number = MAX_SCORE
  /** Nameplate text to the left of the rail — a host, or ALL BOYS for the consensus. */
  export let label: string | null = null
  /** Optional host portrait paired with the broadcast nameplate. */
  export let avatar: string | null = null
  export let avatarAlt = ''
  /** Reveal delay in ms. */
  export let delay = 0

  /* Stop 1 keeps a little runway at the head of the track. Stop 12 lands exactly
     on the end, so its bubble caps the rail instead of leaving a stub poking out. */
  const PAD = 3.2
  const SPAN = 100 - PAD
  /** Half a node — the fill covers the stop it reaches rather than stopping short. */
  const OVERHANG = 1.7

  const at = (stop: number) => PAD + ((stop - 1) / (max - 1)) * SPAN

  /* A fixed spectrum painted across the whole track: the score never chooses a
     colour, it only unmasks how far along the rail the verdict got. Same score,
     same colour, every time. */
  const SPECTRUM = [
    '#ff8a75', '#ffd98a', '#ffe9a8', '#fbf0ad', '#e4f5b4',
    '#b6f0dc', '#a7e9f2', '#bde3f7', '#d7c9f5', '#ecb9ec', '#f6a9d4', '#ffc46b',
  ]

  const stops = Array.from({ length: max }, (_, index) => ({
    stop: index + 1,
    pct: at(index + 1),
    /* each node carries the rail's colour at its own position, so a lit node
       reads as part of the fill rather than a white bead sitting on top of it */
    hue: SPECTRUM[index] ?? SPECTRUM.at(-1),
  }))

  const gradient = `linear-gradient(90deg, ${
    stops.map(({ pct }, index) => `${SPECTRUM[index] ?? SPECTRUM.at(-1)} ${pct}%`).join(', ')
  })`

  $: value = score === null ? null : Math.min(Math.max(score, 0), max)
  $: reached = value === null ? 0 : Math.min(Math.max(at(value) + OVERHANG, 0), 100)
  $: lit = (stop: number) => value !== null && value >= stop

  /* Held at zero for a frame so the reveal animates from an empty rail. */
  let live = false
  onMount(() => {
    if (prefersReducedMotion()) {
      live = true
      return
    }
    const timer = setTimeout(() => (live = true), delay)
    return () => clearTimeout(timer)
  })

  $: fill = live && value !== null ? reached : 0
</script>

<!-- the outer element is the query container; the grid lives inside it, because
     a container can't respond to its own container queries -->
<div
  class="meter"
  style={`--gradient:${gradient}; --fill:${fill}%; --cap:${at(max)}%`}
  role="img"
  aria-label={value === null ? 'Not scored' : `${score} out of ${max}`}
>
  <div
    class="meter__body"
    class:meter__body--plated={label !== null}
  >
    {#if label !== null}
      <span class="identity" class:identity--portrait={avatar !== null}>
        {#if avatar}
          <img class="identity__portrait" src={avatar} alt={avatarAlt} width="96" height="96" loading="lazy" />
        {/if}
        <span class="plate"><span class="plate__text">{label}</span></span>
      </span>
    {/if}

    <div class="rail" aria-hidden="true">
      <ol class="stops">
        {#each stops.slice(0, -1) as { stop, pct }}
          <li class="stop" class:on={lit(stop)} style={`--x:${pct}%`}>{stop}</li>
        {/each}
      </ol>

      <div class="track">
        <div class="track__base"></div>
        <div class="track__fill"></div>
        <div class="track__bloom"></div>

        {#each stops as { stop, pct, hue }}
          <span class="node" class:on={lit(stop)} style={`--x:${pct}%; --hue:${hue}`}></span>
        {/each}

        <span class="cap" class:on={lit(max)}>{max}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .meter {
    container-type: inline-size;
    width: 100%;
  }

  .meter__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    /* the node diameter drives every other measurement on the rail */
    --node: clamp(9px, 1.5cqi + 7px, 15px);
    --bar: calc(var(--node) * 0.72);
    /* the 12 bubble is bigger than the track and overhangs it on every side */
    --cap-size: calc(var(--node) * 2.5);
    --cap-bleed: calc((var(--cap-size) - var(--node)) / 2);
  }

  /* A fixed plate column, so every rail in a stack starts at the same x. */
  .meter__body--plated {
    grid-template-columns: var(--plate-w, clamp(5rem, 13cqi, 8.5rem)) minmax(0, 1fr);
    gap: 0 clamp(0.5rem, 1.4cqi, 1rem);
  }

  /* --- nameplate: white italic knocked out of the purple slab ------------- */

  .identity {
    display: grid;
    align-content: center;
    justify-items: stretch;
    min-width: 0;
  }

  .identity--portrait {
    gap: clamp(0.2rem, 0.5cqi, 0.35rem);
    padding-block: 0.15rem;
  }

  .plate {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    padding: 0.35em 1.4em 0.4em 0.9em;
    overflow: hidden;
    background: linear-gradient(118deg, #3d0f6b 0%, #7b1fbd 52%, #4c1288 100%);
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.14);
    /* the slab's trailing edge rakes forward, like the broadcast lower third */
    clip-path: polygon(0 0, 100% 0, calc(100% - 0.8em) 100%, 0 100%);
  }

  .identity__portrait {
    width: clamp(2.25rem, 4.5cqi, 3rem);
    height: clamp(2.25rem, 4.5cqi, 3rem);
    aspect-ratio: 1;
    border: 2px solid rgb(255 255 255 / 0.8);
    border-radius: 50%;
    margin-left: 0.55rem;
    background: #f7edc9;
    box-shadow:
      0 0 0 2px #4c1288,
      3px 3px 0 rgb(0 0 0 / 0.35);
    object-fit: cover;
  }

  .plate__text {
    font-family: var(--font-display);
    font-size: clamp(0.85rem, 2.4cqi, 1.5rem);
    font-style: italic;
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    /* wraps rather than ellipsing: a clipped name is worse than a taller plate */
    overflow-wrap: anywhere;
    color: #fff;
    text-shadow: 0 2px 0 rgb(0 0 0 / 0.35);
  }


  /* --- the rail ----------------------------------------------------------- */

  .rail {
    position: relative;
    display: grid;
    align-content: center;
    min-width: 0;
    /* room for the bubble to overhang without touching the row below */
    padding-bottom: var(--cap-bleed);
    /* and room on the right for the half of the bubble past the track's end */
    padding-right: calc(var(--cap-size) / 2);
  }

  .stops {
    position: relative;
    height: 1.35em;
    margin: 0;
    padding: 0;
    font-family: var(--font-ui);
    font-size: clamp(0.62rem, 1.9cqi, 1.05rem);
    font-style: italic;
    font-weight: 800;
    list-style: none;
  }

  .stop {
    position: absolute;
    left: var(--x);
    bottom: 0;
    translate: -50% 0;
    color: rgb(255 255 255 / 0.42);
    transition: color 300ms ease, text-shadow 300ms ease;
  }

  .stop.on {
    color: var(--yellow, #ffd400);
    text-shadow: 0 0 10px rgb(255 212 0 / 0.5);
  }

  .track {
    position: relative;
    height: var(--node);
    isolation: isolate;
  }

  .track__base,
  .track__fill,
  .track__bloom {
    position: absolute;
    inset: calc((var(--node) - var(--bar)) / 2) 0;
    border-radius: 999px;
  }

  .track__base {
    background: linear-gradient(180deg, #fff 0%, #dfe3e8 55%, #b9c0c8 100%);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.25);
  }

  /* Both lit layers carry the full-width gradient and are clipped from the
     right, so the colours stay pinned to their stops as the fill grows. */
  .track__fill,
  .track__bloom {
    background: var(--gradient);
    clip-path: inset(0 calc(100% - var(--fill)) 0 0 round 999px);
    transition: clip-path 1100ms cubic-bezier(0.22, 0.75, 0.2, 1);
  }

  .track__bloom {
    filter: blur(7px) saturate(1.4);
    opacity: 0.85;
    z-index: -1;
  }

  .node {
    position: absolute;
    top: 50%;
    left: var(--x);
    width: var(--node);
    height: var(--node);
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 32%, #fff 0%, #e6eaee 60%, #aab2bb 100%);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
    transition: background 300ms ease, box-shadow 300ms ease;
  }

  .node.on {
    background: radial-gradient(
      circle at 50% 30%,
      color-mix(in srgb, var(--hue) 35%, #fff) 0%,
      var(--hue) 62%,
      color-mix(in srgb, var(--hue) 72%, #000) 100%
    );
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.35),
      0 0 12px color-mix(in srgb, var(--hue) 70%, transparent);
  }

  /* --- 12: its own object, overhanging the end of the rail ---------------- */

  .cap {
    position: absolute;
    top: 50%;
    left: var(--cap);
    display: grid;
    place-items: center;
    width: var(--cap-size);
    height: var(--cap-size);
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, #fff 0%, #eef1f4 55%, #c3cad2 100%);
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.4);
    font-family: var(--font-display);
    font-size: calc(var(--node) * 1.35);
    font-style: italic;
    line-height: 1;
    color: rgb(120 128 138 / 0.9);
    transition: box-shadow 320ms ease, color 320ms ease, background 320ms ease;
  }

  .cap.on {
    background: radial-gradient(circle at 50% 32%, #fff6d8 0%, #ffcf6b 48%, #f0932a 100%);
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.4),
      0 0 22px rgb(255 178 54 / 0.85);
    color: #a24e05;
  }

  /* Phones: the plate can't sit beside the rail without crushing it, so it
     steps above and the rail takes the full width. */
  /* Phones: the plate can't sit beside the rail without crushing it, so it
     steps above and the rail takes the full width. */
  @container (max-width: 430px) {
    .meter__body--plated {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.4rem 0;
    }

    .plate {
      justify-self: start;
      width: auto;
      padding-right: 1.7em;
    }

    .identity__portrait { margin-left: 0.45rem; }
  }

  /* On a narrow rail the numerals collide — the nodes still carry the reading. */
  @container (max-width: 260px) {
    .stops { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .track__fill,
    .track__bloom { transition: none; }
  }
</style>
