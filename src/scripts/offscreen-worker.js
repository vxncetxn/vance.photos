import { WebglInit } from './webgl';

function lerp(p1, p2, t) {
    return p1 + (p2 - p1) * t;
}

const state = {
    width: 300, // canvas default
    height: 150, // canvas default
};

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

let domImages = [];

const handlers = {
    main,
    images,
    size,
    scrollFn,
    cursorFn,
};

self.onmessage = function (e) {
    const fn = handlers[e.data.type];
    // if (!fn) {
    //     throw new Error('no handler for type: ' + e.data.type);
    // }
    // fn(e.data);
    if (fn) {
        fn(e.data);
    }
};

function scrollFn(data) {
    scroll.target = data.value;
}

function cursorFn(data) {
    cursor.target = data.value;
}

function size(data) {
    state.width = data.width;
    state.height = data.height;
}

function images(data) {
    domImages = data.images;
}

function main(data) {
    let webglInited = new WebglInit({
        container: data.canvas,
        dimensions: { width: state.width, height: state.height },
        images: domImages,
    });
    webglInited.setPosition(scroll, direction, cursor);

    function rafLoop() {
        scroll.current = lerp(scroll.current, scroll.target, scroll.ease);
        if (scroll.current > scroll.last) {
            direction = 'right';
        } else {
            direction = 'left';
        }

        cursor.current = lerp(cursor.current, cursor.target, cursor.ease);

        if (Math.abs(scroll.last - scroll.current) > 0.1 || Math.abs(cursor.last - cursor.current) > 0.1) {
            webglInited.setPosition(scroll, direction, cursor);
            webglInited.render();
        }

        scroll.last = scroll.current;
        cursor.last = cursor.current;

        webglInited.render();
        requestAnimationFrame(rafLoop);
    }

    rafLoop();
}
