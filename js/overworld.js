// ── 3D haunted highway: the car drives, the world recycles past it ──────────
import * as THREE from 'three';

let scene, camera, renderer, car, wheels = [];
let movers = [];      // recycled scenery
let embers;
let speed = 0.45, targetSpeed = 0.45;
let running = true;
let t = 0;

const ROAD_W = 14;
const DEPTH = 260;

function rnd(a, b) { return a + Math.random() * (b - a); }

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

  const moon = new THREE.DirectionalLight(0x8a6a7a, 0.7);
  moon.position.set(-30, 50, -40);
  scene.add(moon);
  scene.add(new THREE.AmbientLight(0x2a1418, 1.6));

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x120a0c, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // road
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_W, 600),
    new THREE.MeshStandardMaterial({ color: 0x1c1a1e, roughness: 0.9 })
  );
  road.rotation.x = -Math.PI / 2;
  scene.add(road);

  // center dashes
  const dashGeo = new THREE.BoxGeometry(0.35, 0.02, 3);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xb8a87a, emissive: 0x554a2a, emissiveIntensity: 0.4 });
  for (let z = -DEPTH; z < 30; z += 9) {
    const d = new THREE.Mesh(dashGeo, dashMat);
    d.position.set(0, 0.02, z);
    scene.add(d);
    movers.push({ mesh: d, respawn: () => {} });
  }

  // red/white kerbs
  const kerbGeoR = new THREE.BoxGeometry(0.9, 0.18, 3);
  const matRed = new THREE.MeshStandardMaterial({ color: 0x7a1414 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0x9a948a });
  for (let z = -DEPTH; z < 30; z += 3) {
    for (const side of [-1, 1]) {
      const k = new THREE.Mesh(kerbGeoR, (Math.round(z / 3) % 2 === 0) ? matRed : matWhite);
      k.position.set(side * (ROAD_W / 2 + 0.45), 0.09, z);
      scene.add(k);
      movers.push({ mesh: k, respawn: () => {} });
    }
  }

  // gothic spires + dead trees + grandstand ribs
  const spireMat = new THREE.MeshStandardMaterial({ color: 0x16080c, roughness: 1 });
  for (let i = 0; i < 46; i++) {
    const h = rnd(6, 26);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(rnd(0.6, 2.2), h, 5), spireMat);
    const side = Math.random() < 0.5 ? -1 : 1;
    spire.position.set(side * rnd(11, 55), h / 2 - 0.2, rnd(-DEPTH, 20));
    spire.rotation.y = rnd(0, Math.PI);
    scene.add(spire);
    movers.push({
      mesh: spire,
      respawn: (m) => { m.position.x = (Math.random() < 0.5 ? -1 : 1) * rnd(11, 55); },
    });
  }

  // floating marshal lanterns
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xe6a23c, emissive: 0xc97a1a, emissiveIntensity: 2 });
  for (let i = 0; i < 14; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat);
    const side = Math.random() < 0.5 ? -1 : 1;
    l.position.set(side * rnd(8.4, 9.5), rnd(2.4, 3.4), rnd(-DEPTH, 20));
    l.userData.baseY = l.position.y;
    l.userData.phase = rnd(0, 6.28);
    scene.add(l);
    movers.push({ mesh: l, respawn: () => {}, bob: true });
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

  buildCar();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  requestAnimationFrame(loop);
}

function buildCar() {
  car = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x8a1212, roughness: 0.4, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141016, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 4.4), red);
  body.position.y = 0.5;
  car.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), red);
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.42, -3.0);
  car.add(nose);

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), dark);
  cockpit.position.set(0, 0.95, 0.3);
  car.add(cockpit);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 14, Math.PI), dark);
  halo.position.set(0, 1.1, 0.1);
  halo.rotation.z = 0;
  car.add(halo);

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

function loop(now) {
  requestAnimationFrame(loop);
  if (!running) return;
  t += 0.016;
  speed += (targetSpeed - speed) * 0.02;

  for (const m of movers) {
    m.mesh.position.z += speed;
    if (m.mesh.position.z > 30) {
      m.mesh.position.z -= DEPTH + 30;
      m.respawn(m.mesh);
    }
    if (m.bob) m.mesh.position.y = m.mesh.userData.baseY + Math.sin(t * 2 + m.mesh.userData.phase) * 0.25;
  }

  const p = embers.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, p.getZ(i) + speed * 0.6);
    p.setY(i, p.getY(i) + 0.012);
    if (p.getZ(i) > 16) p.setZ(i, -DEPTH);
    if (p.getY(i) > 15) p.setY(i, 0.2);
  }
  p.needsUpdate = true;

  for (const w of wheels) w.rotation.x -= speed * 2.2;
  car.position.y = Math.sin(t * 9) * 0.02;
  car.rotation.z = Math.sin(t * 1.3) * 0.012;
  camera.position.x = Math.sin(t * 0.4) * 0.5;
  camera.position.y = 4.2 + Math.sin(t * 0.9) * 0.08;
  camera.lookAt(car.position.x, 1, -22);

  renderer.render(scene, camera);
}

export function setSpeed(s) { targetSpeed = s; }
export function setRunning(r) { running = r; }
