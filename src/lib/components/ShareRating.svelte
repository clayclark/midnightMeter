<script lang="ts">
  import { onMount } from 'svelte'
  import {
    hasMulligan, ratingShareDescription, ratingShareTitle, ratingSlug, ratingStoryPath,
  } from '$lib/share'
  import type { Rating } from '$lib/types'

  export let rating: Rating
  export let mulligan = false

  /* Sits at the foot of the open card, where sharing belongs — it is the last
     thing you do, not the first. What changed is the weight: the card art is
     the reason anyone shares this, so the art leads and the buttons follow. */
  let busy: 'share' | 'save' | null = null
  let note = ''
  let noteTimer: ReturnType<typeof setTimeout>

  onMount(() => () => clearTimeout(noteTimer))

  /** True only where the platform will actually accept an image attachment. */
  const canAttachFile = (file: File) =>
    typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [file] })

  $: exactMulligan = mulligan && hasMulligan(rating)
  /* Portrait: this is the image people actually post. The landscape card
     still exists, but only as the og:image for link unfurls. */
  $: cardPath = ratingStoryPath(rating, exactMulligan)
  $: title = ratingShareTitle(rating, exactMulligan)
  $: description = ratingShareDescription(rating, exactMulligan)

  function flash(message: string): void {
    clearTimeout(noteTimer)
    note = message
    noteTimer = setTimeout(() => (note = ''), 2_400)
  }

  async function imageFile(): Promise<File> {
    const response = await fetch(cardPath)
    if (!response.ok) throw new Error(`Card request failed: ${response.status}`)
    const blob = await response.blob()
    return new File([blob], `${ratingSlug(rating)}${exactMulligan ? '-mulligan' : ''}-story.png`, { type: 'image/png' })
  }

  function download(file: File): void {
    const href = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = file.name
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1_000)
  }

  /**
   * Opens the device share sheet with the PNG attached. Where the platform
   * refuses file attachments — most desktop browsers — it saves the image
   * instead. It never falls back to sharing a link: the button says PNG.
   */
  async function sharePng(): Promise<void> {
    busy = 'share'
    try {
      const file = await imageFile()

      if (canAttachFile(file)) {
        await navigator.share({ files: [file], title, text: description })
        flash('Card sent')
        return
      }

      download(file)
      flash('No image sharing here · PNG saved')
    } catch (error) {
      /* Dismissing the sheet is a choice, not a failure. */
      if (error instanceof DOMException && error.name === 'AbortError') return
      flash('Sharing failed')
    } finally {
      busy = null
    }
  }

  async function savePng(): Promise<void> {
    busy = 'save'
    try {
      download(await imageFile())
      flash('PNG saved')
    } catch {
      flash('Download failed')
    } finally {
      busy = null
    }
  }
</script>

<aside class="share" aria-label="Share this rating">
  <figure class="share__frame">
    <img class="share__card" src={cardPath} alt="" width="1080" height="1920" loading="lazy" decoding="async" />
  </figure>

  <div class="share__body">
    <div class="share__actions">
      <button class="share__go" type="button" disabled={busy !== null} on:click={sharePng}>
        {busy === 'share' ? 'Opening…' : 'Share PNG'}
      </button>
      <button type="button" disabled={busy !== null} on:click={savePng}>
        {busy === 'save' ? 'Saving…' : 'Save PNG'}
      </button>
    </div>

    <p class="share__note" aria-live="polite">{note}</p>
  </div>
</aside>

<style>
  /* A deliberate object in the site's own language — ink keyline, hard offset
     shadow — instead of the soft grey tray it was. */
  .share {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    align-items: center;
    gap: clamp(0.8rem, 2vw, 1.4rem);
    margin: 0.15rem 0.6rem 0.9rem;
    padding: clamp(0.7rem, 1.6vw, 1rem);
    border: 3px solid var(--ink);
    border-radius: 6px;
    background: linear-gradient(150deg, #1d232a, #12161a);
    box-shadow: 5px 5px 0 var(--magenta);
  }

  /* Tipped a degree and shadowed, so it reads as a physical card sitting on
     the surface rather than an inline thumbnail. */
  .share__frame {
    margin: 0;
    rotate: -1.2deg;
    transition: rotate 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .share:hover .share__frame { rotate: 0deg; }

  .share__card {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1080 / 1920;
    border: 3px solid var(--ink);
    border-radius: 4px;
    background: var(--ink);
    box-shadow: 4px 4px 0 rgb(0 0 0 / 0.45);
    object-fit: cover;
  }

  /* Just the actions now — the card speaks for itself. */
  .share__body { display: grid; gap: 0.3rem; align-content: center; }

  .share__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .share__actions button {
    min-height: 40px;
    padding: 0.45rem 1rem;
    border: 3px solid var(--ink);
    border-radius: 4px;
    background: rgb(255 255 255 / 0.07);
    box-shadow: 3px 3px 0 rgb(0 0 0 / 0.45);
    color: var(--cream);
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: background 180ms ease, color 180ms ease, translate 160ms ease, box-shadow 160ms ease;
  }

  /* Sharing is the headline action; saving is the quiet alternative. */
  .share__actions .share__go {
    background: var(--yellow);
    color: var(--ink);
  }

  .share__actions button:hover:not(:disabled) {
    background: var(--cream);
    color: var(--ink);
  }

  .share__actions .share__go:hover:not(:disabled) { background: var(--yellow); }

  /* the button presses into its own shadow */
  .share__actions button:active:not(:disabled) {
    translate: 3px 3px;
    box-shadow: 0 0 0 rgb(0 0 0 / 0.45);
  }

  .share__actions button:disabled { opacity: 0.55; cursor: progress; }

  .share__note {
    min-height: 1rem;
    margin: 0.1rem 0 0;
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--green);
  }

  @media (max-width: 640px) {
    /* The card goes full width rather than shrinking to a stamp — at phone
       widths a side-by-side preview is too small to read. */
    .share {
      /* stays side by side: a full-width 9:16 preview would be 600px tall */
      grid-template-columns: 6rem minmax(0, 1fr);
      gap: 0.7rem;
      margin-inline: 0.35rem;
      padding: 0.6rem;
    }

    .share__frame { rotate: -0.8deg; }
    .share__actions button { flex: 1 1 8rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .share__frame,
    .share:hover .share__frame { rotate: 0deg; }
  }
</style>
