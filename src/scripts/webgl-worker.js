import { Renderer, Camera, Program, Mesh, Plane, Transform } from 'ogl';
import { WebglInit } from './webgl-temp';

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
    // let container = data.canvas;
    // let width = state.width;
    // let height = state.height;
    // let renderer = new Renderer({
    //     canvas: container,
    //     antialias: true,
    //     alpha: true,
    // });
    // renderer.setSize(width, height);
    // let gl = renderer.gl;
    // let scene = new Transform();
    // let camera = new Camera(gl, {
    //     aspect: width / height,
    //     near: 10,
    //     far: 1000,
    //     fov: (2 * Math.atan(height / 2 / 600) * 180) / Math.PI,
    // });
    // camera.position.z = 600;
    // let geometry = new Plane(gl, { width: 150, height: 150 });
    // let program = new Program(gl, {
    //     vertex: `attribute vec3 position;
    //         uniform mat4 modelViewMatrix;
    //         uniform mat4 projectionMatrix;
    //         void main() {
    //             gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    //         }`,
    //     fragment: `void main() {
    //             gl_FragColor = vec4(0.0, 0.5, 0.5, 1.0);
    //         }`,
    // });
    // let mesh = new Mesh(gl, { geometry: geometry, program: program });
    // mesh.setParent(scene);
    // renderer.render({ scene: scene, camera: camera });

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
