<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  import imagesLoaded from "imagesloaded";
  import normalizeWheel from "normalize-wheel";

  const calcWorker = new Worker(
    new URL("../lib/calc-worker", import.meta.url),
    {
      type: "module",
    }
  );
  import { throttle } from "../lib/throttle";
  import { initTransferHandler } from "../lib/event.transferhandler";
  import { WebglInit } from "../lib/webgl";

  initTransferHandler();
  let canvas;

  onMount(() => {
    const api = Comlink.wrap(calcWorker);

    const cursor = {
      ease: 0.05,
      current: 0,
      target: 0,
      last: 0,
    };
    const scroll = {
      ease: 0.05,
      current: 0,
      target: 0,
      last: 0,
      direction: "right",
    };

    function onWheel(ev) {
      const normalized = normalizeWheel(ev);
      const { pixelX, pixelY } = normalized;
      let speed;

      if (Math.abs(pixelX) > Math.abs(pixelY)) {
        speed = pixelX;
      } else {
        speed = pixelY;
      }

      scroll.target += Math.min(Math.max(speed, -150), 150) * 0.5;
    }

    function onMouseMove(ev) {
      cursor.target = ev.clientY;
    }

    window.addEventListener("mousewheel", onWheel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", throttle(onMouseMove, 100));

    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll(".image"),
        { background: true },
        resolve
      );
    });

    Promise.all([preloadImages]).then(async () => {
      let webglInited = new WebglInit({
        container: canvas,
        dimensions: { width: canvas.offsetWidth, height: canvas.offsetHeight },
        images: [...document.querySelectorAll(".image")].map((img) => {
          const bounds = img.getBoundingClientRect();
          return {
            src: img.src,
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          };
        }),
      });
      webglInited.setPosition(scroll, cursor);

      async function rafLoop() {
        if (
          Math.abs(scroll.target - scroll.current) > 1 ||
          Math.abs(cursor.target - cursor.current) > 1
        ) {
          let { newScrollCurrent, newDirection, newCursorCurrent } =
            await api.process(scroll, cursor);
          scroll.current = newScrollCurrent;
          scroll.direction = newDirection;
          cursor.current = newCursorCurrent;

          webglInited.setPosition(scroll, cursor);

          scroll.last = scroll.current;
          cursor.last = cursor.current;

          webglInited.render();
        }
        requestAnimationFrame(rafLoop);
      }

      rafLoop();
    });
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed top-0 left-0 w-screen h-screen overflow-hidden"
/>
