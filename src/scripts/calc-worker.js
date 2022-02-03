import * as Comlink from 'comlink';
import normalizeWheel from 'normalize-wheel';

import { initTransferHandler } from './event.transferhandler';

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
const scroll = {
    ease: 0.05,
    current: 0,
    target: 0,
    last: 0,
    direction: 'right',
};

const api = {
    onWheel(ev) {
        const normalized = normalizeWheel(ev);
        const speed = normalized.pixelY;

        scroll.target += speed * 0.5;
    },
    onMouseMove(ev) {
        cursor.target = ev.clientY;
    },
    process() {
        scroll.current = lerp(scroll.current, scroll.target, scroll.ease);
        if (scroll.current > scroll.last) {
            scroll.direction = 'right';
        } else {
            scroll.direction = 'left';
        }

        cursor.current = lerp(cursor.current, cursor.target, cursor.ease);
    },
    makeLast() {
        scroll.last = scroll.current;
        cursor.last = cursor.current;
    },
    scroll,
    cursor,
};

Comlink.expose(api);
