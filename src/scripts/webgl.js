// import * as THREE from 'three';
import { Renderer, Camera, Program, Mesh, Plane, Transform, Texture } from 'ogl';
import normalizeWheel from 'normalize-wheel';
import imagesLoaded from 'imagesLoaded';

import vertex from '@/shaders/vertex.glsl';
import fragment from '@/shaders/fragment.glsl';

export class WebglInit {
    constructor(container) {
        this.container = container;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.widthTotal = 0;

        this.renderer = new Renderer({ antialias: true, dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.gl = this.renderer.gl;
        this.container.appendChild(this.gl.canvas);

        this.scene = new Transform();

        this.camera = new Camera(this.gl, {
            aspect: this.width / this.height,
            near: 10,
            far: 1000,
            fov: (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI,
        });
        this.camera.position.z = 600;

        this.geometry = new Plane(this.gl, { width: 150, height: 150 });
        this.program = new Program(this.gl, {
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
        this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
        // this.mesh.setParent(this.scene);

        this.baseGeometry = new Plane(this.gl, { width: 1, height: 1, widthSegments: 100, heightSegments: 100 });
        this.imagesGroup = new Transform();

        this.cursor = {
            ease: 0.05,
            current: 0,
            target: 0,
            last: 0,
        };

        this.scroll = {
            ease: 0.05,
            current: 0,
            target: 0,
            last: 0,
        };
        this.direction = 'right';

        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.image'), { background: true }, resolve);
        });

        Promise.all([preloadImages]).then(() => {
            this.addObjects();
            // this.onResize();
            this.setPosition();
            this.render();
            this.addEventListeners();
        });
    }

    lerp(p1, p2, t) {
        return p1 + (p2 - p1) * t;
    }

    onResize() {
        // this.width = this.container.offsetWidth;
        // this.height = this.container.offsetHeight;
        // this.renderer.setSize(this.width, this.height);
        // this.camera.aspect = this.width / this.height;
        // this.camera.updateProjectionMatrix();
        // this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI;
        // this.materials.forEach(m=>{
        //     m.uniforms.uResolution.value.x = this.width;
        //     m.uniforms.uResolution.value.y = this.height;
        // })
        // this.imageStore.forEach(i=>{
        //     let bounds = i.img.getBoundingClientRect();
        //     i.mesh.scale.set(bounds.width,bounds.height,1);
        //     i.top = bounds.top;
        //     i.left = bounds.left + this.asscroll.currentPos;
        //     i.width = bounds.width;
        //     i.height = bounds.height;
        //     i.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
        //     i.mesh.material.uniforms.uQuadSize.value.y = bounds.height;
        //     i.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
        //     i.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
        // })
    }

    addObjects() {
        this.images = [...document.querySelectorAll('.image')];
        this.imageStore = this.images.map((img) => {
            let bounds = img.getBoundingClientRect();

            let texture = new Texture(this.gl, { generateMipmaps: false });
            let program = new Program(this.gl, {
                depthTest: false,
                depthWrite: false,
                vertex,
                fragment,
                uniforms: {
                    uTexture: { value: texture },
                },
            });

            let allowedImg = new Image();
            allowedImg.crossOrigin = 'anonymous';
            allowedImg.onload = (_) => {
                texture.image = allowedImg;
            };
            allowedImg.src = img.src;

            let mesh = new Mesh(this.gl, { geometry: this.baseGeometry, program });
            mesh.scale.x = bounds.width;
            mesh.scale.y = bounds.height;
            mesh.setParent(this.imagesGroup);

            this.widthTotal += bounds.width + 100;

            return {
                img,
                mesh,
                width: bounds.width,
                height: bounds.height,
                top: bounds.top,
                left: bounds.left,
                isBefore: false,
                isAfter: false,
                extraScroll: 0,
            };
        });
        this.imagesGroup.rotation.z = 0.05;
        this.imagesGroup.setParent(this.scene);
    }

    setPosition() {
        this.imageStore.forEach((o) => {
            o.mesh.position.x = -this.scroll.current + o.left - this.width / 2 + o.width / 2 - o.extraScroll;
            o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;

            let meshOffset = o.mesh.scale.x / 2;
            o.isBefore = o.mesh.position.x + meshOffset < -this.width;
            o.isAfter = o.mesh.position.x - meshOffset > this.width;

            if (this.direction === 'right' && o.isBefore) {
                o.extraScroll -= this.widthTotal;

                o.isBefore = false;
                o.isAfter = false;
            }

            if (this.direction === 'left' && o.isAfter) {
                o.extraScroll += this.widthTotal;

                o.isBefore = false;
                o.isAfter = false;
            }
        });
        this.imagesGroup.rotation.set(0, 0, 0.1 + (this.cursor.current / this.height - 0.5) / 20);
    }

    onMouseMove(event) {
        this.cursor.target = event.clientY;
    }

    onTouchDown(event) {
        this.isDown = true;

        this.scroll.position = this.scroll.current;
        this.start = event.touches ? event.touches[0].clientX : event.clientX;
    }

    onTouchMove(event) {
        if (!this.isDown) return;

        const x = event.touches ? event.touches[0].clientX : event.clientX;
        const distance = (this.start - x) * 0.01;

        this.scroll.target = this.scroll.position + distance;
    }

    onTouchUp(event) {
        this.isDown = false;
    }

    onWheel(event) {
        const normalized = normalizeWheel(event);
        const speed = normalized.pixelY;

        this.scroll.target += speed * 0.5;
    }

    addEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));

        window.addEventListener('mousewheel', this.onWheel.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this));

        window.addEventListener('mousedown', this.onTouchDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onTouchUp.bind(this));

        window.addEventListener('touchstart', this.onTouchDown.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
        window.addEventListener('touchend', this.onTouchUp.bind(this));
    }

    render() {
        this.scroll.current = this.lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
        if (this.scroll.current > this.scroll.last) {
            this.direction = 'right';
        } else {
            this.direction = 'left';
        }

        this.cursor.current = this.lerp(this.cursor.current, this.cursor.target, this.cursor.ease);

        if (
            Math.abs(this.scroll.last - this.scroll.current) > 0.1 ||
            Math.abs(this.cursor.last - this.cursor.current) > 0.1
        ) {
            this.setPosition();
            this.renderer.render({ scene: this.scene, camera: this.camera });
        }

        this.scroll.last = this.scroll.current;
        this.cursor.last = this.cursor.current;

        requestAnimationFrame(this.render.bind(this));
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}
