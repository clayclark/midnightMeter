<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'

  /** 86 rows is a long thumb-scroll — offer a way back without a swipe marathon. */
  let show = false

  onMount(() => {
    const onScroll = () => { show = window.scrollY > 1400 }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  })
</script>

{#if show}
  <a class="top" href="#top" transition:fly={{ y: 16, duration: 200 }}>
    <span aria-hidden="true">↑</span>
    <span class="sr-only">Back to top</span>
  </a>
{/if}

<style>
  .top {
    position: fixed;
    right: max(0.9rem, env(safe-area-inset-right));
    bottom: max(0.9rem, env(safe-area-inset-bottom));
    z-index: 70;
    display: none;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    box-shadow: 3px 3px 0 var(--ink), 0 8px 22px rgb(0 0 0 / 0.4);
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1.3rem;
    line-height: 1;
    text-decoration: none;
  }

  .top:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }

  @media (max-width: 860px) {
    .top { display: grid; }
  }
</style>
