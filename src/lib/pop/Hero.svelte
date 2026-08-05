<script lang="ts">
  import Counter from '$lib/components/Counter.svelte'
  import { HOSTS } from '$lib/data'
  import { archiveModel, mulligansEnabled } from '$lib/mulligans'
  import { tilt } from '$lib/motion'

  const words = ['The', 'Midnight', 'Meter']

  $: boys = HOSTS.map((host, index) => ({
    ...host,
    ...$archiveModel.hostStats.find((entry) => entry.host === host.key)!,
    index,
  }))

  $: ranked = [...boys].toSorted((a, b) => b.average - a.average)
  const rankOf = (key: string) => ranked.findIndex((entry) => entry.host === key) + 1
</script>

<section class="hero" id="top">
  <div class="rays" aria-hidden="true"></div>
  <div class="halftone" aria-hidden="true"></div>
  <div class="confetti" aria-hidden="true">
    {#each Array(7) as _, i}<span style={`--i:${i}`}></span>{/each}
  </div>

  <div class="hero__inner">
    <div class="hero__top">
      <h1 class="title" aria-label="The Midnight Meter">
        {#each words as word, index}
          <span class="title__word" style={`--w:${index}`} aria-hidden="true">{word}</span>
        {/each}
      </h1>
    </div>

    <section class="boys" aria-labelledby="boys-title">
      <h2 id="boys-title" class="sr-only">The Midnight Boys</h2>
      <!-- Sits directly on the cards it rewrites: flip it and the averages
           below move, which is the only honest place for a control that
           swaps the score model for the whole site. -->
      <div class="scoreset">
        <span class="scoreset__label">Mulligans</span>
        <button
          type="button"
          class="switch"
          class:on={$mulligansEnabled}
          role="switch"
          aria-checked={$mulligansEnabled}
          aria-label="Use revised Midnight Mulligans scores"
          on:click={() => mulligansEnabled.set(!$mulligansEnabled)}
        >
          <span class="switch__thumb" aria-hidden="true"></span>
          <span class="switch__word">Off</span>
          <span class="switch__word">On</span>
        </button>
      </div>

      <div class="boys__grid">
        {#each boys as host}
          <article class={`boy boy--${host.key}`} use:tilt={{ max: 5, lift: 8 }}>
            <span class="boy__portrait" aria-hidden="true">
              <img src={host.avatar} alt="" width="160" height="160" />
            </span>

            <header>
              <h3>{host.name}</h3>
              <span class="boy__rank">#{rankOf(host.key)} most generous</span>
            </header>

            <p class="boy__avg">
              <Counter value={host.average} decimals={2} onView={false} delay={500 + host.index * 110} />
              <small>career avg</small>
            </p>

            <span class="boy__dist" aria-hidden="true">
              {#each host.distribution as count, score}
                <span
                  class:lit={count > 0}
                  style={`--h:${host.peak ? (count / host.peak) * 100 : 0}%; --d:${700 + host.index * 90 + score * 26}ms`}
                ></span>
              {/each}
            </span>
            <dl class="boy__meta">
              <div><dt>Scores</dt><dd><Counter value={host.count} onView={false} delay={620 + host.index * 90} /></dd></div>
              <div><dt>11+</dt><dd><Counter value={host.perfect} onView={false} delay={680 + host.index * 90} /></dd></div>
              <div><dt>Under 5</dt><dd><Counter value={host.harsh} onView={false} delay={740 + host.index * 90} /></dd></div>
            </dl>

            <ul class="boy__picks">
              <li><span>High</span><strong>{host.high.rating.title}</strong><b><Counter value={host.high.score} onView={false} delay={800 + host.index * 90} /></b></li>
              <li><span>Low</span><strong>{host.low.rating.title}</strong><b><Counter value={host.low.score} onView={false} delay={860 + host.index * 90} /></b></li>
            </ul>
          </article>
        {/each}
      </div>
    </section>
  </div>
</section>

<style>
  .hero {
    position: relative;
    display: grid;
    align-content: center;
    /* Leaves the top of the ratings list peeking under the fold. The hero is
       centred inside this, so shrinking it is what lifts the content — an
       asymmetric padding just gets absorbed by the centring. */
    min-height: calc(100svh - 22rem);
    overflow: clip;
    padding: clamp(0.3rem, 0.6vw, 0.5rem) clamp(1rem, 3vw, 2.5rem) clamp(1rem, 2vw, 1.6rem);
    background:
      radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, var(--teal) 78%, #fff 22%), transparent 62%),
      linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 100%);
    isolation: isolate;
  }

  .rays,
  .halftone {
    position: absolute;
    inset: -30% -10%;
    pointer-events: none;
    z-index: -1;
  }

  .rays {
    background: repeating-conic-gradient(
      from 0deg at 62% 42%,
      rgb(255 212 0 / 0.28) 0deg 3deg,
      transparent 3deg 9deg
    );
    mask-image: radial-gradient(60% 60% at 62% 42%, #000 10%, transparent 78%);
    animation: spin 90s linear infinite;
  }

  .halftone {
    inset: 0;
    background-image: radial-gradient(rgb(16 20 24 / 0.16) 1.4px, transparent 1.5px);
    background-size: 13px 13px;
    mask-image: linear-gradient(200deg, #000 0%, transparent 55%);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .confetti span {
    position: absolute;
    width: clamp(60px, 9vw, 130px);
    height: 10px;
    border-radius: 2px;
    opacity: 0.85;
    animation: drift 14s ease-in-out infinite;
    animation-delay: calc(var(--i) * -1.9s);
  }

  .confetti span:nth-child(1) { top: 12%; left: -3%; background: var(--magenta); transform: rotate(-24deg); }
  .confetti span:nth-child(2) { top: 68%; left: 3%; background: var(--yellow); transform: rotate(18deg); }
  .confetti span:nth-child(3) { top: 88%; left: 30%; background: var(--cyan); transform: rotate(-9deg); }
  .confetti span:nth-child(4) { top: 4%; right: 8%; background: var(--green); transform: rotate(32deg); }
  .confetti span:nth-child(5) { top: 40%; right: -2%; background: var(--orange); transform: rotate(-14deg); }
  .confetti span:nth-child(6) { bottom: 4%; right: 18%; background: var(--magenta); transform: rotate(8deg); }
  .confetti span:nth-child(7) { top: 22%; left: 46%; background: var(--yellow); transform: rotate(-38deg); opacity: 0.4; }

  @keyframes drift {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -18px; }
  }

  .hero__inner {
    position: relative;
    width: 100%;
    max-width: 1400px;
    margin-inline: auto;
  }

  /* the logotype is the only thing up here now */
  .hero__top {
    display: grid;
    justify-items: center;
    text-align: center;
  }

  /* --- 3D extruded logotype --- */
  .title {
    display: grid;
    /* The words carry their own left offsets — that stagger is the show's
       lockup. Centring each word individually would cancel it, so the words
       stay left-aligned inside a shrink-to-fit box and the whole lockup,
       offsets included, is what gets centred. */
    justify-items: start;
    width: fit-content;
    margin-inline: auto;
    /* the tight line-height clips the extruded shadow under METER */
    padding-bottom: clamp(0.85rem, 1.4vw, 1.25rem);
    font-family: var(--font-display);
    text-transform: uppercase;
    line-height: 0.78;
    letter-spacing: 0.005em;
  }

  .title__word {
    display: block;
    color: var(--cream);
    transform: skewY(-4deg);
    text-shadow:
      2px 2px 0 var(--ink), 4px 4px 0 var(--ink), 6px 6px 0 var(--ink),
      8px 8px 0 var(--ink), 10px 10px 0 var(--ink), 12px 12px 0 var(--ink),
      14px 14px 0 rgb(16 20 24 / 0.35);
    animation: slam 820ms cubic-bezier(0.14, 1.4, 0.32, 1) backwards;
    animation-delay: calc(var(--w) * 120ms);
  }

  .title__word:nth-child(1) { font-size: clamp(1.5rem, 3.2vw, 2.8rem); margin-left: 0.35em; }
  .title__word:nth-child(2) { font-size: clamp(2.5rem, 6vw, 5.3rem); }
  .title__word:nth-child(3) {
    font-size: clamp(2.2rem, 5.2vw, 4.6rem);
    margin-left: 1.1em;
    color: var(--yellow);
    text-shadow:
      2px 2px 0 var(--ink), 4px 4px 0 var(--ink), 6px 6px 0 var(--ink),
      8px 8px 0 var(--ink), 10px 10px 0 var(--ink), 12px 12px 0 var(--ink),
      14px 14px 0 var(--magenta), 16px 16px 0 var(--magenta);
  }

  @keyframes slam {
    from { opacity: 0; transform: skewY(-4deg) translate3d(-0.35em, -0.5em, 0) scale(1.3); }
    to { opacity: 1; transform: skewY(-4deg) translate3d(0, 0, 0) scale(1); }
  }

  /* --- extremes --- */
  .extremes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.5rem, 1.2vw, 0.9rem);
  }  /* --- score-set switch: the show's own hard-edged button language --- */
  /* Its own dark strip rather than sitting straight on the hero: the teal
     runs light-to-dark under it, so ink text here measures anywhere from
     5.9:1 down to 3.1:1 depending on where the gradient happens to be. */
  .scoreset {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3rem 0.6rem;
    /* hugs its content: full width made it read as an empty fourth card
       stacked on the host cards below */
    width: fit-content;
    max-width: 100%;
    /* the logotype is centred at every width, so the switch centres with it */
    margin-inline: auto;
    margin-bottom: clamp(0.6rem, 1.3vw, 0.9rem);
    padding: 0.3rem 0.5rem 0.3rem 0.65rem;
    /* hard keyline and offset shadow, like every other card on the page —
       a rounded pill reads as a generic web control here */
    border: 3px solid var(--ink);
    border-radius: 6px;
    background: var(--ink);
    box-shadow: 4px 4px 0 rgb(16 20 24 / 0.35);
    font-family: var(--font-ui);
  }

  .scoreset__label {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--yellow);
  }

  /* A physical two-position switch: the yellow block slides between the words
     and lights up like the meter's own fill when it lands on ON. */
  .switch {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: center;
    isolation: isolate;
    padding: 3px;
    border: 2px solid color-mix(in srgb, var(--cream) 26%, transparent);
    border-radius: 5px;
    background: rgb(0 0 0 / 0.35);
  }

  .switch__thumb {
    position: absolute;
    inset: 3px 50% 3px 3px;
    z-index: -1;
    border-radius: 3px;
    background: color-mix(in srgb, var(--cream) 34%, transparent);
    transition:
      translate 340ms cubic-bezier(0.34, 1.56, 0.4, 1),
      background 240ms ease,
      box-shadow 240ms ease;
  }

  .switch.on .switch__thumb {
    translate: 100% 0;
    background: var(--yellow);
    box-shadow: 0 0 14px rgb(255 212 0 / 0.65);
  }

  .switch__word {
    padding: 0.34rem 0.85rem;
    font-family: var(--font-ui);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-align: center;
    color: color-mix(in srgb, var(--cream) 68%, transparent);
    transition: color 240ms ease;
  }

  /* whichever word the thumb is under reads as ink on the block */
  .switch:not(.on) .switch__word:first-of-type,
  .switch.on .switch__word:last-of-type { color: var(--ink); }

  .switch:not(.on) .switch__word:first-of-type { color: var(--ink); }
  .switch:hover .switch__word { color: var(--cream); }
  .switch:not(.on):hover .switch__word:first-of-type,
  .switch.on:hover .switch__word:last-of-type { color: var(--ink); }

  /* --- the boys --- */
  .boys {
    margin-top: clamp(0.8rem, 1.8vw, 1.3rem);
    animation: pop-in 700ms cubic-bezier(0.2, 0.9, 0.25, 1) 380ms backwards;
  }

  .boys__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(0.5rem, 1.2vw, 1rem);
  }

  .boy {
    position: relative;
    display: grid;
    align-content: start;
    gap: 0.35rem;
    padding: clamp(0.6rem, 1.2vw, 0.85rem);
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius: 8px;
    background: linear-gradient(165deg, #20262d, #14181c);
    transform:
      perspective(1200px)
      rotateX(var(--tilt-x, 0deg))
      rotateY(var(--tilt-y, 0deg));
    transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }


  .boy--van { --host-c: var(--host-van); }
  .boy--charles { --host-c: var(--host-charles); }
  .boy--jomi { --host-c: var(--host-jomi); }
  .boy--steve { --host-c: var(--host-steve); }

  .boy__portrait {
    position: absolute;
    top: -0.35rem;
    right: -0.3rem;
    width: clamp(4.2rem, 6.2vw, 5.4rem);
    aspect-ratio: 1;
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius: 6px 6px 6px 42%;
    background: var(--cream);
    box-shadow: -4px 4px 0 var(--host-c);
    rotate: 2deg;
    pointer-events: none;
  }

  .boy:nth-child(even) .boy__portrait { rotate: -2deg; }

  .boy__portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .boy header {
    position: relative;
    z-index: 1;
    min-height: 4.25rem;
    padding-right: clamp(4.25rem, 6.5vw, 5.65rem);
  }

  .boy h3 {
    font-family: var(--font-display);
    font-size: clamp(1.05rem, 1.7vw, 1.45rem);
    text-transform: uppercase;
    color: var(--host-c);
  }

  .boy__rank {
    font-family: var(--font-ui);
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .boy__avg {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    font-variant-numeric: tabular-nums;
    padding-block: 0.35rem;
    border-block: 2px solid rgb(255 255 255 / 0.1);
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 2.8vw, 2.4rem);
    line-height: 0.95;
    color: var(--cream);
  }

  .boy__avg small {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .boy__dist {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: end;
    gap: 2px;
    height: clamp(1.7rem, 2.6vw, 2.2rem);
  }

  .boy__dist span {
    display: block;
    height: max(3px, var(--h));
    border-radius: 1px;
    background: rgb(255 255 255 / 0.12);
    transform-origin: bottom;
    /* `rise` is the entrance; the transition is what carries a bar to its new
       height when the Mulligans toggle rewrites the distribution */
    transition: height 620ms cubic-bezier(0.2, 0.9, 0.25, 1), background 300ms ease;
    animation: rise 620ms cubic-bezier(0.2, 0.9, 0.25, 1) backwards;
    animation-delay: var(--d);
  }

  .boy__dist span.lit { background: var(--host-c); }

  @keyframes rise {
    from { transform: scaleY(0); opacity: 0; }
  }

  .boy__meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
    margin: 0;
  }

  .boy__meta div {
    padding: 0.22rem 0.3rem;
    border: 2px solid rgb(255 255 255 / 0.12);
    border-radius: 3px;
    text-align: center;
  }

  .boy__meta dt {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .boy__meta dd {
    font-variant-numeric: tabular-nums;
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--host-c);
  }

  .boy__picks {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .boy__picks li {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 0.45rem;
    padding-top: 0.28rem;
    border-top: 2px solid rgb(255 255 255 / 0.1);
  }

  .boy__picks span {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--cream) 62%, transparent);
  }

  .boy__picks strong {
    font-family: var(--font-ui);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--cream);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .boy__picks b {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--host-c);
  }

  @keyframes pop-in {
    from { opacity: 0; transform: translate3d(0, 1.5rem, 0); }
  }

  @media (max-width: 1080px) {
    .hero { min-height: 0; }
    .title__word:nth-child(1),
    .title__word:nth-child(3) { margin-left: 0; }
  }

  /* Two rows of host cards is what pushes the ratings list off a landscape
     tablet, so hold four across until the cards would actually be too narrow. */
  @media (max-width: 1080px) and (min-width: 860px) {
    .boys__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  @media (max-width: 859px) {
    .boys__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  /* Tablets and short laptop windows. Every card keeps its histogram, counts
     and picks at every size — the card tightens to make room rather than
     dropping data, and the logotype gives back the height that costs. */
  @media (max-width: 1080px) and (min-width: 701px), (max-height: 900px) and (min-width: 701px) {
    .hero { padding-block: 0.3rem 0.6rem; }
    .title { padding-bottom: 0.5rem; }
    .title__word:nth-child(1) { font-size: clamp(1.1rem, 2vw, 1.6rem); }
    .title__word:nth-child(2) { font-size: clamp(1.9rem, 3.6vw, 3rem); }
    .title__word:nth-child(3) { font-size: clamp(1.7rem, 3.2vw, 2.6rem); }
    .boys { margin-top: 0.85rem; }
    .boy { gap: 0.18rem; padding: 0.5rem 0.55rem; }
    .boy__avg { padding-block: 0.2rem; font-size: clamp(1.4rem, 2.2vw, 1.9rem); }
    .boy__dist { height: 1.15rem; }
    .boy__meta div { padding: 0.16rem 0.18rem; }
    .boy__meta dt { font-size: 0.6rem; }
    .boy__meta dd { font-size: 0.9rem; }
    .boy__picks li { padding-top: 0.2rem; }
    .boy__picks span { font-size: 0.6rem; }
    .boy__picks strong { font-size: 0.66rem; }
    .boy__picks b { font-size: 0.9rem; }
  }

  /* --- phones ---------------------------------------------------------------
     Everything fits on screen. These used to be two stacked horizontal swipe
     rails, which hid two thirds of the content behind a gesture nothing
     advertised — and put two side-scrollers directly above each other. The
     cards shrink to what a phone can actually show instead. */
  @media (max-width: 700px) {
    .hero { padding-block: 0.35rem 0.7rem; }

    .title__word:nth-child(1) { font-size: 1.5rem; }
    .title__word:nth-child(2) { font-size: 2.7rem; }
    .title__word:nth-child(3) { font-size: 2.3rem; }

    .boys { margin-top: 0.6rem; }
    /* every px here is a px of the first rating peeking under the fold */
    .scoreset { margin-bottom: 0.45rem; padding: 0.22rem 0.45rem 0.22rem 0.6rem; }

    /* the three records read as one-line facts, so stack them tight */
    .extremes {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.35rem;
    }    /* all four hosts visible at once: name, rank and career average only */
    .boys__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.45rem;
    }

    .boy {
      gap: 0.15rem;
      padding: 0.5rem 0.55rem;
      /* the tilt transform fights touch scrolling */
      transform: none;
    }

    .boy h3 { font-size: 0.95rem; }
    .boy__rank { font-size: 0.6rem; letter-spacing: 0.1em; }
    .boy__portrait { width: 3.25rem; top: -0.2rem; right: -0.15rem; box-shadow: -3px 3px 0 var(--host-c); }
    .boy header { min-height: 3rem; padding-right: 3.3rem; }
    .boy__avg { padding-block: 0.15rem; font-size: 1.35rem; }
    .boy__avg small { font-size: 0.58rem; letter-spacing: 0.1em; }

    /* everything stays on the card — it just gets tighter */
    .boy__dist { height: 1.1rem; gap: 1px; }
    .boy__meta { gap: 0.2rem; }
    .boy__meta div { padding: 0.1rem 0.15rem; }
    .boy__meta dt { font-size: 0.6rem; letter-spacing: 0.03em; line-height: 1.05; }
    .boy__meta dd { font-size: 0.85rem; }
    .boy__picks { gap: 0.18rem; }
    .boy__picks li {
      grid-template-columns: 1.7rem minmax(0, 1fr) auto;
      gap: 0.3rem;
      padding-top: 0.13rem;
    }
    .boy__picks span { font-size: 0.6rem; letter-spacing: 0.05em; }
    .boy__picks strong { font-size: 0.62rem; }
    .boy__picks b { font-size: 0.85rem; }
  }

  /* Short, wide windows — half-height laptops and landscape phones. Portrait
     phones keep the complete host cards even when browser chrome makes the
     reported viewport unusually short. */
  @media (max-height: 720px) and (min-width: 701px) {
    .boy__dist,
    .boy__meta,
    .boy__picks { display: none; }

    .boy { gap: 0.2rem; padding: 0.5rem 0.55rem; }
    .boy__avg { padding-block: 0.2rem; font-size: clamp(1.4rem, 2.2vw, 1.9rem); }
    .boys { margin-top: 0.5rem; }
    .title__word:nth-child(1) { font-size: clamp(1.1rem, 2vw, 1.5rem); }
    .title__word:nth-child(2) { font-size: clamp(1.9rem, 3.6vw, 2.8rem); }
    .title__word:nth-child(3) { font-size: clamp(1.7rem, 3.2vw, 2.4rem); }
  }

  /* Smallest handsets (320x568 and the like) need another ~25px to clear the
     fold, and the logotype is the cheapest place to find it. */
  @media (max-height: 600px) {
    .title__word:nth-child(1) { font-size: 1rem; }
    .title__word:nth-child(2) { font-size: 1.75rem; }
    .title__word:nth-child(3) { font-size: 1.5rem; }
    .title { padding-bottom: 0.35rem; }
    .boys { margin-top: 0.4rem; }
    .boys__grid { gap: 0.35rem; }
    .boy { padding: 0.4rem 0.45rem; }
  }
</style>
