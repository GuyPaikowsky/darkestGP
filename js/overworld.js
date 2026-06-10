// ── 3D haunted highway: bloom, storms, corners, and one very cursed F1 car ──
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, car, wheels = [];
let movers = [];      // recycled scenery; each carries userData.baseX for road curvature
let embers, rain;
let moonLight, ambient;
let speed = 0.45, targetSpeed = 0.45;
let running = true;
let t = 0;

// pseudo-corners: the world bends sideways as a function of depth
let curve = 0, targetCurve = 0, nextCurveChange = 6;
let nextLightning = 8, flashLeft = 0;

const ROAD_W = 14;
const DEPTH = 260;

function rnd(a, b) { return a + Math.random() * (b - a); }

function addMover(mesh, opts = {}) {
  mesh.userData.baseX = mesh.position.x;
  mesh.userData.baseY = mesh.position.y;
  if (opts.phase !== undefined) mesh.userData.phase = opts.phase;
  scene.add(mesh);
  movers.push({ mesh, bob: !!opts.bob, lean: !!opts.lean });
}

export function initOverworld(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0608);
  scene.fog = new THREE.Fog(0x14080a, 18, 150);

  camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 4.2, 12);
  camera.lookAt(0, 1, -20);

  moonLight = new THREE.DirectionalLight(0x8a6a7a, 0.7);
  moonLight.position.set(-30, 50, -40);
  scene.add(moonLight);
  ambient = new THREE.AmbientLight(0x2a1418, 1.6);
  scene.add(ambient);

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x120a0c, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  scene.add(ground);

  // road built from segments so it can bend through corners
  const segGeo = new THREE.BoxGeometry(ROAD_W, 0.06, 3.2);
  const segMat = new THREE.MeshStandardMaterial({ color: 0x1c1a1e, roughness: 0.9 });
  for (let z = -DEPTH; z < 30; z += 3) {
    const seg = new THREE.Mesh(segGeo, segMat);
    seg.position.set(0, -0.03, z);
    addMover(seg);
  }

  // center dashes
  const dashGeo = new THREE.BoxGeometry(0.35, 0.02, 3);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xb8a87a, emissive: 0x554a2a, emissiveIntensity: 0.4 });
  for (let z = -DEPTH; z < 30; z += 9) {
    const d = new THREE.Mesh(dashGeo, dashMat);
    d.position.set(0, 0.04, z);
    addMover(d);
  }

  // red/white kerbs
  const kerbGeo = new THREE.BoxGeometry(0.9, 0.18, 3);
  const matRed = new THREE.MeshStandardMaterial({ color: 0x7a1414 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0x9a948a });
  for (let z = -DEPTH; z < 30; z += 3) {
    for (const side of [-1, 1]) {
      const k = new THREE.Mesh(kerbGeo, (Math.round(z / 3) % 2 === 0) ? matRed : matWhite);
      k.position.set(side * (ROAD_W / 2 + 0.45), 0.09, z);
      addMover(k);
    }
  }

  // gothic spires + dead trees
  const spireMat = new THREE.MeshStandardMaterial({ color: 0x16080c, roughness: 1 });
  for (let i = 0; i < 40; i++) {
    const h = rnd(6, 26);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(rnd(0.6, 2.2), h, 5), spireMat);
    const side = Math.random() < 0.5 ? -1 : 1;
    spire.position.set(side * rnd(13, 55), h / 2 - 0.2, rnd(-DEPTH, 20));
    spire.rotation.y = rnd(0, Math.PI);
    addMover(spire);
  }

  // ghost grandstands: dark bleachers with flickering soul-lights
  const standMat = new THREE.MeshStandardMaterial({ color: 0x100a10, roughness: 1 });
  const soulMat = new THREE.MeshStandardMaterial({ color: 0x6a8aff, emissive: 0x4a6aee, emissiveIntensity: 1.6 });
  for (let i = 0; i < 6; i++) {
    const stand = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 5), standMat);
    body.rotation.x = -0.28;
    stand.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(19, 0.4, 6), standMat);
    roof.position.y = 4.2;
    stand.add(roof);
    for (let s = 0; s < 14; s++) { // the crowd. they are not alive. they still boo.
      const soul = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), soulMat);
      soul.position.set(rnd(-8, 8), rnd(-1.5, 3), 2.6);
      stand.add(soul);
    }
    const side = i % 2 === 0 ? -1 : 1;
    stand.position.set(side * rnd(16, 24), 3.4, -DEPTH + i * (DEPTH / 6) + rnd(-10, 10));
    stand.rotation.y = side * -0.25;
    stand.userData.baseX = stand.position.x;
    stand.userData.baseY = stand.position.y;
    scene.add(stand);
    movers.push({ mesh: stand, bob: false });
  }

  // DRS gantries spanning the road
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1a141a, roughness: 0.8 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0x30ff80, emissive: 0x20cc60, emissiveIntensity: 2.4 });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.5), gantryMat);
      pillar.position.set(side * (ROAD_W / 2 + 1), 3.75, 0);
      g.add(pillar);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 3, 0.7, 0.7), gantryMat);
    beam.position.y = 7.3;
    g.add(beam);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.1), signMat);
    sign.position.set(0, 6.2, 0.4);
    g.add(sign);
    g.position.set(0, 0, -DEPTH + i * (DEPTH / 4) + rnd(-8, 8));
    g.userData.baseX = 0;
    g.userData.baseY = 0;
    scene.add(g);
    movers.push({ mesh: g, bob: false });
  }

  // floating marshal lanterns
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xe6a23c, emissive: 0xc97a1a, emissiveIntensity: 2 });
  for (let i = 0; i < 14; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat);
    const side = Math.random() < 0.5 ? -1 : 1;
    l.position.set(side * rnd(8.4, 9.5), rnd(2.4, 3.4), rnd(-DEPTH, 20));
    addMover(l, { bob: true, phase: rnd(0, 6.28) });
  }

  // ember particles
  const eGeo = new THREE.BufferGeometry();
  const N = 250, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = rnd(-40, 40); pos[i * 3 + 1] = rnd(0.2, 14); pos[i * 3 + 2] = rnd(-DEPTH, 16);
  }
  eGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0xff5a2a, size: 0.14, transparent: true, opacity: 0.8 }));
  scene.add(embers);

  // rain: vertical streaks around the camera
  const rGeo = new THREE.BufferGeometry();
  const RN = 400, rPos = new Float32Array(RN * 2 * 3);
  for (let i = 0; i < RN; i++) {
    const x = rnd(-30, 30), y = rnd(0, 22), z = rnd(-90, 14);
    rPos.set([x, y, z, x + 0.12, y - rnd(0.7, 1.4), z], i * 6);
  }
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  rain = new THREE.LineSegments(rGeo, new THREE.LineBasicMaterial({ color: 0x5a708a, transparent: true, opacity: 0.34 }));
  scene.add(rain);

  buildCar();

  // post: bloom makes the lanterns, souls, and DRS signs breathe
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.65, 0.22);
  composer.addPass(bloom);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  requestAnimationFrame(loop);
}

function buildCar() {
  car = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x8a1212, roughness: 0.35, metalness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141016, roughness: 0.6 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xd9c79a, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 4.4), red);
  body.position.y = 0.5;
  car.add(body);

  // livery stripe down the spine
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.57, 4.4), boneMat);
  stripe.position.y = 0.5;
  car.add(stripe);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), red);
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.42, -3.0);
  car.add(nose);

  // sidepods
  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.9), red);
    pod.position.set(s * 0.95, 0.45, 0.5);
    car.add(pod);
  }

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), dark);
  cockpit.position.set(0, 0.95, 0.3);
  car.add(cockpit);

  // airbox + T-cam
  const airbox = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 4), dark);
  airbox.position.set(0, 1.45, 0.7);
  car.add(airbox);
  const tcam = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0xe10600, emissive: 0x801010, emissiveIntensity: 1.2 }));
  tcam.position.set(0, 1.78, 0.7);
  car.add(tcam);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 14, Math.PI), dark);
  halo.position.set(0, 1.1, 0.1);
  car.add(halo);

  // mirrors
  for (const s of [-1, 1]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.06), dark);
    mirror.position.set(s * 0.62, 1.05, -0.3);
    car.add(mirror);
  }

  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.6), dark);
  rearWing.position.set(0, 1.25, 2.1);
  car.add(rearWing);
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.6), dark);
    plate.position.set(s * 0.92, 1.0, 2.1);
    car.add(plate);
  }
  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.7), dark);
  frontWing.position.set(0, 0.18, -3.4);
  car.add(frontWing);
  for (const s of [-1, 1]) {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.7), red);
    endplate.position.set(s * 1.1, 0.3, -3.4);
    car.add(endplate);
  }

  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.95 });
  for (const [x, z] of [[-1.05, -2.2], [1.05, -2.2], [-1.05, 1.7], [1.05, 1.7]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.5, z);
    car.add(w);
    wheels.push(w);
  }

  // ghoulish headlights
  for (const s of [-1, 1]) {
    const spot = new THREE.SpotLight(0xffd9a0, 30, 60, 0.5, 0.6);
    spot.position.set(s * 0.5, 0.6, -2.8);
    spot.target.position.set(s * 1.2, 0, -30);
    car.add(spot); car.add(spot.target);
  }
  const tail = new THREE.PointLight(0xff2020, 4, 6);
  tail.position.set(0, 0.8, 2.3);
  car.add(tail);

  car.position.set(0, 0, 2);
  scene.add(car);
}

// the road ahead bends; things far away swing wide
function curveOffset(z) {
  const d = Math.max(0, -z);
  return curve * d * d * 0.0011;
}

function loop() {
  requestAnimationFrame(loop);
  if (!running) return;
  t += 0.016;
  speed += (targetSpeed - speed) * 0.02;

  // corner logic: drift toward a new bend every so often
  if (t > nextCurveChange) {
    targetCurve = Math.random() < 0.3 ? 0 : rnd(-1.1, 1.1);
    nextCurveChange = t + rnd(6, 13);
  }
  curve += (targetCurve - curve) * 0.008;

  // lightning: a few rapid flickers, then darkness reasserts itself
  if (t > nextLightning) {
    flashLeft = 2 + Math.floor(Math.random() * 3);
    nextLightning = t + rnd(7, 18);
  }
  if (flashLeft > 0 && Math.random() < 0.25) {
    flashLeft--;
    ambient.intensity = 5.5;
    moonLight.intensity = 2.6;
    scene.fog.color.setHex(0x3a3048);
  } else {
    ambient.intensity += (1.6 - ambient.intensity) * 0.18;
    moonLight.intensity += (0.7 - moonLight.intensity) * 0.18;
    scene.fog.color.lerp(new THREE.Color(0x14080a), 0.15);
  }

  for (const m of movers) {
    m.mesh.position.z += speed;
    if (m.mesh.position.z > 30) {
      m.mesh.position.z -= DEPTH + 30;
      if (m.mesh.userData.respawnX) m.mesh.userData.baseX = m.mesh.userData.respawnX();
    }
    m.mesh.position.x = m.mesh.userData.baseX + curveOffset(m.mesh.position.z);
    if (m.bob) m.mesh.position.y = m.mesh.userData.baseY + Math.sin(t * 2 + (m.mesh.userData.phase ?? 0)) * 0.25;
  }

  const p = embers.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, p.getZ(i) + speed * 0.6);
    p.setY(i, p.getY(i) + 0.012);
    if (p.getZ(i) > 16) p.setZ(i, -DEPTH);
    if (p.getY(i) > 15) p.setY(i, 0.2);
  }
  p.needsUpdate = true;

  // rain falls and streams past
  const rp = rain.geometry.attributes.position;
  const fall = 0.55 + speed * 0.2;
  for (let i = 0; i < rp.count; i += 2) {
    rp.setY(i, rp.getY(i) - fall);
    rp.setY(i + 1, rp.getY(i + 1) - fall);
    rp.setZ(i, rp.getZ(i) + speed * 0.8);
    rp.setZ(i + 1, rp.getZ(i + 1) + speed * 0.8);
    if (rp.getY(i) < 0 || rp.getZ(i) > 14) {
      const x = rnd(-30, 30), y = rnd(14, 24), z = rnd(-90, 12);
      rp.setXYZ(i, x, y, z);
      rp.setXYZ(i + 1, x + 0.12, y - rnd(0.7, 1.4), z);
    }
  }
  rp.needsUpdate = true;

  for (const w of wheels) w.rotation.x -= speed * 2.2;
  car.position.y = Math.sin(t * 9) * 0.02;
  car.rotation.z = Math.sin(t * 1.3) * 0.012 - curve * 0.06; // lean into the bend
  car.rotation.y = -curve * 0.1;
  camera.position.x = Math.sin(t * 0.4) * 0.5 + curve * 1.4;
  camera.position.y = 4.2 + Math.sin(t * 0.9) * 0.08;
  camera.lookAt(curveOffset(-22) * 0.7, 1, -22);

  composer.render();
}

export function setSpeed(s) { targetSpeed = s; }
export function setRunning(r) { running = r; }
