<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { fade, slide } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import Meter from '$lib/components/Meter.svelte'
  import ShareRating from '$lib/components/ShareRating.svelte'
  import SearchIcon from '$lib/components/SearchIcon.svelte'
  import {
    episodeSourceHref, formatDate, getAverage, getDelta, getFormat, getRank, getSpread,
    HOSTS, MULLIGAN_BY_ID, mulliganSourceHref, ORIGINAL_RATINGS,
  } from '$lib/data'
  import { archiveModel, mulligansEnabled } from '$lib/mulligans'
  import { prefersReducedMotion, stuck } from '$lib/motion'
  import type { FormatFilter, Rating, SortMode } from '$lib/types'

  export let initialOpenId: string | null = null

  let query = ''
  let format: FormatFilter = 'all'
  let sort: SortMode = 'newest'
  let openId: string | null = initialOpenId ?? ORIGINAL_RATINGS[0]?.id ?? null
  let searchInput: HTMLInputElement

  const sorts: { value: SortMode; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'highest', label: 'Highest' },
    { value: 'lowest', label: 'Lowest' },
    { value: 'debated', label: 'Most debated' },
  ]
  const formats: FormatFilter[] = ['all', 'film', 'series']

  const normalizeSearch = (value: string) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  const matchesSearch = (title: string, search: string) => {
    const normalizedTitle = normalizeSearch(title)
    return normalizedTitle.includes(search)
      || normalizedTitle.replaceAll(' ', '').includes(search.replaceAll(' ', ''))
  }

  $: normalizedQuery = normalizeSearch(query)
  $: results = $archiveModel.ratings
    .filter((rating) => format === 'all' || getFormat(rating.title) === format)
    .filter((rating) => !normalizedQuery || matchesSearch(rating.title, normalizedQuery))
    .toSorted((a, b) => {
      if (sort === 'highest') return getAverage(b) - getAverage(a)
      if (sort === 'lowest') return getAverage(a) - getAverage(b)
      if (sort === 'debated') return getSpread(b) - getSpread(a)
      if (sort === 'oldest') return a.ratedAt.localeCompare(b.ratedAt)
      return b.ratedAt.localeCompare(a.ratedAt)
    })

  let controlsEl: HTMLElement

  /**
   * Opening a row should never leave part of the card off-screen. Park it just
   * under the sticky controls unless the whole thing already fits where it is.
   *
   * The card is measured from `.detail`'s scrollHeight rather than the row's
   * box: this runs one tick after the state change, while the slide transition
   * is still animating height up from zero, so the row's own rect is far
   * shorter than the card will end up being.
   */
  async function toggle(rating: Rating, event: MouseEvent) {
    const wasOpen = openId === rating.id
    openId = wasOpen ? null : rating.id
    if (wasOpen) return

    const row = (event.currentTarget as HTMLElement).closest('.row')
    if (!row) return

    await tick()
    const stickyBottom = Math.max(controlsEl?.getBoundingClientRect().bottom ?? 0, 0)
    const summary = row.querySelector('.row__summary')!.getBoundingClientRect()
    const detail = row.querySelector('.detail')
    const openHeight = summary.height + (detail?.scrollHeight ?? 0)

    const clearsControls = summary.top >= stickyBottom
    const fitsBelowFold = summary.top + openHeight <= window.innerHeight
    if (clearsControls && fitsBelowFold) return

    window.scrollTo({
      top: window.scrollY + summary.top - stickyBottom - 8,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  function onKeydown(event: KeyboardEvent) {
    const typing = event.target instanceof HTMLElement
      && event.target.matches('input, textarea, select, [contenteditable="true"]')
    if (event.key === '/' && !typing) {
      event.preventDefault()
      searchInput.focus()
    }
    if (event.key === 'Escape' && event.target === searchInput) {
      if (query) query = ''
      else searchInput.blur()
    }
  }

  async function clearSearch() {
    query = ''
    await tick()
    searchInput.focus()
  }

  function showAllRatings() {
    format = 'all'
  }

  const hostColor = (key: string) => `var(--host-${key})`

  /** Hosts first, then any guest who scored the title. */
  function columns(rating: Rating) {
    const mulligan = MULLIGAN_BY_ID.get(rating.id)
    return [
      ...HOSTS.flatMap((host) => {
        const score = rating.scores[host.key]
        return score === null
          ? []
          : [{
              name: host.short,
              score,
              delta: getDelta(host.key, score, $archiveModel),
              change: mulligan?.changes[host.key] ?? null,
              avatar: host.avatar,
              avatarAlt: `${host.name} illustrated portrait`,
            }]
      }),
      ...rating.guests.map((guest) => ({
        name: guest.name,
        score: guest.score,
        delta: null,
        change: null,
        avatar: null,
        avatarAlt: '',
      })),
    ]
  }

  const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`

  onMount(async () => {
    if (!initialOpenId) return
    await tick()
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-rating-id="${initialOpenId}"]`)
      if (!row) return
      const stickyBottom = Math.max(controlsEl?.getBoundingClientRect().bottom ?? 0, 0)
      window.scrollTo({ top: window.scrollY + row.getBoundingClientRect().top - stickyBottom - 8 })
    }))
  })
</script>

<svelte:window on:keydown={onKeydown} />

<section class="archive" id="ratings" aria-labelledby="archive-title">
  <h2 id="archive-title" class="sr-only">Every rating on record</h2>

  <!-- Set-once controls: these scroll away, so the sticky bar below stays thin.
       The score-model switch lives in the hero, where you can watch it work. -->
  <div class="setup">
    <div class="setup__filters">
      <div class="control-group">
        <span class="control-label">Show</span>
        <div class="chips" role="group" aria-label="Filter by type">
          {#each formats as value}
            <button
              type="button"
              class:on={format === value}
              aria-pressed={format === value}
              on:click={() => (format = value)}
            >{value}</button>
          {/each}
        </div>
      </div>

      <label class="sort-field">
        <span class="control-label">Sort by</span>
        <span class="select-shell">
          <select bind:value={sort} aria-label="Sort ratings">
            {#each sorts as option}<option value={option.value}>{option.label}</option>{/each}
          </select>
          <svg class="select-chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="m5 7 5 6 5-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" />
          </svg>
        </span>
      </label>
    </div>
  </div>

  <!-- Sticky: only what you reach for mid-scroll. -->
  <div class="controls" bind:this={controlsEl} use:stuck>
    <label class="search">
      <SearchIcon size={20} />
      <span class="sr-only">Search titles</span>
      <input
        bind:this={searchInput}
        bind:value={query}
        type="search"
        name="rating-search"
        aria-label="Search titles"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        placeholder="Search titles…"
      />
      <!-- the shortcut hint gives way to the clear button once you have typed -->
      {#if query}
        <button
          type="button"
          class="search__clear"
          aria-label="Clear search"
          on:click={clearSearch}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </button>
      {:else}
        <kbd aria-hidden="true">/</kbd>
      {/if}
    </label>

    <p class="count" aria-live="polite" aria-atomic="true"><strong>{results.length}</strong> <span>{results.length === 1 ? 'result' : 'results'}</span></p>
  </div>

  <ol class="rows">
    {#each results as rating, index (rating.id)}
      {@const average = getAverage(rating)}
      {@const open = openId === rating.id}
      {@const cols = columns(rating)}
      {@const mulligan = MULLIGAN_BY_ID.get(rating.id)}
      {@const originalEpisode = episodeSourceHref(rating)}
      <li
        class="row"
        class:open
        data-rating-id={rating.id}
        animate:flip={{ duration: 380, easing: cubicOut }}
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 120 }}
      >
        <button class="row__summary" type="button" aria-expanded={open} on:click={(event) => toggle(rating, event)}>
          <span class="rank">{String(index + 1).padStart(2, '0')}</span>
          <span class="name">
            <strong>{rating.title}</strong>
            {#if mulligan}<span class="mulligan-badge">Mulligan {$mulligansEnabled ? 'applied' : 'available'}</span>{/if}
            <time datetime={rating.ratedAt}>{formatDate(rating.ratedAt)}</time>
          </span>
          <span class="avg">
            <small>Avg</small>
            <b>{average.toFixed(2)}</b>
          </span>
          <span class="rail">
            {#each HOSTS as host}
              {@const change = mulligan?.changes[host.key]}
              <span class="cell" style={`--host:${hostColor(host.key)}`}>
                <small>{host.short}</small>
                <b class:changed={$mulligansEnabled && !!change && change.from !== change.to}>
                  {#if $mulligansEnabled && change && change.from !== change.to}
                    <s>{change.from ?? '—'}</s><span aria-hidden="true">→</span>{rating.scores[host.key] ?? '—'}
                  {:else}
                    {rating.scores[host.key] ?? '—'}
                  {/if}
                </b>
              </span>
            {/each}
          </span>
          <span class="chev" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="m5 9 7 7 7-7" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" /></svg>
          </span>
        </button>

        {#if open}
          <div class="detail" transition:slide={{ duration: 320, easing: cubicOut }}>
            <ul class="meters">
              {#each cols as column, columnIndex}
                <li class="meter-row" style={`--d:${columnIndex * 90}ms`}>
                  <Meter
                    label={column.name}
                    score={column.score}
                    avatar={column.avatar}
                    avatarAlt={column.avatarAlt}
                    delay={120 + columnIndex * 130}
                  />
                  <span class="meter-row__note" class:up={(column.delta ?? 0) > 0} class:down={(column.delta ?? 0) < 0}>
                    {#if $mulligansEnabled && column.change && column.change.from !== column.change.to}
                      Mulligan {column.change.from ?? '—'} → {column.change.to ?? '—'}
                    {:else if column.delta === null}
                      Guest score
                    {:else}
                      {signed(column.delta)} vs their average
                    {/if}
                  </span>
                </li>
              {/each}
            </ul>

            <dl class="facts">
              <div><dt>All-time rank</dt><dd>#{getRank(rating, $archiveModel)} <small>of {$archiveModel.ratings.length}</small></dd></div>
              <div><dt>Spread</dt><dd>{getSpread(rating)} <small>pts apart</small></dd></div>
              {#if originalEpisode}
                <div class="episode-source original-source">
                  <dt>Original episode</dt>
                  <dd>
                    <a href={originalEpisode} target="_blank" rel="noreferrer">Listen to episode ↗</a>
                  </dd>
                </div>
              {/if}
              {#if mulligan}
                <div class="episode-source mulligan-source">
                  <dt>Mulligan episode</dt>
                  <dd>
                    <a href={mulliganSourceHref(mulligan)} target="_blank" rel="noreferrer">
                      {mulligan.sourceLabel}{mulligan.timestamp ? ` · ${mulligan.timestamp}` : ''} ↗
                    </a>
                  </dd>
                </div>
              {/if}
              <!-- `rating.note` stays in the data but is deliberately not shown -->

            </dl>

            <ShareRating {rating} mulligan={$mulligansEnabled && !!mulligan} />
          </div>
        {/if}
      </li>
    {:else}
      <li class="empty">
        <strong>No ratings found</strong>
        {#if normalizedQuery}
          <p>No titles match “{query.trim()}”. Try another search or clear it.</p>
          <button type="button" on:click={clearSearch}>Clear search</button>
        {:else}
          <p>No ratings match this filter.</p>
          <button type="button" on:click={showAllRatings}>Show all ratings</button>
        {/if}
      </li>
    {/each}
  </ol>
</section>

<style>
  .archive {
    padding: clamp(0.9rem, 2vw, 1.25rem) clamp(0.75rem, 3vw, 2.5rem) clamp(2rem, 5vw, 4rem);
    background:
      linear-gradient(180deg, var(--ink) 0%, #171c21 100%);
    color: var(--cream);
  }

  /* --- controls --- */
  /* --- set-once controls, above the sticky bar --- */
  .setup {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem 1rem;
    max-width: 1400px;
    margin: 0 auto 0.7rem;
    padding-inline: 0.1rem;
    color: var(--cream);
    font-family: var(--font-ui);
  }

  .setup__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.7rem 1rem;
  }

  .control-group,
  .sort-field {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .control-label {
    color: color-mix(in srgb, var(--cream) 66%, transparent);
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .controls {
    position: sticky;
    /* the nav scrolls away with the hero, so these own the top of the screen */
    top: 0;
    z-index: 40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    max-width: 1400px;
    margin-inline: auto;
    padding: 0.6rem;
    border: 3px solid var(--ink);
    border-radius: 6px;
    background: var(--cream);
    /* The upward ink block masks rows sliding under the bar, so it belongs to
       the stuck state only — at rest it reached 20px into an 11px gap and
       sliced the bottom off the sort chips. */
    box-shadow: 5px 5px 0 var(--magenta);
    color: var(--ink);
    font-family: var(--font-ui);
    transition: box-shadow 260ms ease, transform 260ms ease;
  }

  .controls:global([data-stuck='true']) {
    box-shadow: 5px 5px 0 var(--magenta), 0 -1.25rem 0 var(--ink), 0 18px 40px rgb(0 0 0 / 0.45);
  }

  .search {
    display: flex;
    flex: 1 1 15rem;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.7rem;
    border: 2px solid var(--ink);
    border-radius: 4px;
    background: #fff;
    transition: box-shadow 180ms ease;
  }

  .search:focus-within { box-shadow: 0 0 0 3px var(--cyan); }

  :global(html[data-input-modality='pointer']) .search:focus-within {
    box-shadow: none;
  }

  .search input {
    /* the label is roomy, but the input is the thing you tap (WCAG 2.5.8) */
    min-height: 24px;
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    /* iOS Safari zooms the viewport when a focused form control is <16px. */
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    outline: none;
  }

  .search input::placeholder { color: rgb(16 20 24 / 0.45); text-transform: uppercase; }

  .search__clear {
    display: grid;
    place-items: center;
    /* 14px glyph, padded out to a legal 24px target */
    width: 24px;
    height: 24px;
    flex: none;
    border: 2px solid rgb(16 20 24 / 0.35);
    border-radius: 50%;
    background: none;
    color: var(--ink);
    transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
  }

  .search__clear:hover {
    border-color: var(--ink);
    background: var(--magenta-on-cream);
    color: var(--cream);
  }

  .search kbd {
    padding: 0.05rem 0.35rem;
    border: 2px solid rgb(16 20 24 / 0.35);
    border-radius: 3px;
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 800;
  }

  /* says what the mode is actually doing, since it rewrites scores page-wide */

  /* these sit on the archive's dark ground now, not the cream bar */
  .chips {
    display: flex;
    gap: 2px;
    padding: 2px;
    border: 2px solid color-mix(in srgb, var(--cream) 30%, transparent);
    border-radius: 4px;
  }

  .chips button {
    padding: 0.42rem 0.85rem;
    border-radius: 2px;
    color: color-mix(in srgb, var(--cream) 78%, transparent);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    transition: background 200ms ease, color 200ms ease, transform 200ms ease;
  }

  .chips button:hover {
    background: rgb(255 255 255 / 0.09);
    color: var(--cream);
  }

  .chips button.on {
    background: var(--yellow);
    transform: translateY(-1px);
    box-shadow: 0 2px 0 rgb(0 0 0 / 0.5);
    color: var(--ink);
  }

  .count {
    margin-left: auto;
    padding-right: 0.4rem;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .count strong { color: var(--magenta-on-cream); font-size: 1.1rem; }

  .sort-field select {
    min-height: 2.25rem;
    width: 100%;
    padding: 0.38rem 2.4rem 0.38rem 0.7rem;
    border: 2px solid color-mix(in srgb, var(--cream) 48%, transparent);
    border-radius: 4px;
    background: var(--cream);
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 900;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    cursor: pointer;
    appearance: none;
  }

  .select-shell {
    position: relative;
    display: block;
    min-width: 8.8rem;
    color: var(--ink);
  }

  .select-chevron {
    position: absolute;
    top: 50%;
    right: 0.65rem;
    transform: translateY(-50%);
    pointer-events: none;
  }

  /* --- rows --- */
  .rows {
    display: grid;
    gap: 0.5rem;
    max-width: 1400px;
    margin: 0.65rem auto 0;
    padding: 0;
    list-style: none;
  }

  .row {
    border: 3px solid var(--ink);
    border-radius: 6px;
    background: #1c2127;
    box-shadow: 4px 4px 0 rgb(0 0 0 / 0.5);
    transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms ease, background 220ms ease;
    /* `content-visibility: auto` was here to skip rendering off-screen rows.
       Removed: a skipped row keeps the size it last rendered at, and that
       remembered size includes the inline axis. After any viewport change —
       a rotation, a window resize — every off-screen row held its old width
       and overflowed the page, clipping two of the four host scores. The
       remembered size substitutes directly, so neither
       `contain-intrinsic-width: none` nor `max-width: 100%` clamps it.
       Layout containment still isolates each row without that behaviour. */
    contain: layout paint;
  }

  .row:hover {
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 var(--cyan);
    background: #222831;
  }

  .row.open {
    background: #222831;
    box-shadow: 6px 6px 0 var(--yellow);
  }

  .row__summary {
    display: grid;
    grid-template-columns: 3.6rem minmax(0, 1fr) 5.5rem minmax(0, 19rem) 2.6rem;
    align-items: center;
    gap: clamp(0.5rem, 1.5vw, 1.2rem);
    width: 100%;
    padding: 0.7rem clamp(0.6rem, 1.4vw, 1.1rem);
    text-align: left;
    color: inherit;
  }

  .rank {
    font-variant-numeric: tabular-nums;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2.4vw, 2.1rem);
    font-style: italic;
    color: var(--yellow);
    text-align: center;
  }

  .name { display: grid; gap: 0.1rem; min-width: 0; }

  .name strong {
    font-family: var(--font-ui);
    font-size: clamp(1rem, 1.8vw, 1.35rem);
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.05;
  }

  .name time {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .mulligan-badge {
    justify-self: start;
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--yellow);
    border-radius: 2px;
    color: var(--yellow);
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .avg {
    display: grid;
    justify-items: center;
    padding-inline: 0.4rem;
    border-inline: 2px solid rgb(255 255 255 / 0.1);
  }

  .avg small {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  .avg b {
    font-variant-numeric: tabular-nums;
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2.2vw, 1.9rem);
    color: var(--yellow);
  }

  .rail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }

  .cell {
    display: grid;
    justify-items: center;
    padding-inline: 0.25rem;
  }

  .cell + .cell { border-left: 2px solid rgb(255 255 255 / 0.08); }

  .cell small {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    /* no opacity knock-back: the size difference against the score below
       already reads as secondary, and dimming it fails contrast */
    color: var(--host);
  }

  .cell b {
    font-variant-numeric: tabular-nums;
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2.2vw, 2rem);
    line-height: 1;
    color: var(--host);
  }

  .cell b.changed {
    display: flex;
    align-items: baseline;
    gap: 0.16em;
    font-size: clamp(1rem, 1.6vw, 1.45rem);
  }

  /* The old score has to stay legible while still reading as struck: at 54%
     and 0.62em a 2px rule was covering most of a single digit. */
  .cell b.changed s {
    color: color-mix(in srgb, var(--cream) 78%, transparent);
    font-family: var(--font-ui);
    font-size: 0.78em;
    font-weight: 800;
    text-decoration-color: color-mix(in srgb, var(--magenta-on-dark) 85%, transparent);
    text-decoration-thickness: 1.5px;
  }

  .cell b.changed span { color: var(--yellow); font-size: 0.58em; }

  .chev {
    display: grid;
    place-items: center;
    color: var(--cream);
    transition: transform 300ms cubic-bezier(0.2, 0.9, 0.25, 1), color 200ms ease;
  }

  .row:hover .chev { color: var(--cyan); }
  .row.open .chev { transform: rotate(180deg); color: var(--yellow); }

  /* --- detail: one broadcast rail per scorer --- */
  .meters {
    display: grid;
    gap: clamp(0.35rem, 0.9vw, 0.6rem);
    margin: 0 0.6rem 0.6rem;
    padding: 0;
    list-style: none;
  }

  .meter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 9rem;
    align-items: center;
    gap: 0 clamp(0.5rem, 1.2vw, 1rem);
    padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.5rem, 1.1vw, 0.8rem);
    border-radius: 5px;
    /* the neutral slab the broadcast rail sits on, over the row's black */
    background: linear-gradient(180deg, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.04));
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.06);
    animation: tile-in 560ms cubic-bezier(0.16, 1.25, 0.3, 1) backwards;
    animation-delay: var(--d);
  }

  .meter-row__note {
    text-align: right;
    font-family: var(--font-ui);
    font-size: 0.7rem;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-wrap: balance;
    color: color-mix(in srgb, var(--cream) 66%, transparent);
  }

  .meter-row__note.up { color: var(--green); }
  .meter-row__note.down { color: var(--red); }

  /* --- the numbers you can't read off the row --- */
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0 0.6rem 0.6rem;
  }

  .facts div {
    padding: 0.35rem 0.7rem;
    border: 2px solid rgb(255 255 255 / 0.14);
    border-radius: 4px;
    background: rgb(0 0 0 / 0.3);
  }

  .facts dt {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .facts dd {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cream);
  }

  .facts dd small {
    font-size: 0.68rem;
    font-weight: 700;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .facts .episode-source {
    border-color: color-mix(in srgb, var(--cyan) 55%, transparent);
    background: color-mix(in srgb, var(--cyan) 7%, rgb(0 0 0 / 0.3));
  }

  .facts .mulligan-source {
    border-color: color-mix(in srgb, var(--yellow) 65%, transparent);
    background: color-mix(in srgb, var(--yellow) 10%, rgb(0 0 0 / 0.3));
  }

  .episode-source a {
    color: var(--cyan);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .mulligan-source a {
    color: var(--yellow);
  }

  @keyframes tile-in {
    from { opacity: 0; transform: translate3d(0, 0.9rem, 0) scale(0.94); }
  }

  .empty {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    padding: clamp(2rem, 6vw, 4rem);
    border: 3px dashed rgb(255 255 255 / 0.25);
    border-radius: 6px;
    text-align: center;
  }

  .empty strong {
    font-family: var(--font-display);
    font-size: 2rem;
    text-transform: uppercase;
    color: var(--yellow);
  }

  .empty p { font-family: var(--font-body); color: color-mix(in srgb, var(--cream) 70%, transparent); }

  .empty button {
    margin-top: 0.5rem;
    padding: 0.6rem 1.2rem;
    border: 3px solid var(--ink);
    border-radius: 4px;
    background: var(--yellow);
    box-shadow: 4px 4px 0 var(--ink);
    color: var(--ink);
    font-family: var(--font-ui);
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  @media (max-width: 1080px) {
    .row__summary { grid-template-columns: 2.8rem minmax(0, 1fr) 4.5rem minmax(0, 14rem) 2rem; }
  }

  @media (max-width: 780px) {
    .controls {
      gap: 0.45rem;
      padding: 0.5rem;
      box-shadow: 5px 5px 0 var(--magenta);
    }

    .controls:global([data-stuck='true']) {
      box-shadow: 5px 5px 0 var(--magenta), 0 -0.4rem 0 var(--ink), 0 18px 40px rgb(0 0 0 / 0.45);
    }

    /* the sticky bar is one row on phones: search plus the live count */
    .search { flex: 1 1 auto; padding-block: 0.4rem; }
    .search kbd { display: none; }
    .setup__filters { flex: 1 1 100%; justify-content: space-between; }
    .control-group,
    .sort-field {
      display: grid;
      gap: 0.2rem;
    }
    .chips button { padding: 0.4rem 0.6rem; font-size: 0.72rem; }
    /* number only — the word would wrap the bar onto a second line */
    .count { padding-right: 0; font-size: 0.7rem; }
    .count span { display: none; }
    .control-label { font-size: 0.62rem; }
    /* Keep every focusable form control above Safari's auto-zoom threshold. */
    .sort-field select { font-size: 1rem; }

    .row__summary {
      grid-template-columns: 2.4rem minmax(0, 1fr) 3.6rem 2.4rem;
      row-gap: 0.55rem;
      padding-block: 0.85rem;
    }

    .rail {
      grid-column: 1 / -1;
      border-top: 2px solid rgb(255 255 255 / 0.1);
      padding-top: 0.5rem;
    }

    .avg { border: 0; }
    .chev { align-self: center; }

    .meters { margin-inline: 0.35rem; }

    /* no room for a note column beside the rail — it drops underneath */
    .meter-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.3rem 0;
    }

    .meter-row__note { text-align: left; }
  }
</style>
