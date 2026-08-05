<script lang="ts">
  import { archiveModel } from '$lib/mulligans'
</script>

<footer class="footer">
  <div class="footer__bolt" aria-hidden="true">⚡</div>
  <strong>Pew pew.</strong>
  <div class="footer__bolt" aria-hidden="true">⚡</div>

  <p class="footer__note">
    {$archiveModel.summary.firstYear}–{$archiveModel.summary.lastYear} ·
    An unofficial, fan-kept record of The Midnight Boys
  </p>

  <a class="footer__top" href="#top">Back to top ↑</a>
</footer>

<style>
  .footer {
    display: grid;
    grid-template-columns: auto auto auto;
    justify-content: center;
    align-items: center;
    gap: 0.9rem;
    padding: clamp(2rem, 5vw, 3.5rem) 1rem;
    background: var(--ink);
    color: var(--cream);
    text-align: center;
  }

  .footer strong {
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 4vw, 2.6rem);
    font-style: italic;
    text-transform: uppercase;
    color: var(--yellow);
  }

  .footer__bolt {
    font-size: 1.4rem;
    animation: flicker 2.4s ease-in-out infinite;
  }

  .footer__bolt:last-of-type { animation-delay: 1.2s; }

  @keyframes flicker {
    0%, 100% { opacity: 0.4; transform: scale(0.9) rotate(-6deg); }
    50% { opacity: 1; transform: scale(1.12) rotate(6deg); }
  }

  .footer__note,
  .footer__top {
    grid-column: 1 / -1;
    font-family: var(--font-ui);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .footer__note { color: color-mix(in srgb, var(--cream) 62%, transparent); }

  .footer__top {
    justify-self: center;
    /* the text is 20px tall; the padding carries it past a thumb-sized target */
    display: grid;
    place-items: center;
    min-height: 44px;
    padding-inline: 0.75rem;
    text-decoration: none;
    text-underline-offset: 6px;
    text-decoration: underline;
    text-decoration-color: var(--yellow);
    text-decoration-thickness: 3px;
    transition: color 200ms ease;
  }

  .footer__top:hover { color: var(--yellow); }
</style>
