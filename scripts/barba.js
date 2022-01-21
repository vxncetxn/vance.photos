import barba from '@barba/core';
import { animate } from 'motion';

barba.init({
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

                sunOne.style.transform = 'translate(-50%, -50%)';
                sunTwo.style.transform = 'translate(-20%, -20%)';

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

                sunOne.style.transform = 'translate(45%, 45%)';
                sunTwo.style.transform = 'translate(90%, 20%)';

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
