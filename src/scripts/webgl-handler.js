import * as Comlink from 'comlink';
import imagesLoaded from 'imagesLoaded';

import { initTransferHandler } from './event.transferhandler';
import OffscreenWorker from './offscreen-worker?worker';
import CalcWorker from './calc-worker?worker';
import { WebglInit } from './webgl';

initTransferHandler();

export async function handleWebgl() {
    const canvas = document.getElementById('webgl-canvas');

    if (canvas.transferControlToOffscreen) {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new OffscreenWorker();
        const api = Comlink.wrap(worker);

        window.addEventListener('mousewheel', api.onWheel.bind(api), { passive: true });
        window.addEventListener('wheel', api.onWheel.bind(api), { passive: true });
        window.addEventListener('mousemove', api.onMouseMove.bind(api));

        worker.postMessage({
            type: 'size',
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
        });
        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.image'), { background: true }, resolve);
        });

        Promise.all([preloadImages]).then(async () => {
            await api.main(
                Comlink.transfer(
                    {
                        container: offscreen,
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
                        dpr: Math.min(window.devicePixelRatio, 2),
                    },
                    [offscreen],
                ),
            );
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
                dpr: Math.min(window.devicePixelRatio, 2),
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
