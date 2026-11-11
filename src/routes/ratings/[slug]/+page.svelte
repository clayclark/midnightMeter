<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import Site from '$lib/pop/Site.svelte'
  import { HOSTS, formatDate, getAverage } from '$lib/data'
  import { hasMulligan, ratingCardPath, ratingForView } from '$lib/share'
  import type { PageData } from './$types'

  export let data: PageData

  /* Mulligans are the site's default view, so the preview matches what a
     first-time visitor sees when the page opens. */
  $: rating = data.rating
  $: shown = ratingForView(rating, true)
  $: scores = HOSTS.flatMap(({ key, short }) => {
    const score = shown.scores[key]
    return score === null ? [] : [`${short} ${score}`]
  })
  $: description = `How The Midnight Boys rated ${rating.title} on ${formatDate(rating.ratedAt)}: ${scores.join(', ')}. Average ${getAverage(shown).toFixed(2)}${hasMulligan(rating) ? ', after year-end Mulligans' : ''}.`
</script>

<Seo
  title={`${rating.title}: Midnight Boys Ratings | Midnight Meter`}
  {description}
  image={ratingCardPath(rating, true)}
  imageAlt={`Midnight Meter rating card for ${rating.title}`}
/>

<Site initialOpenId={rating.id} />
