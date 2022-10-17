<script lang="js">
  import { onMount } from "svelte";

  let selectedCanvas;

  onMount(async () => {
    if (HTMLCanvasElement.prototype.transferControlToOffscreen) {
      selectedCanvas = (await import(`./OffscreenCanvas.svelte`)).default;
    } else {
      selectedCanvas = (await import(`./Canvas.svelte`)).default;
    }
  });
</script>

<svelte:component this={selectedCanvas} />
