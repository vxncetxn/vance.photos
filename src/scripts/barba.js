import barba from '@barba/core';
import { animate } from 'motion';
import imagesLoaded from 'imagesLoaded';
import normalizeWheel from 'normalize-wheel';

import WebglWorker from './webgl-worker?worker';
import { WebglInit } from '@/scripts/webgl.js';

let scrollTarget = 0;
let cursorTarget = 0;

barba.init({
    views: [
        {
            namespace: 'index',
            beforeEnter() {
                document.body.style.overflow = 'auto';
            },
        },
        {
            namespace: 'collection',
            beforeEnter() {
                document.body.style.overflow = 'hidden';

                const canvas = document.getElementById('webgl-canvas');

                if (canvas.transferControlToOffscreen) {
                    const offscreen = canvas.transferControlToOffscreen();
                    const worker = new WebglWorker();

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
                    new WebglInit(canvas);
                }
            },
        },
    ],
    transitions: [
        {
            name: 'sun-from-index',
            from: {
                namespace: ['index'],
            },
            leave() {
                let sunOne = document.querySelector('.sun-one');
                let sunTwo = document.querySelector('.sun-two');
                let texts = document.querySelectorAll('.mo-text');

                animate(
                    sunOne,
                    {
                        transform: 'translate(-50%, -50%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                ).finished.then(() => {
                    // sunOne.style.animation =
                    //     'throb-collection-one 8s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                });

                animate(
                    sunTwo,
                    {
                        transform: 'translate(-20%, -20%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                ).finished.then(() => {
                    // sunTwo.style.animation =
                    //     'throb-collection-two 10s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                });

                return animate(
                    texts,
                    {
                        transform: 'translateY(120%)',
                    },
                    { duration: 0.8 },
                ).finished;
            },
            enter(data) {
                let texts = data.next.container.querySelectorAll('.mo-text');

                animate(texts, { transform: ['translateY(-120%)', 'translateY(0)'] }, { duration: 0.8 });
            },
        },
        {
            name: 'sun-from-collection',
            from: {
                namespace: ['collection'],
            },
            leave() {
                let sunOne = document.querySelector('.sun-one');
                let sunTwo = document.querySelector('.sun-two');
                let texts = document.querySelectorAll('.mo-text');

                animate(
                    sunOne,
                    {
                        transform: 'translate(45%, 45%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                ).finished.then(() => {
                    // sunOne.style.animation = 'throb-index-one 8s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                });

                animate(
                    sunTwo,
                    {
                        transform: 'translate(90%, 20%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                ).finished.then(() => {
                    // sunTwo.style.animation = 'throb-index-two 10s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                });

                return animate(
                    texts,
                    {
                        transform: 'translateY(120%)',
                    },
                    { duration: 0.8 },
                ).finished;
            },
            enter(data) {
                let texts = data.next.container.querySelectorAll('.mo-text');

                animate(texts, { transform: ['translateY(-120%)', 'translateY(0)'] }, { duration: 0.8 });
            },
        },
    ],
});
