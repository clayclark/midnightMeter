<script lang="ts">
  import { page } from '$app/stores'
  import Site from '$lib/pop/Site.svelte'

  const description = 'Every Midnight Meter verdict from The Midnight Boys, including year-end mulligans, kept on the record by a fan.'
  $: canonicalUrl = `${$page.url.origin}${$page.url.pathname}`
  // Keep a versioned filename for preview crawlers: X, Messages, Slack, and
  // Discord cache image URLs far longer than the page that references them.
  $: socialImage = new URL('/midnight-meter-social-v2.png', $page.url).href

</script>

<svelte:head>
  <title>Midnight Meter</title>
  <meta name="description" content={description} />
  <meta name="theme-color" content="#101418" />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Midnight Meter" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content="Midnight Meter — every verdict on record" />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={socialImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="The Midnight Meter with Van, Charles, Jomi, and Steve" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Midnight Meter — every verdict on record" />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={socialImage} />
  <meta name="twitter:image:alt" content="The Midnight Meter with Van, Charles, Jomi, and Steve" />
</svelte:head>

<Site />
