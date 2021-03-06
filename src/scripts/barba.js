import barba from '@barba/core';
import { animate } from 'motion';

import { handleWebgl } from './webgl-handler.js';

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

                handleWebgl();
                // new WebglInit(document.getElementById('webgl-canvas'));
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
