<script lang="ts">
  let open = false
</script>

<header class="nav" class:open>
  <nav aria-label="Main">
    <a href="#ratings" on:click={() => (open = false)}>Ratings</a>
    <a href="#scale" on:click={() => (open = false)}>The Scale</a>
  </nav>

  <button class="burger" type="button" aria-expanded={open} aria-label="Toggle menu" on:click={() => (open = !open)}>
    <span></span><span></span><span></span>
  </button>
</header>

<style>
  /* No bar at all — just two links lying on the hero art, scrolling away with
     it. The hero's own logotype is the masthead. Nothing here is in flow, so
     the top of the screen belongs to the artwork. */
  .nav {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: 60;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    padding: 0.4rem clamp(1rem, 3vw, 2.5rem);
    /* No bar and no tint — the links sit straight on the hero art. They are set
       in ink rather than cream because cream on the teal is about 2.5:1, which
       is what the tint was there to rescue. */
    color: var(--ink);
    font-family: var(--font-ui);
    /* the empty width of the bar must not swallow clicks meant for the hero */
    pointer-events: none;
  }

  nav {
    display: flex;
    justify-self: end;
    pointer-events: auto;
    justify-content: center;
    gap: clamp(1rem, 2.5vw, 2.25rem);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  nav a {
    position: relative;
    padding: 0.35rem 0;
    text-decoration: none;
    /* a cream halo, so the ink holds up wherever a ray or a confetti bar
       happens to pass behind the link */
    text-shadow: 0 1px 3px rgb(255 243 214 / 0.5);
    transition: color 200ms ease;
  }

  nav a::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 4px;
    background: var(--yellow);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  nav a:hover { color: var(--cream); }
  nav a:hover::after { transform: scaleX(1); }

  .burger { display: none; }

  @media (max-width: 860px) {
    /* No bar at all — the hero's own logotype is the masthead. The burger sits
       out of flow so the hero starts at the top of the screen and the two land
       on the same line; absolute rather than fixed, so it scrolls away with the
       hero instead of riding over the archive. */
    .nav {
      grid-template-columns: minmax(0, 1fr) auto;
      row-gap: 0;
      /* clears the notch when a phone is held in landscape */
      padding: calc(0.5rem + env(safe-area-inset-top)) calc(clamp(0.8rem, 3vw, 1.5rem) + env(safe-area-inset-right))
        0.5rem calc(clamp(0.8rem, 3vw, 1.5rem) + env(safe-area-inset-left));
      background: none;
      /* the burger sits on the artwork, so it keeps the cream + drop shadow */
      color: var(--cream);
    }

    .nav.open { background: none; }

    .burger {
      display: grid;
      grid-row: 1;
      grid-column: 2;
      gap: 5px;
      place-content: center;
      /* 24px of bars needs the padding to clear a 44px touch target */
      min-width: 44px;
      min-height: 44px;
      justify-self: end;
      pointer-events: auto;
      /* no chip: it only ever sits over the hero's own artwork */
      filter: drop-shadow(0 2px 4px rgb(16 20 24 / 0.55));
    }

    .burger span {
      display: block;
      width: 24px;
      height: 3px;
      background: var(--cream);
      transition: transform 260ms ease, opacity 200ms ease;
    }

    .open .burger span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
    .open .burger span:nth-child(2) { opacity: 0; }
    .open .burger span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

    nav {
      grid-column: 1 / -1;
      justify-self: end;
      display: grid;
      width: min(15rem, 60vw);
      margin-top: 0.5rem;
      overflow: hidden;
      max-height: 0;
      gap: 0;
      border-radius: 10px;
      background: var(--ink);
      box-shadow: 4px 4px 0 rgb(0 0 0 / 0.35);
      pointer-events: auto;
      transition: max-height 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .open nav { max-height: 12rem; }

    nav a {
      padding: 0.7rem 1rem;
      text-align: right;
    }

    nav a + a { border-top: 2px solid color-mix(in srgb, var(--cream) 15%, transparent); }
  }
</style>
