import * as Comlink from 'comlink';
import normalizeWheel from 'normalize-wheel';

import { initTransferHandler } from './event.transferhandler';
import { WebglInit } from './webgl';

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
    main(props) {
        let { container, dimensions, images } = props;
        let webglInited = new WebglInit({
            container,
            dimensions,
            images,
        });
        webglInited.setPosition(scroll, cursor);

        function rafLoop() {
            if (Math.abs(scroll.target - scroll.current) > 1 || Math.abs(cursor.target - cursor.current) > 1) {
                scroll.current = lerp(scroll.current, scroll.target, scroll.ease);
                if (scroll.current > scroll.last) {
                    scroll.direction = 'right';
                } else {
                    scroll.direction = 'left';
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
