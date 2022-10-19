import * as Comlink from "comlink";
import normalizeWheel from "normalize-wheel";

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

function initCollection(slug, domImages) {
  webglInited.addCollection(slug, domImages);
  webglInited.setCollection(slug);
  webglInited.setPosition(scroll, cursor);
  // webglInited.render();
  setTimeout(() => webglInited.render(), 0);
}

let webglInited;

const api = {
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
  onPageChange(ev) {
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
      } else {
        initCollection(ev.pathname, ev.domImages);
      }
    } else {
      webglInited.hideCollection();
    }
  },
  main(props) {
    let { container, dimensions, pathname, domImages } = props;
    webglInited = new WebglInit({
      container,
      dimensions,
    });
    initCollection(pathname, domImages);
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
      requestAnimationFrame(rafLoop);
    }

    rafLoop();
  },
};

Comlink.expose(api);
