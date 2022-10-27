<script lang="js">
  import { onMount } from "svelte";
  import * as Comlink from "comlink";
  import normalizeWheel from "normalize-wheel";
  import { progress } from "../stores/progress";
  import { calcScrollHeight } from "../lib/calcScrollHeight";
  import { throttle } from "../lib/throttle";
  import { initTransferHandler } from "../lib/event.transferhandler";
  import { WebglInit } from "../lib/webgl";
  const calcWorker = new Worker(
    new URL("../lib/calc-worker", import.meta.url),
    {
      type: "module",
    }
  );

  initTransferHandler();

  let canvas;
  let dimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  let scrollHeight;
  let cursor = {
    ease: 0.05,
    current: 0,
    target: 0,
    last: 0,
  };
  let scroll = {
    ease: 0.05,
    current: 0,
    target: 0,
    last: 0,
    direction: "right",
  };
  let transitionStartTime = null;
  let transitionFactor = 1.0;
  let currentPath;

  onMount(async () => {
    progress.set(progress.get() + 17.3);

    const api = Comlink.wrap(calcWorker);

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

        [...document.querySelectorAll(".covered-text")].forEach((elem) => {
          elem.style.opacity = 1 - (scroll.current / dimensions.height) * 2;
        });
      }
    }

    function onMouseMove(ev) {
      cursor.target = ev.clientY;
    }

    async function onPageChange(ev) {
      scroll = {
        ease: 0.05,
        current: 0,
        target: 0,
        last: 0,
        direction: "right",
      };
      currentPath = ev.pathname;
      scrollHeight = calcScrollHeight(currentPath, dimensions);
      if (currentPath) {
        await webglInited.setCollection(currentPath);
        transitionFactor = 1.0;
        transitionStartTime = new Date();
        setTimeout(() => (transitionStartTime = null), 820);
      } else {
        transitionFactor = -1.0;
        transitionStartTime = new Date();
        setTimeout(() => {
          transitionStartTime = null;
          webglInited.hideCollection();
        }, 820);
      }
    }

    function onResize() {
      scroll = {
        ease: 0.05,
        current: 0,
        target: 0,
        last: 0,
        direction: "right",
      };
      dimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      scrollHeight = calcScrollHeight(currentPath, dimensions);
      webglInited.resize(dimensions);
    }

    window.addEventListener("mousewheel", onWheel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    window.addEventListener("mousemove", throttle(onMouseMove, 100));
    window.addEventListener("pagechange", onPageChange);
    window.addEventListener("resize", onResize);

    let webglInited = new WebglInit({
      container: canvas,
      dimensions: { width: window.innerWidth, height: window.innerHeight },
      progress,
    });

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
