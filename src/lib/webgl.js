import {
  Renderer,
  Camera,
  Program,
  Mesh,
  Plane,
  Transform,
  TextureLoader,
} from "ogl";

import vertex from "../shaders/vertex.glsl";
import fragment from "../shaders/fragment.glsl";

import collectionsData from "../data/collections.json";

export class WebglInit {
  constructor(props) {
    let { container, dimensions } = props;

    this.container = container;
    this.width = dimensions.width;
    this.height = dimensions.height;

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

    this.baseGeometry = new Plane(this.gl, { widthSegments: 10 });

    this.activeCollection = undefined;
    this.collections = {};
    collectionsData.forEach((collection) => {
      this.collections[collection.slug] = {
        images: [...Array(collection.length).keys()].map((i) => {
          return {
            src: `https://vance.imgix.net/${collection.slug}/s${
              i + 1
            }.jpg?w=300&h=200&fit=contain&format=auto&blur=200`,
            lqipTexture: undefined,
          };
        }),
        group: undefined,
        widthTotal: 0,
      };
    });
    this.preloadLQIPTextures();
  }

  preloadLQIPTextures() {
    this.lqipTexturesAdded = [];

    Object.entries(this.collections).forEach(([slug, data]) => {
      data.images.forEach((img, i) => {
        let texture = TextureLoader.load(this.gl, {
          src: img.src,
          generateMipmaps: false,
        });
        this.lqipTexturesAdded.push(
          texture.loaded.then(
            () => (this.collections[slug].images[i].lqipTexture = texture)
          )
        );
      });
    });
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

  checkCollection(slug) {
    return !!this.collections[slug].group;
  }

  setCollection(slug) {
    if (slug) {
      this.activeCollection = slug;
      this.collections[slug].group.visible = true;
    }
  }

  hideCollection() {
    let collection = this.collections[this.activeCollection];
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
  }

  addCollection(slug, domImages) {
    console.log("adding collection: ", slug);
    let group = new Transform();
    let collection = this.collections[slug];
    // let images = this.collections[slug].images;

    domImages.forEach((img, i) => {
      let { src, top, left, width, height } = img;

      let program = new Program(this.gl, {
        depthTest: false,
        depthWrite: false,
        vertex,
        fragment,
        uniforms: {
          uTexture: { value: collection.images[i].lqipTexture },
          uViewportSize: { value: [this.width, this.height] },
          uStrength: { value: 0 },
        },
      });

      let mesh = new Mesh(this.gl, { geometry: this.baseGeometry, program });
      mesh.scale.x = width;
      mesh.scale.y = height;
      mesh.setParent(group);

      collection.widthTotal += width + 100;

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
        src: `${src}?w=900&h=600&fit=contain&format=auto`,
        generateMipmaps: false,
      });
      actualTexture.loaded.then(() => {
        program.uniforms.uTexture.value = actualTexture;
        this.render();
      });
    });
    group.rotation.z = 0.05;
    group.setParent(this.scene);
    collection.group = group;
  }

  setPosition(scroll, cursor) {
    if (this.activeCollection) {
      let collection = this.collections[this.activeCollection];
      collection.images.forEach((o) => {
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

        o.mesh.program.uniforms.uStrength.value =
          (Math.abs(scroll.current - scroll.last) / this.width) * 10;
      });

      collection.group.rotation.set(
        0,
        0,
        0.1 + (cursor.current / this.height - 0.5) / 20
      );
    }
  }

  render() {
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}

// addObjects(images) {
//   this.texturesAdded = [];

//   images.forEach((img) => {
//     let { src, top, left, width, height } = img;

//     let texture = TextureLoader.load(this.gl, {
//       src: `${src}?w=300&h=200&fit=contain&format=auto&blur=200`,
//       generateMipmaps: false,
//     });
//     let program = new Program(this.gl, {
//       depthTest: false,
//       depthWrite: false,
//       vertex,
//       fragment,
//       uniforms: {
//         uTexture: { value: undefined },
//         uViewportSize: { value: [this.width, this.height] },
//         uStrength: { value: 0 },
//       },
//     });

//     let mesh = new Mesh(this.gl, { geometry: this.baseGeometry, program });
//     mesh.scale.x = width;
//     mesh.scale.y = height;
//     mesh.setParent(this.imagesGroup);

//     this.widthTotal += width + 100;

//     // Set initial pos
//     let posX = left - this.width / 2 + width / 2;
//     let posY = -top + this.height / 2 - height / 2;

//     mesh.position.x = posX;
//     mesh.position.y = posY;

//     let meshOffset = mesh.scale.x / 2;
//     let isBefore = posX + meshOffset < -this.width;
//     let isAfter = posY - meshOffset > this.width;

//     this.imageStore.push({
//       mesh,
//       width,
//       height,
//       top,
//       left,
//       posX,
//       posY,
//       isBefore,
//       isAfter,
//       extraScroll: 0,
//     });
//     // this.texturesAdded.push(
//     //   texture.loaded.then(() => {
//     //     program.uniforms.uTexture.value = texture;
//     //   })
//     // );
//     this.texturesAdded.push(
//       texture.loaded.then(() => (program.uniforms.uTexture.value = texture))
//     );
//     let actualTexture = TextureLoader.load(this.gl, {
//       src: `${src}?w=900&h=600&fit=contain&format=auto`,
//       generateMipmaps: false,
//     });
//     actualTexture.loaded.then(
//       () => (program.uniforms.uTexture.value = actualTexture)
//     );
//   });
//   this.imagesGroup.rotation.z = 0.05;
//   this.imagesGroup.setParent(this.scene);
// }