import barba from '@barba/core';
import { animate } from 'motion';

// import { WebglInit } from '@/scripts/webgl.js';

barba.init({
    views: [
        {
            namespace: 'collection',
            beforeEnter() {
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

                sunOne.classList.remove('sun-one-index-anim');
                // sunOne.classList.add('sun-one-collection-anim');
                sunTwo.classList.remove('sun-two-index-anim');
                // sunTwo.classList.add('sun-two-collection-anim');

                animate(
                    sunOne,
                    {
                        transform: 'translate(-50%, -50%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                );

                animate(
                    sunTwo,
                    {
                        transform: 'translate(-20%, -20%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                );

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

                animate(texts, { transform: ['translateY(-120%)', 'translateY(0)'] }, { duration: 0.8 }).finished.then(
                    () => {
                        let sunOne = document.querySelector('.sun-one');
                        let sunTwo = document.querySelector('.sun-two');

                        // sunOne.style.animation =
                        //     'throb-collection-one 8s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                        // sunTwo.style.animation =
                        //     'throb-collection-two 10s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';

                        // sunOne.classList.remove('sun-one-index-anim');
                        sunOne.classList.add('sun-one-collection-anim');
                        // sunTwo.classList.remove('sun-two-index-anim');
                        sunTwo.classList.add('sun-two-collection-anim');
                    },
                );
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

                sunOne.classList.remove('sun-one-collection-anim');
                // sunOne.classList.add('sun-one-index-anim');
                sunTwo.classList.remove('sun-two-collection-anim');
                // sunTwo.classList.add('sun-two-index-anim');

                animate(
                    sunOne,
                    {
                        transform: 'translate(45%, 45%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                );

                animate(
                    sunTwo,
                    {
                        transform: 'translate(90%, 20%)',
                    },
                    {
                        duration: 1.6,
                        easing: [0.2, 0.125, 0, 0.73],
                    },
                );

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

                animate(texts, { transform: ['translateY(-120%)', 'translateY(0)'] }, { duration: 0.8 }).finished.then(
                    () => {
                        let sunOne = document.querySelector('.sun-one');
                        let sunTwo = document.querySelector('.sun-two');

                        // sunOne.style.animation =
                        //     'throb-index-one 8s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';
                        // sunTwo.style.animation =
                        //     'throb-index-two 10s cubic-bezier(0.2, 0.125, 0, 0.73) alternate infinite';

                        // sunOne.classList.remove('sun-one-collection-anim');
                        sunOne.classList.add('sun-one-index-anim');
                        // sunTwo.classList.remove('sun-two-collection-anim');
                        sunTwo.classList.add('sun-two-index-anim');
                    },
                );
            },
        },
    ],
});
