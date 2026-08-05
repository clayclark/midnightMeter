<script lang="ts">
  import { getAverage, getSpread } from '$lib/data'
  import { archiveModel } from '$lib/mulligans'

  /* Headlines, not the standings. This used to be the newest 22 ratings — the
     same rows, in the same order, as the list immediately below it. Running the
     records instead means the strip carries the archive's most interesting
     entries and stops duplicating what you are about to scroll into. */
  $: byAverage = [...$archiveModel.ratings].toSorted((a, b) => getAverage(b) - getAverage(a))
  $: bySpread = [...$archiveModel.ratings].toSorted((a, b) => getSpread(b) - getSpread(a))

  const trim = (value: number) => String(Number(value.toFixed(2)))

  $: reels = [
    byAverage.slice(0, 7).map((rating) => ({
      flag: 'Highest', rating, stat: trim(getAverage(rating)),
    })),
    byAverage.slice(-7).reverse().map((rating) => ({
      flag: 'Lowest', rating, stat: trim(getAverage(rating)),
    })),
    bySpread.slice(0, 7).map((rating) => ({
      flag: 'Most debated', rating, stat: `${getSpread(rating)} pt spread`,
    })),
  ]

  /* Round-robin so the three kinds alternate rather than running in blocks, and
     drop repeats — a title can be both a record high and a record argument. */
  $: items = (() => {
    const seen = new Set<string>()
    const out: { flag: string; rating: { id: string; title: string }; stat: string }[] = []
    for (let index = 0; index < Math.max(...reels.map((reel) => reel.length)); index += 1) {
      for (const reel of reels) {
        const entry = reel[index]
        if (!entry || seen.has(entry.rating.id)) continue
        seen.add(entry.rating.id)
        out.push(entry)
      }
    }
    return out
  })()
</script>

<div class="marquee" aria-hidden="true">
  <div class="marquee__track">
    {#each [0, 1] as copy}
      <div class="marquee__group">
        {#each items as item}
          <span class="marquee__item">
            <i>{item.flag}</i>{item.rating.title}<b>{item.stat}</b>
          </span>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .marquee {
    overflow: hidden;
    padding-block: 0.45rem;
    border-block: 3px solid var(--ink);
    background: var(--magenta);
    color: #fff;
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    user-select: none;
  }

  .marquee__track {
    display: flex;
    width: max-content;
    animation: scroll 62s linear infinite;
  }

  .marquee:hover .marquee__track { animation-play-state: paused; }

  .marquee__group {
    display: flex;
    gap: 2.5rem;
    padding-right: 2.5rem;
  }

  .marquee__item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .marquee__item b {
    padding: 0.05rem 0.4rem;
    background: var(--yellow);
    color: var(--ink);
  }

  /* the record type, set back so the title still leads the eye */
  .marquee__item i {
    font-style: normal;
    font-size: 0.86em;
    letter-spacing: 0.2em;
    /* full white, not 72% — the tint read at 2.75:1 on the magenta. The size
       and tracking are what set it back from the title now. */
    color: #fff;
  }

  @keyframes scroll {
    to { transform: translateX(-50%); }
  }

  /* On the shortest screens this decorative strip is 37px that the first
     rating needs more than the marquee does. */
  @media (max-height: 600px) {
    .marquee { display: none; }
  }
</style>
