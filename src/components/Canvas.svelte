<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  import normalizeWheel from "normalize-wheel";
  import { progress } from "../stores/progress";
  import imagesLoaded from "imagesloaded";

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
  let scroll;

  onMount(async () => {
    progress.set(progress.get() + 17.3);

    const api = Comlink.wrap(calcWorker);

    let dimensions = {
      width: canvas.offsetWidth,
      height: canvas.offsetHeight,
    };

    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll(".image"),
        { background: true },
        resolve
      );
    });
    let scrollHeight;
    await Promise.all([preloadImages]).then(async () => {
      scrollHeight = document.documentElement.scrollHeight;
    });

    const cursor = {
      ease: 0.05,
      current: 0,
      target: 0,
      last: 0,
    };
    scroll = {
      ease: 0.05,
      current: 0,
      target: 0,
      last: 0,
      direction: "right",
    };
    let transitionStartTime = null;
    let transitionFactor = 1.0;

    async function initCollection(slug) {
      await webglInited.addCollection(slug);
      webglInited.setCollection(slug);
      webglInited.setPosition(scroll, cursor);
    }

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

      if (!window.matchMedia("(min-width: 768px)").matches) {
        scroll.target = Math.min(
          Math.max(scroll.target, 0),
          scrollHeight - dimensions.height + 40
        );
      }
    }

    function onMouseMove(ev) {
      cursor.target = ev.clientY;
    }

    function onPageChange(ev) {
      scroll = {
        ease: 0.05,
        current: 0,
        target: 0,
        last: 0,
        direction: "right",
      };
      scrollHeight = ev.scrollHeight;
      if (ev.pathname) {
        if (webglInited.checkCollection(ev.pathname)) {
          webglInited.setCollection(ev.pathname);
          transitionFactor = 1.0;
          transitionStartTime = new Date();
          setTimeout(() => (transitionStartTime = null), 820);
        } else {
          initCollection(ev.pathname);
          transitionFactor = 1.0;
          transitionStartTime = new Date();
          setTimeout(() => (transitionStartTime = null), 820);
        }
      } else {
        transitionFactor = -1.0;
        transitionStartTime = new Date();
        setTimeout(() => {
          transitionStartTime = null;
          webglInited.hideCollection();
        }, 820);
      }
    }

    let webglInited = new WebglInit({
      container: canvas,
      dimensions: { width: canvas.offsetWidth, height: canvas.offsetHeight },
      progress,
    });

    window.addEventListener("mousewheel", onWheel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", throttle(onMouseMove, 100));
    window.addEventListener("pagechange", onPageChange);

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

      if (transitionStartTime) {
        webglInited.transition(transitionStartTime, transitionFactor);
        webglInited.render();
      }

      requestAnimationFrame(rafLoop);
    }

    rafLoop();
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed top-0 left-0 w-screen h-screen overflow-hidden"
/>
