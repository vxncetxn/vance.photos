import * as THREE from 'three';
import normalizeWheel from 'normalize-wheel';
import imagesLoaded from 'imagesLoaded';

import vertex from './shaders/vertex.glsl';
import fragment from './shaders/fragment.glsl';

export default class WebglInit {
    constructor(container) {
        console.log('CONSTRUCTING WEBGL!');
        this.container = container;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.widthTotal = 0;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, this.width / this.height, 10, 1000);
        this.camera.position.z = 600;
        this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI;

        this.geometry = new THREE.PlaneGeometry(200, 200);
        this.material = new THREE.MeshNormalMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        // this.scene.add(this.mesh);

        this.baseGeometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

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
            this.onResize();
            this.render();
            this.addEventListeners();
            console.log('FINISHED WEBGL!');
        });
    }

    requestCORSIfNotSameOrigin(img, url) {
        if (new URL(url, window.location.href).origin !== window.location.origin) {
            img.crossOrigin = '';
        }
    }

    lerp(p1, p2, t) {
        return p1 + (p2 - p1) * t;
    }

    onResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI;

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
            this.requestCORSIfNotSameOrigin(img, img.src);
            let texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            let material = new THREE.ShaderMaterial({
                // wireframe: true,
                uniforms: {
                    uTexture: { value: texture },
                },
                vertexShader: vertex,
                fragmentShader: fragment,
            });

            let mesh = new THREE.Mesh(this.baseGeometry, material);
            mesh.scale.set(bounds.width, bounds.height, 1);
            this.scene.add(mesh);
            console.log(this.scene);

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
    }

    setPosition() {
        this.imageStore.forEach((o, i) => {
            // o.mesh.position.x = -this.asscroll.currentPos + o.left - this.width / 2 + o.width / 2;
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
        window.addEventListener('mousemove', this.onTouchMove.bind(this));
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
        this.scroll.last = this.scroll.current;

        this.setPosition();
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}
