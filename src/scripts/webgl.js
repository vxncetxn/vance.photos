import { Renderer, Camera, Program, Mesh, Plane, Transform, TextureLoader } from 'ogl';

// import vertex from '@/shaders/vertex.glsl';
// import fragment from '@/shaders/fragment.glsl';

export class WebglInit {
    constructor(props) {
        let { container, dimensions, images, dpr } = props;

        this.container = container;
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.widthTotal = 0;

        this.renderer = new Renderer({
            canvas: container,
            antialias: true,
            dpr,
            alpha: true,
            depth: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(this.width, this.height);
        this.gl = this.renderer.gl;

        this.scene = new Transform();

        this.camera = new Camera(this.gl, {
            aspect: this.width / this.height,
            near: 10,
            far: 1000,
            fov: (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI,
        });
        this.camera.position.z = 600;

        // this.geometry = new Plane(this.gl, { width: 150, height: 150 });
        // this.program = new Program(this.gl, {
        //     vertex: `attribute vec3 position;

        //     uniform mat4 modelViewMatrix;
        //     uniform mat4 projectionMatrix;

        //     void main() {
        //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        //     }`,
        //     fragment: `void main() {
        //         gl_FragColor = vec4(0.0, 0.5, 0.5, 1.0);
        //     }`,
        // });
        // this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
        // this.mesh.setParent(this.scene);

        this.baseGeometry = new Plane(this.gl, { widthSegments: 10 });
        this.imagesGroup = new Transform();

        this.addObjects(images);
        Promise.all(this.texturesLoaded).then(() => this.render());
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

    addObjects(images) {
        this.imageStore = [];
        this.texturesLoaded = [];

        images.forEach((img) => {
            let { src, top, left, width, height } = img;

            let texture = TextureLoader.load(this.gl, { src, generateMipmaps: false });
            let program = new Program(this.gl, {
                depthTest: false,
                depthWrite: false,
                vertex: `#define PI 3.1415926535897932384626433832795

                precision highp float;
                precision highp int;
                
                attribute vec3 position;
                attribute vec2 uv;
                
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform vec2 uViewportSize;
                uniform float uStrength;
                
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                
                    vec4 newPosition = modelViewMatrix * vec4(position, 1.0);
                    newPosition.z += min(cos(newPosition.x / uViewportSize.x * PI) * uStrength * 400.0, cos(newPosition.x / uViewportSize.x * PI) * 200.0);
                
                    gl_Position = projectionMatrix * newPosition;
                }`,
                fragment: `precision highp float;

                uniform sampler2D uTexture;
                
                varying vec2 vUv;
                
                void main() {
                    gl_FragColor = texture2D(uTexture, vUv);
                }`,
                uniforms: {
                    uTexture: { value: texture },
                    uViewportSize: { value: [this.width, this.height] },
                    uStrength: { value: 0 },
                },
            });

            let mesh = new Mesh(this.gl, { geometry: this.baseGeometry, program });
            mesh.scale.x = width;
            mesh.scale.y = height;
            mesh.setParent(this.imagesGroup);

            this.widthTotal += width + 100;

            // Set initial pos
            let posX = left - this.width / 2 + width / 2;
            let posY = -top + this.height / 2 - height / 2;

            mesh.position.x = posX;
            mesh.position.y = posY;

            let meshOffset = mesh.scale.x / 2;
            let isBefore = posX + meshOffset < -this.width;
            let isAfter = posY - meshOffset > this.width;

            this.imageStore.push({
                mesh,
                width,
                height,
                top,
                left,
                posX,
                posY,
                isBefore,
                isAfter,
                extraScroll: 0,
            });
            this.texturesLoaded.push(texture.loaded);
        });
        this.imagesGroup.rotation.z = 0.05;
        this.imagesGroup.setParent(this.scene);
    }

    setPosition(scroll, cursor) {
        this.imageStore.forEach((o) => {
            o.posX = -scroll.current + o.left - this.width / 2 + o.width / 2 - o.extraScroll;

            let meshOffset = o.mesh.scale.x / 2;
            o.isBefore = o.posX + meshOffset < -this.width;
            o.isAfter = o.posX - meshOffset > this.width;

            if (!o.isBefore && !o.isAfter) {
                o.mesh.position.x = o.posX;
            }

            if (scroll.direction === 'right' && o.isBefore) {
                o.extraScroll -= this.widthTotal;

                o.isBefore = false;
                o.isAfter = false;
            }

            if (scroll.direction === 'left' && o.isAfter) {
                o.extraScroll += this.widthTotal;

                o.isBefore = false;
                o.isAfter = false;
            }

            o.mesh.program.uniforms.uStrength.value = (Math.abs(scroll.current - scroll.last) / this.width) * 10;
        });
        this.imagesGroup.rotation.set(0, 0, 0.1 + (cursor.current / this.height - 0.5) / 20);
    }

    render() {
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}
