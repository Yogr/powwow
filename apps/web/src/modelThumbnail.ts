import { authenticatedBlob, mediaCacheScope } from "./api";
import type { Artifact } from "./api";

const pending = new Map<string, Promise<Blob>>();
let rendererQueue: Promise<unknown> = Promise.resolve();

async function cache(key: string, blob?: Blob): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const request = indexedDB.open("powwow-model-thumbnails", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onerror = () => resolve(undefined);
    request.onblocked = () => resolve(undefined);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("images", blob ? "readwrite" : "readonly");
      const store = tx.objectStore("images");
      const operation = blob ? store.put(blob, key) : store.get(key);
      let value: Blob | undefined;
      operation.onsuccess = () => { value = blob || operation.result; };
      tx.oncomplete = () => { db.close(); resolve(value); };
      tx.onerror = tx.onabort = () => { db.close(); resolve(undefined); };
    };
  });
}

export function modelThumbnail(artifact: Artifact): Promise<Blob> {
  const scope = mediaCacheScope();
  const key = `studio-v1:${scope.key}:${artifact.id}:${artifact.sha256}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const promise = (async () => {
    const saved = await cache(key).catch(() => undefined);
    scope.check();
    if (saved) return saved;
    let blob: Blob | undefined;
    if (artifact.preview_url) {
      blob = await authenticatedBlob(artifact.preview_url).catch(() => undefined);
    }
    if (!blob) {
      // A grid cannot create several GPU contexts simultaneously.
      const render = rendererQueue.then(async () => {
        scope.check();
        const model = await authenticatedBlob(artifact.download_url || artifact.url);
        return renderOnce(model);
      });
      rendererQueue = render.catch(() => undefined);
      blob = await render;
    }
    scope.check();
    await cache(key, blob).catch(() => undefined);
    scope.check();
    return blob;
  })();
  pending.set(key, promise);
  void promise.finally(() => pending.delete(key)).catch(() => undefined);
  return promise;
}

async function renderOnce(blob: Blob): Promise<Blob> {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (!url.startsWith("blob:") && !url.startsWith("data:"))
      throw new Error("External model resources are unsupported");
    return url;
  });
  const gltf = await new GLTFLoader(manager).parseAsync(await blob.arrayBuffer(), "");
  let renderer: InstanceType<typeof THREE.WebGLRenderer> | undefined;
  let environment: InstanceType<typeof THREE.WebGLRenderTarget> | undefined;
  let room: InstanceType<typeof RoomEnvironment> | undefined;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(1);
    renderer.setSize(640, 640);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#242831");
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const extent = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
    if (bounds.isEmpty() || !Number.isFinite(extent) || extent <= 0) throw new Error("Empty model");
    const model = new THREE.Group();
    model.add(gltf.scene);
    model.scale.setScalar(2 / extent);
    model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-2 / extent);
    scene.add(model);
    room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(room, .04); }
    finally { pmrem.dispose(); }
    scene.environment = environment.texture as InstanceType<typeof THREE.Texture>;
    scene.add(new THREE.HemisphereLight(0xfff0e4, 0x6f7890, 1.5));
    const key = new THREE.DirectionalLight(0xffeddd, 3);
    key.position.set(3, 5, 4);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 100);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    return await new Promise<Blob>((resolve, reject) => renderer!.domElement.toBlob(
      (image) => image ? resolve(image) : reject(new Error("Thumbnail read failed")), "image/png"));
  } finally {
    const textures = new Set<InstanceType<typeof THREE.Texture>>();
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        material.dispose();
      }
    });
    for (const texture of textures) {
      if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close();
      texture.dispose();
    }
    room?.dispose();
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
}
