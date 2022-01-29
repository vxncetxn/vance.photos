import { Renderer, Camera, Program, Mesh, Plane, Transform } from 'ogl';

const state = {
    width: 300, // canvas default
    height: 150, // canvas default
};

const handlers = {
    main,
    size,
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

function size(data) {
    state.width = data.width;
    state.height = data.height;
}

function main(data) {
    let container = data.canvas;
    let width = state.width;
    let height = state.height;

    let renderer = new Renderer({
        canvas: container,
        antialias: true,
        alpha: true,
    });
    renderer.setSize(width, height);
    let gl = renderer.gl;

    let scene = new Transform();

    let camera = new Camera(gl, {
        aspect: width / height,
        near: 10,
        far: 1000,
        fov: (2 * Math.atan(height / 2 / 600) * 180) / Math.PI,
    });
    camera.position.z = 600;

    let geometry = new Plane(gl, { width: 150, height: 150 });
    let program = new Program(gl, {
        vertex: `attribute vec3 position;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }`,
        fragment: `void main() {
                gl_FragColor = vec4(0.0, 0.5, 0.5, 1.0);
            }`,
    });
    let mesh = new Mesh(gl, { geometry: geometry, program: program });
    mesh.setParent(scene);
    renderer.render({ scene: scene, camera: camera });
}

// if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
//     // main();
// }
