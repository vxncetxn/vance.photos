<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  import { progress } from "../stores/progress";

  const offscreenWorker = new Worker(
    new URL("../lib/offscreen-worker", import.meta.url),
    {
      type: "module",
    }
  );
  import { throttle } from "../lib/throttle";
  import { initTransferHandler } from "../lib/event.transferhandler";

  initTransferHandler();
  let canvas;

  onMount(async () => {
    progress.set(progress.get() + 17.3);

    const offscreen = canvas.transferControlToOffscreen();
    const api = Comlink.wrap(offscreenWorker);

    async function onWheelMain() {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        let scrollCurrent = await api.getScrollCurrent();
        [...document.querySelectorAll(".covered-text")].forEach((elem) => {
          elem.style.opacity = 1 - (scrollCurrent / window.innerHeight) * 2;
        });
      }
    }

    window.addEventListener("mousewheel", api.onWheel.bind(api), {
      passive: true,
    });
    window.addEventListener("wheel", api.onWheel.bind(api), { passive: true });
    window.addEventListener("wheel", onWheelMain, { passive: true });
    window.addEventListener(
      "mousemove",
      throttle(api.onMouseMove.bind(api), 100)
    );
    window.addEventListener("pagechange", api.onPageChange.bind(api));
    window.addEventListener("resize", api.onResize.bind(api));

    offscreenWorker.postMessage({
      type: "size",
      width: window.innerWidth,
      height: window.innerHeight,
    });

    await api.main(
      Comlink.transfer(
        {
          container: offscreen,
          dimensions: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          scrollHeight: document.documentElement.scrollHeight,
          dpr: Math.min(window.devicePixelRatio, 2),
        },
        [offscreen]
      )
    );

    const intervalId = setInterval(async () => {
      let receivedProgress = await api.getProgress();
      progress.set(receivedProgress);

      if (receivedProgress >= 100) {
        clearInterval(intervalId);
      }
    }, 100);
  });
</script>

<canvas
  id="canvas"
  bind:this={canvas}
  class="fixed top-0 left-0 w-screen h-screen overflow-hidden"
/>
