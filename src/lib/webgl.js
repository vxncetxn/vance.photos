import {
  Renderer,
  Camera,
  Program,
  Mesh,
  Plane,
  Transform,
  TextureLoader,
} from "ogl";

// import vertex from "../shaders/vertex.glsl";
// import fragment from "../shaders/fragment.glsl";

import collectionsData from "../data/collections.json";

export class WebglInit {
  constructor(props) {
    let { container, dimensions, progress } = props;

    this.container = container;
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.progress = progress;

    this.renderer = new Renderer({
      canvas: container,
      antialias: true,
      alpha: true,
      depth: false,
      powerPreference: "high-performance",
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
    this.baseGeometry = new Plane(this.gl, {
      widthSegments: 10,
      heightSegments: 10,
    });

    this.activeCollection = undefined;
    this.collections = {};
    collectionsData.forEach((collection) => {
      this.collections[collection.slug] = {
        images: [...Array(collection.length).keys()].map((i) => {
          return {
            origin: `https://vance.imgix.net/${collection.slug}/s${i + 1}.jpg`,
            lqipTexture: undefined,
          };
        }),
        group: undefined,
        widthTotal: 0,
        heightTotal: 0,
      };
    });

    this.progress.set(this.progress.get() + 18.1);

    this.preloadLQIPTextures();
  }

  preloadLQIPTextures() {
    this.lqipTexturesAdded = [];

    Object.entries(this.collections).forEach(([slug, data]) => {
      data.images.forEach((img, i) => {
        let texture = TextureLoader.load(this.gl, {
          src: `${img.origin}?w=300&h=200&fit=contain&format=auto&blur=200`,
          generateMipmaps: false,
        });
        this.lqipTexturesAdded.push(texture.loaded);
        texture.loaded.then(() => {
          this.collections[slug].images[i].lqipTexture = texture;
          this.progress.set(this.progress.get() + 0.905);
        });
      });
    });
  }

  resize(dimensions) {
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    // this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI;
    this.camera.perspective();

    Object.entries(this.collections).forEach(([slug, data]) => {
      let collection = this.collections[slug];
      collection.widthTotal = 0;
      collection.heightTotal = 0;

      data.images.forEach((img, i) => {
        if (img.mesh) {
          let gap = (6 / 100) * this.width;
          let width;
          let height;
          let top;
          let left;

          if (this.width <= 768) {
            let padding = this.width <= 376 ? 16 : 20;
            width = this.width - 2 * padding;
            height = width / 1.5;
            top = collection.heightTotal + (1 / 2) * this.height;
            left = padding;
          } else {
            width = (37.5 / 100) * this.width;
            height = width / 1.5;
            top = (1 / 2) * this.height - (1 / 2) * height;
            left = collection.widthTotal - (12 / 100) * this.width;
          }

          img.mesh.program.uniforms.uViewportSize.value = [
            this.width,
            this.height,
          ];

          img.mesh.scale.x = width;
          img.mesh.scale.y = height;

          collection.widthTotal += width + gap;
          collection.heightTotal += height + gap;

          // Set initial pos
          let posX = left - this.width / 2 + width / 2;
          let posY = -top + this.height / 2 - height / 2;

          img.mesh.position.x = posX;
          img.mesh.position.y = posY;

          let meshOffset = img.mesh.scale.x / 2;
          let isBefore = posX + meshOffset < -this.width;
          let isAfter = posY - meshOffset > this.width;

          collection.images[i] = {
            ...collection.images[i],
            width,
            height,
            top,
            left,
            posX,
            posY,
            isBefore,
            isAfter,
            extraScroll: 0,
          };
        }
      });
      this.render();
    });
  }

  checkCollection(slug) {
    return !!this.collections[slug].group;
  }

  setCollection(slug) {
    if (slug) {
      this.activeCollection = slug;
      this.collections[slug].group.visible = true;
      this.render();
    }
  }

  hideCollection() {
    let collection = this.collections[this.activeCollection];
    if (collection) {
      collection.group.visible = false;

      // Reset mesh values back to initial pos
      collection.images.forEach((img, i) => {
        let {
          mesh,
          width,
          height,
          top,
          left,
          posX,
          posY,
          isBefore,
          isAfter,
          extraScroll,
        } = img;

        posX = left - this.width / 2 + width / 2;
        posY = -top + this.height / 2 - height / 2;

        mesh.position.x = posX;
        mesh.position.y = posY;

        let meshOffset = mesh.scale.x / 2;
        isBefore = posX + meshOffset < -this.width;
        isAfter = posY - meshOffset > this.width;

        extraScroll = 0;

        collection.images[i] = {
          ...collection.images[i],
          mesh,
          posX,
          posY,
          isBefore,
          isAfter,
          extraScroll,
        };
      });

      this.activeCollection = undefined;
      this.render();
    }
  }

  async addCollection(slug) {
    await Promise.all(this.lqipTexturesAdded);

    let group = new Transform();
    let collection = this.collections[slug];

    collection.images.forEach((img, i) => {
      // dom-independent calcs
      let gap = (6 / 100) * this.width;
      let width;
      let height;
      let top;
      let left;

      if (this.width <= 768) {
        let padding = this.width <= 376 ? 16 : 20;
        width = this.width - 2 * padding;
        height = width / 1.5;
        top = collection.heightTotal + (1 / 2) * this.height;
        left = padding;
      } else {
        width = (37.5 / 100) * this.width;
        height = width / 1.5;
        top = (1 / 2) * this.height - (1 / 2) * height;
        left = collection.widthTotal - (12 / 100) * this.width;
      }

      let program = new Program(this.gl, {
        depthTest: false,
        depthWrite: false,
        vertex:
          this.width <= 768
            ? `#define PI 3.1415926535897932384626433832795

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
            newPosition.z += min(cos(newPosition.y / uViewportSize.y * PI) * uStrength * 60.0, cos(newPosition.y / uViewportSize.y * PI) * 40.0);
        
            gl_Position = projectionMatrix * newPosition;
        }`
            : `#define PI 3.1415926535897932384626433832795

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
        uniform float uTime;
        uniform float uTransitionFactor;
        
        varying vec2 vUv;
        
        void main() {
            vec4 textureResult = texture2D(uTexture, vUv);
            float func;
            if (2.0 * uTime / 800.0 < 1.0)
            {
              func = -1.0 / 2.0 * pow(2.0 * uTime / 800.0, 3.0) + 1.0;
            }
            else
            {
              func = -1.0 / 2.0 * (pow((2.0 * uTime / 800.0) - 2.0, 3.0) + 2.0) + 1.0;
            }
            textureResult.a = ceil(max((vUv.y - func) * uTransitionFactor, 0.0));
            gl_FragColor = textureResult;
        }`,
        uniforms: {
          uTexture: { value: collection.images[i].lqipTexture },
          uViewportSize: { value: [this.width, this.height] },
          uStrength: { value: 0 },
          uTime: { value: 0 },
          uTransitionFactor: { value: 1.0 },
        },
      });

      let mesh = new Mesh(this.gl, { geometry: this.baseGeometry, program });
      mesh.scale.x = width;
      mesh.scale.y = height;
      mesh.setParent(group);

      collection.widthTotal += width + gap;
      collection.heightTotal += height + gap;

      // Set initial pos
      let posX = left - this.width / 2 + width / 2;
      let posY = -top + this.height / 2 - height / 2;

      mesh.position.x = posX;
      mesh.position.y = posY;

      let meshOffset = mesh.scale.x / 2;
      let isBefore = posX + meshOffset < -this.width;
      let isAfter = posY - meshOffset > this.width;

      collection.images[i] = {
        ...collection.images[i],
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
      };

      let actualTexture = TextureLoader.load(this.gl, {
        src: `${img.origin}?w=900&h=600&fit=contain&format=auto`,
        generateMipmaps: false,
      });
      actualTexture.loaded.then(() => {
        program.uniforms.uTexture.value = actualTexture;
        this.render();
      });
    });
    // group.rotation.z = 0.05;
    group.setParent(this.scene);
    collection.group = group;
  }

  setPosition(scroll, cursor) {
    if (this.activeCollection) {
      let collection = this.collections[this.activeCollection];
      collection.images.forEach((o) => {
        if (this.width <= 768) {
          o.posY = scroll.current - o.top + this.height / 2 - o.height / 2;
          o.mesh.position.y = o.posY;
        } else {
          o.posX =
            -scroll.current +
            o.left -
            this.width / 2 +
            o.width / 2 -
            o.extraScroll;

          let meshOffset = o.mesh.scale.x / 2;
          o.isBefore = o.posX + meshOffset < -this.width;
          o.isAfter = o.posX - meshOffset > this.width;

          if (!o.isBefore && !o.isAfter) {
            o.mesh.position.x = o.posX;
          }

          if (scroll.direction === "right" && o.isBefore) {
            o.extraScroll -= collection.widthTotal;

            o.isBefore = false;
            o.isAfter = false;
          }

          if (scroll.direction === "left" && o.isAfter) {
            o.extraScroll += collection.widthTotal;

            o.isBefore = false;
            o.isAfter = false;
          }
        }

        o.mesh.program.uniforms.uStrength.value =
          (Math.abs(scroll.current - scroll.last) / this.width) * 10;
      });

      // collection.group.rotation.set(
      //   0,
      //   0,
      //   0.1 + (cursor.current / this.height - 0.5) / 20
      // );
    }
  }

  transition(startTime, transitionFactor) {
    if (this.activeCollection) {
      let collection = this.collections[this.activeCollection];
      let now = new Date();
      collection.images.forEach((img) => {
        img.mesh.program.uniforms.uTransitionFactor.value = transitionFactor;
        img.mesh.program.uniforms.uTime.value = now - startTime;
      });
    }
  }

  render() {
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}
