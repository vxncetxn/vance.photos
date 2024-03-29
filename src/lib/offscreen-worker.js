import * as Comlink from "comlink";
import normalizeWheel from "normalize-wheel";
import { atom } from "nanostores";
import { initTransferHandler } from "./event.transferhandler";
import { WebglInit } from "./webgl";
import { calcScrollHeight } from "./calcScrollHeight";
import { lerp } from "./lerp";

initTransferHandler();

let dimensions;
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
let touch = {
  startY: 0,
  deltaY: 0,
};
let transitionStartTime = null;
let transitionFactor = 1.0;
let currentPath;
let webglInited;
let progress = atom(48.8);

const api = {
  getProgress() {
    return progress.get();
  },
  getScrollCurrent() {
    return scroll.current;
  },
  onTouchStart(ev) {
    touch.startY = ev.touches[0].clientY;
  },
  onTouchMove(ev) {
    touch.deltaY = ev.touches[0].clientY - startY;

    scroll.target += Math.min(Math.max(touch.deltaY, -150), 150) * 0.5;

    if (dimensions.width <= 768) {
      scroll.target = Math.min(
        Math.max(scroll.target, 0),
        scrollHeight - dimensions.height + 40
      );
    }
  },
  onWheel(ev) {
    const normalized = normalizeWheel(ev);
    const { pixelX, pixelY } = normalized;
    let speed;

    if (Math.abs(pixelX) > Math.abs(pixelY)) {
      speed = pixelX;
    } else {
      speed = pixelY;
    }

    scroll.target += Math.min(Math.max(speed, -150), 150) * 0.5;

    if (dimensions.width <= 768) {
      scroll.target = Math.min(
        Math.max(scroll.target, 0),
        scrollHeight - dimensions.height + 40
      );
    }
  },
  onMouseMove(ev) {
    cursor.target = ev.clientY;
  },
  async onPageChange(ev) {
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
  },
  onResize(ev) {
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
    scrollHeight = calcScrollHeight(currentPath, dimensions);
    webglInited.resize(dimensions);
  },
  main(props) {
    let {
      container,
      dimensions: trfDimensions,
      scrollHeight: trfScrollHeight,
    } = props;

    dimensions = trfDimensions;
    scrollHeight = trfScrollHeight;

    webglInited = new WebglInit({
      container,
      dimensions: trfDimensions,
      progress,
    });

    function rafLoop() {
      if (
        Math.abs(scroll.target - scroll.current) > 1 ||
        Math.abs(cursor.target - cursor.current) > 1
      ) {
        scroll.current = lerp(scroll.current, scroll.target, scroll.ease);
        if (scroll.current > scroll.last) {
          scroll.direction = "right";
        } else {
          scroll.direction = "left";
        }

        cursor.current = lerp(cursor.current, cursor.target, cursor.ease);

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
  },
};

Comlink.expose(api);
