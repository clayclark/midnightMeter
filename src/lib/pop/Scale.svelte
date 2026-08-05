<script lang="ts">
  import { reveal } from '$lib/motion'
</script>

<section class="scale" id="scale" aria-labelledby="scale-title">
  <div class="scale__panel" use:reveal={{ from: 'up' }}>
    <h2 id="scale-title">The Scale</h2>

    <div class="tier">
      <strong>1–10</strong>
      <div>
        <h3>Standard scale</h3>
      </div>
    </div>

    <div class="tier tier--game">
      <strong>11–12</strong>
      <div>
        <h3>Game changers</h3>
      </div>
    </div>

    <div class="tier tier--star">
      <strong aria-hidden="true">★</strong>
      <div>
        <h3>Podcast-sourced. Fan-maintained.</h3>
        <p>Ratings are delivered on the show. This is an independent record of them — not affiliated with The Ringer or Spotify.</p>
        <a href="https://youtube.com/playlist?list=PLRzBKXpC4g8ImLV6n67pIJ-nPmypKy_MF" target="_blank" rel="noreferrer">
          Listen to the pod <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </div>
</section>

<style>
  .scale {
    padding: clamp(2.5rem, 6vw, 4.5rem) clamp(0.75rem, 3vw, 2.5rem);
    background: var(--teal-deep);
    background-image: radial-gradient(rgb(255 255 255 / 0.1) 1.2px, transparent 1.3px);
    background-size: 14px 14px;
    color: var(--cream);
  }

  .scale__panel {
    max-width: 1400px;
    margin-inline: auto;
    padding: clamp(1.1rem, 2.4vw, 1.9rem);
    border: 3px solid var(--ink);
    border-radius: 8px;
    background: var(--cream);
    box-shadow: 8px 8px 0 var(--ink);
    color: var(--ink);
  }

  .scale__panel h2 {
    margin-bottom: 1rem;
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4vw, 3rem);
    text-transform: uppercase;
  }

  .tier {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 0;
    border-top: 3px solid var(--ink);
  }

  .tier > strong {
    display: grid;
    place-items: center;
    padding: 0.5rem 0.25rem;
    border: 3px solid var(--ink);
    border-radius: 4px;
    background: var(--yellow);
    font-family: var(--font-display);
    font-size: 1.4rem;
    letter-spacing: 0.02em;
  }

  .tier--game > strong { background: var(--cyan); }
  .tier--star > strong { background: var(--ink); color: var(--yellow); font-size: 1.7rem; }

  .tier h3 {
    font-family: var(--font-ui);
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .tier p {
    margin-top: 0.2rem;
    max-width: 70ch;
    font-family: var(--font-body);
    font-size: 0.92rem;
    line-height: 1.45;
    color: rgb(16 20 24 / 0.75);
  }

  .tier a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.25rem;
    /* keeps the link a thumb-sized target without moving the underline */
    min-height: 44px;
    text-underline-offset: 6px;
    text-decoration: underline;
    text-decoration-color: var(--magenta);
    text-decoration-thickness: 3px;
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    transition: color 200ms ease, gap 200ms ease;
  }

  .tier a:hover { color: var(--magenta); gap: 0.7rem; }

  @media (max-width: 560px) {
    .tier { grid-template-columns: 4rem minmax(0, 1fr); gap: 0.75rem; }
  }
</style>
