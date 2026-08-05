<script lang="ts">
  import { onMount } from 'svelte'
  import Archive from '$lib/pop/Archive.svelte'
  import Footer from '$lib/pop/Footer.svelte'
  import Hero from '$lib/pop/Hero.svelte'
  import Nav from '$lib/pop/Nav.svelte'
  import Scale from '$lib/pop/Scale.svelte'
  import Ticker from '$lib/pop/Ticker.svelte'
  import TopButton from '$lib/pop/TopButton.svelte'
  import { initializeMulligans } from '$lib/mulligans'

  export let initialOpenId: string | null = null
  export let initialMulligans: boolean | undefined = undefined

  onMount(() => {
    initializeMulligans(initialMulligans)

    const root = document.documentElement
    const usePointerFocus = () => { root.dataset.inputModality = 'pointer' }
    const useKeyboardFocus = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement
        && event.target.matches('input, textarea, select, [contenteditable="true"]')
      if (event.key === 'Tab' || (event.key === '/' && !typing)) {
        root.dataset.inputModality = 'keyboard'
      }
    }

    window.addEventListener('pointerdown', usePointerFocus, true)
    window.addEventListener('keydown', useKeyboardFocus, true)

    return () => {
      window.removeEventListener('pointerdown', usePointerFocus, true)
      window.removeEventListener('keydown', useKeyboardFocus, true)
      delete root.dataset.inputModality
    }
  })
</script>

<div class="pop">
  <Nav />
  <main>
    <Hero />
    <Ticker />
    <Archive {initialOpenId} />
    <Scale />
  </main>
  <Footer />
  <TopButton />
</div>

<style>
  .pop {
    position: relative;
    --ink: #101418;
    --cream: #fff3d6;
    --teal: #1aa39c;
    --teal-deep: #0c6f6d;
    --yellow: #ffd400;
    --gold: #e0a800;
    --magenta: #e6007e;
    --magenta-on-dark: #ff4da6;
    --magenta-on-cream: #cc0070;
    --green: #46b93f;
    --cyan: #22c7e8;
    --orange: #f26522;
    --red: #e8451f;
    --host-van: var(--cyan);
    --host-charles: var(--magenta-on-dark);
    --host-jomi: var(--green);
    --host-steve: var(--yellow);
    --font-display: 'Anton', 'Archivo Black', system-ui, sans-serif;
    --font-ui: 'Barlow Condensed', system-ui, sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    background: var(--ink);
    color: var(--cream);
    font-family: var(--font-body);
  }

  .pop :global(a:focus-visible),
  .pop :global(button:focus-visible),
  .pop :global(input:focus-visible),
  .pop :global(select:focus-visible) {
    outline: 3px solid var(--yellow);
    outline-offset: 3px;
  }

  /* Safari can retain :focus-visible after a tap. Pointer interaction already
     has pressed/selected feedback; reserve the outline for keyboard travel. */
  :global(html[data-input-modality='pointer']) .pop :global(a:focus-visible),
  :global(html[data-input-modality='pointer']) .pop :global(button:focus-visible),
  :global(html[data-input-modality='pointer']) .pop :global(input:focus-visible),
  :global(html[data-input-modality='pointer']) .pop :global(select:focus-visible) {
    outline: none;
  }
</style>
