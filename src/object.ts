import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export function createObjectScene() {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(600, 400);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1.5, 0.1, 100);
  camera.position.set(0, 2.5, 13);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 5, 6);
  scene.add(light);
  let object: THREE.Object3D = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
  });
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    object.add(m);
  }
  function line(a: THREE.Vector3, b: THREE.Vector3, r = 0.025) {
    const d = b.clone().sub(a);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, d.length(), 6),
      material,
    );
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    object.add(m);
  }
  box(0, -0.4, 0, 8, 0.18, 1.3);
  for (const x of [-2.4, 2.4]) {
    for (const z of [-0.57, 0.57]) box(x, 0.25, z, 0.18, 3.5, 0.18);
    box(x, 1.7, 0, 0.27, 0.17, 1.5);
    box(x, -1.6, 0, 0.5, 0.6, 1.8);
  }
  for (const z of [-0.6, 0.6])
    for (let x = -4; x < 4; x += 0.16) {
      const cable = (v: number) =>
        Math.abs(v) <= 2.4
          ? 0.35 + 1.4 * (v / 2.4) ** 2
          : 1.75 - (Math.abs(v) - 2.4) * 0.8;
      line(
        new THREE.Vector3(x, cable(x), z),
        new THREE.Vector3(x + 0.16, cable(x + 0.16), z),
        0.035,
      );
      line(
        new THREE.Vector3(x, -0.35, z),
        new THREE.Vector3(x, cable(x), z),
        0.018,
      );
    }
  scene.add(object);
  function disposeObject(o: THREE.Object3D) {
    o.traverse((n) => {
      if (n instanceof THREE.Mesh) {
        n.geometry.dispose();
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          m.dispose();
      }
    });
  }
  return {
    render(angle: number) {
      object.rotation.y = angle;
      renderer.render(scene, camera);
      return renderer.domElement;
    },
    async load(file: File) {
      const data = await file.arrayBuffer();
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        if (!url.startsWith("data:") && !url.startsWith("blob:"))
          throw Error("Use a GLB or GLTF with embedded textures and geometry.");
        return url;
      });
      const gltf = await new GLTFLoader(manager).parseAsync(data, "");
      const next = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(next);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const max = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(max) || max === 0)
        throw Error("The model has no visible geometry.");
      next.position.sub(center);
      const group = new THREE.Group();
      group.add(next);
      group.scale.setScalar(7 / max);
      scene.remove(object);
      disposeObject(object);
      object = group;
      scene.add(object);
    },
    dispose() {
      disposeObject(object);
      renderer.dispose();
    },
  };
}
