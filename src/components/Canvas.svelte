<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  import normalizeWheel from "normalize-wheel";
  import { progress } from "../stores/progress";
  import collectionsData from "../data/collections.json";

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
  let dimensions = {
    width: canvas.offsetWidth,
    height: canvas.offsetHeight,
  };
  let scroll;
  let scrollHeight;
  let currentPath;

  function calcScrollHeight(slug) {
    let gap = (6 / 100) * dimensions.width;
    let padding = dimensions.width <= 376 ? 16 : 20;
    let width = dimensions.width - 2 * padding;
    let collectionHeight = 0;
    collectionsData
      .find((c) => c.slug === slug)
      .isLandscape.forEach((isLandscape) => {
        collectionHeight += isLandscape ? width / 1.5 : width / (2 / 3);
        collectionHeight += gap;
      });
    scrollHeight = collectionHeight - gap + (1 / 2) * dimensions.height;
  }

  onMount(async () => {
    progress.set(progress.get() + 17.3);

    const api = Comlink.wrap(calcWorker);

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
      currentPath = ev.pathname;
      calcScrollHeight(currentPath);
      if (currentPath) {
        if (webglInited.checkCollection(currentPath)) {
          webglInited.setCollection(currentPath);
          transitionFactor = 1.0;
          transitionStartTime = new Date();
          setTimeout(() => (transitionStartTime = null), 820);
        } else {
          initCollection(currentPath);
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

    function onResize(ev) {
      scroll = {
        ease: 0.05,
        current: 0,
        target: 0,
        last: 0,
        direction: "right",
      };
      dimensions = {
        width: ev.width,
        height: ev.height,
      };
      calcScrollHeight(currentPath);
      webglInited.resize(dimensions);
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
    window.addEventListener("resize", onResize);

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
