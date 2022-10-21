import * as Comlink from "comlink";
import normalizeWheel from "normalize-wheel";
import { atom } from "nanostores";

import { initTransferHandler } from "./event.transferhandler";
import { WebglInit } from "./webgl";

initTransferHandler();

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

const cursor = {
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

async function initCollection(slug, domImages) {
  await webglInited.addCollection(slug, domImages);
  webglInited.setCollection(slug);
  webglInited.setPosition(scroll, cursor);
}

let webglInited;
let progress = atom(48.8);

const api = {
  getProgress() {
    return progress.get();
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
    if (ev.pathname) {
      if (webglInited.checkCollection(ev.pathname)) {
        webglInited.setCollection(ev.pathname);
        transitionFactor = 1.0;
        transitionStartTime = new Date();
        setTimeout(() => (transitionStartTime = null), 820);
      } else {
        await initCollection(ev.pathname, ev.domImages);
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
  },
  main(props) {
    let { container, dimensions, pathname, domImages } = props;
    webglInited = new WebglInit({
      container,
      dimensions,
      progress,
    });
    if (pathname) {
      initCollection(pathname, domImages);
    }
    // webglInited.setPosition(scroll, cursor);

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
