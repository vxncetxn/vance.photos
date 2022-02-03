import * as Comlink from 'comlink';
import imagesLoaded from 'imagesLoaded';
import normalizeWheel from 'normalize-wheel';

import { initTransferHandler } from './event.transferhandler';
import OffscreenWorker from './offscreen-worker?worker';
import CalcWorker from './calc-worker?worker';
import { WebglInit } from './webgl';

initTransferHandler();

let scrollTarget = 0;
let cursorTarget = 0;

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
};
let direction = 'right';

export async function handleWebgl() {
    const canvas = document.getElementById('webgl-canvas');

    if (!canvas.transferControlToOffscreen) {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new OffscreenWorker();

        function onWheel(event) {
            const normalized = normalizeWheel(event);
            const speed = normalized.pixelY;

            scrollTarget += speed * 0.5;

            worker.postMessage({ type: 'scrollFn', value: scrollTarget });
        }

        function onMouseMove(event) {
            cursorTarget = event.clientY;

            worker.postMessage({ type: 'cursorFn', value: cursorTarget });
        }

        worker.postMessage({
            type: 'size',
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
        });
        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.image'), { background: true }, resolve);
        });

        window.addEventListener('mousewheel', onWheel, { passive: true });
        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('mousemove', onMouseMove);

        Promise.all([preloadImages]).then(() => {
            worker.postMessage({
                type: 'images',
                images: [...document.querySelectorAll('.image')].map((img) => {
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
            worker.postMessage({ type: 'main', canvas: offscreen }, [offscreen]);
        });
    } else {
        const worker = new CalcWorker();
        const api = Comlink.wrap(worker);

        window.addEventListener('mousewheel', api.onWheel.bind(api), { passive: true });
        window.addEventListener('wheel', api.onWheel.bind(api), { passive: true });
        window.addEventListener('mousemove', api.onMouseMove.bind(api));

        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.image'), { background: true }, resolve);
        });

        Promise.all([preloadImages]).then(async () => {
            const scroll = await api.scroll;
            const cursor = await api.cursor;

            let webglInited = new WebglInit({
                container: canvas,
                dimensions: { width: canvas.offsetWidth, height: canvas.offsetHeight },
                images: [...document.querySelectorAll('.image')].map((img) => {
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
                await api.process();
                const scroll = await api.scroll;
                const cursor = await api.cursor;

                if (Math.abs(scroll.last - scroll.current) > 0.1 || Math.abs(cursor.last - cursor.current) > 0.1) {
                    webglInited.setPosition(scroll, cursor);
                    webglInited.render();
                }

                await api.makeLast();

                webglInited.render();
                requestAnimationFrame(rafLoop);
            }

            rafLoop();
        });
    }
}
