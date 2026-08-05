<script lang="ts">
  export let size = 18
  export let direction: 'right' | 'down' | 'up-right' = 'right'

  $: rotation = direction === 'down' ? 90 : direction === 'up-right' ? -45 : 0
</script>

<svg
  aria-hidden="true"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  style={`transform: rotate(${rotation}deg)`}
>
  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" />
</svg>
