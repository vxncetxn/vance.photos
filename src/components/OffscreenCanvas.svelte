<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  // import imagesLoaded from "imagesloaded";

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

  onMount(() => {
    const offscreen = canvas.transferControlToOffscreen();
    const api = Comlink.wrap(offscreenWorker);

    window.addEventListener("mousewheel", api.onWheel.bind(api), {
      passive: true,
    });
    window.addEventListener("wheel", api.onWheel.bind(api), { passive: true });
    window.addEventListener(
      "mousemove",
      throttle(api.onMouseMove.bind(api), 100)
    );
    window.addEventListener("pagechange", api.onPageChange.bind(api));

    offscreenWorker.postMessage({
      type: "size",
      width: canvas.offsetWidth,
      height: canvas.offsetHeight,
    });

    let pathname = new URL(window.location.href).pathname.slice(1);
    api.main(
      Comlink.transfer(
        {
          container: offscreen,
          dimensions: {
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
          },
          pathname,
          domImages: pathname
            ? [...document.querySelectorAll(".image")].map((img) => {
                const bounds = img.getBoundingClientRect();
                const url = new URL(img.src);
                return {
                  src: url.origin + url.pathname,
                  top: bounds.top,
                  left: bounds.left,
                  width: bounds.width,
                  height: bounds.height,
                };
              })
            : null,
          dpr: Math.min(window.devicePixelRatio, 2),
        },
        [offscreen]
      )
    );

    // const preloadImages = new Promise((resolve, reject) => {
    //   imagesLoaded(
    //     document.querySelectorAll(".image"),
    //     { background: true },
    //     resolve
    //   );
    // });

    // Promise.all([preloadImages]).then(async () => {
    //   await api.main(
    //     Comlink.transfer(
    //       {
    //         container: offscreen,
    //         dimensions: {
    //           width: canvas.offsetWidth,
    //           height: canvas.offsetHeight,
    //         },
    //         images: [...document.querySelectorAll(".image")].map((img) => {
    //           const bounds = img.getBoundingClientRect();
    //           const url = new URL(img.src);
    //           return {
    //             src: url.origin + url.pathname,
    //             top: bounds.top,
    //             left: bounds.left,
    //             width: bounds.width,
    //             height: bounds.height,
    //           };
    //         }),
    //         dpr: Math.min(window.devicePixelRatio, 2),
    //       },
    //       [offscreen]
    //     )
    //   );
    // });
  });
</script>

<canvas
  id="canvas"
  bind:this={canvas}
  class="fixed top-0 left-0 w-screen h-screen overflow-hidden"
/>
