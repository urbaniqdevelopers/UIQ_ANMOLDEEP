/* UrbanIQ Anmoldeep - 3D estate scene (three.js r128). Layout follows the Master Plan.
   1 unit = 10 ft.  x = east, z = south (north is -z).  Exposes window.UIQ3D. */
(function () {
'use strict';
const T = window.THREE;
const API = window.UIQ3D = { ok: false, P: {}, ready: null, pick() {}, explore() {}, night() {}, status() {} };
const $$ = s => [...document.querySelectorAll(s)];
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ez = t => t * t * (3 - 2 * t);
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches, MOB = innerWidth < 720 || /Mobi|Android/i.test(navigator.userAgent);

/* plot data from the master plan */
const P = API.P, sx = [-20, -14.7, -9.7, -4.7, .3, 5.3, 10.3, 15.3, 20.3], nx = [-20, -10.1, -.2, 9.7, 19.6];
for (let i = 0; i < 8; i++) P[i + 1] = { x0: sx[i], x1: sx[i + 1], z0: 3, z1: 11, s: i ? '4,000' : '4,240', d: i ? '50 × 80 ft' : '53 × 80 ft', t: 'Residential', n: 0, status: 'available' };
[12, 11, 10, 9].forEach((n, i) => P[n] = { x0: nx[i], x1: nx[i + 1], z0: -12.7, z1: -3, s: '9,603', d: '99 × 97 ft', t: 'Semi-commercial', n: 1, status: 'available' });
for (let n = 1; n <= 12; n++) { const p = P[n]; p.cx = (p.x0 + p.x1) / 2; p.cz = (p.z0 + p.z1) / 2; }

if (!T) { document.body.classList.add('nogl'); API.ready = Promise.resolve(false); return; }

let R;
try {
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl') || test.getContext('experimental-webgl'))) throw new Error('no webgl');
  R = new T.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: !MOB, powerPreference: 'high-performance' });
} catch (e) { console.warn('WebGL unavailable', e); document.body.classList.add('nogl'); API.ready = Promise.resolve(false); return; }

R.setPixelRatio(Math.min(devicePixelRatio || 1, MOB ? 1.25 : 1.75));
R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
R.shadowMap.enabled = true; R.shadowMap.type = MOB ? T.PCFShadowMap : T.PCFSoftShadowMap;
const MAXA = Math.min(R.capabilities.getMaxAnisotropy(), MOB ? 4 : 8);
R.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); document.body.classList.add('nogl'); });
R.domElement.addEventListener('webglcontextrestored', () => location.reload());

const S = new T.Scene(); S.fog = new T.FogExp2(0xffc99a, .0042);
const C = new T.PerspectiveCamera(48, 1, .3, 1200);

/* ---------------- texture toolkit ---------------- */
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, rx, ry, lin) => { const t = new T.CanvasTexture(c); if (!lin) t.encoding = T.sRGBEncoding; t.anisotropy = MAXA; if (rx) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); } return t; };
const speck = (x, w, h, cols, n, s) => { for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(Math.random() * w, Math.random() * h, s, s); } };

function grassCanvas(stripe) {
  const c = cv(512, 512), x = c.getContext('2d'); x.fillStyle = '#41702b'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { const px = rnd(0, 512), py = rnd(0, 512), g = x.createRadialGradient(px, py, 0, px, py, rnd(30, 90)); g.addColorStop(0, `hsla(${rnd(80, 105)},45%,${rnd(22, 36)}%,.45)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); }
  for (let i = 0; i < 11000; i++) { const px = rnd(0, 512), py = rnd(0, 512), l = rnd(3, 10); x.strokeStyle = `hsla(${rnd(78, 108)},${rnd(40, 62)}%,${rnd(20, 44)}%,.6)`; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + rnd(-3, 3), py - l); x.stroke(); }
  if (stripe) { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,200,.07)' : 'rgba(0,30,0,.1)'; x.fillRect(0, i * 64, 512, 64); } }
  return c;
}
const grassT = tex(grassCanvas(), 1, 1), lawnT = tex(grassCanvas(), 1, 1), stripeT = tex(grassCanvas(true), 1, 1);
const fieldT = (() => { const c = cv(512, 512), x = c.getContext('2d'); x.fillStyle = '#6e7b3c'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 90; i++) { const px = rnd(0, 512), py = rnd(0, 512), g = x.createRadialGradient(px, py, 0, px, py, rnd(40, 120)); g.addColorStop(0, `hsla(${rnd(50, 95)},35%,${rnd(28, 42)}%,.5)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); } speck(x, 512, 512, ['#5d6c30', '#85904a', '#4b5a28'], 5000, 2); return tex(c, 60, 60); })();
const asphaltC = (() => { const c = cv(512, 512), x = c.getContext('2d'); x.fillStyle = '#3a3a40'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 40; i++) { const px = rnd(0, 512), py = rnd(0, 512), g = x.createRadialGradient(px, py, 0, px, py, rnd(30, 80)); g.addColorStop(0, `rgba(${rnd(20, 70) | 0},${rnd(20, 70) | 0},${rnd(25, 75) | 0},.35)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); } speck(x, 512, 512, ['#555559', '#2a2a2e', '#6a6a6e', '#222226', '#4a4a50'], 16000, 2); return c; })();
const mkAsphalt = (rx, ry) => tex(asphaltC, rx, ry);
const pavC = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#8c6a58'; x.fillRect(0, 0, 256, 256); const cols = ['#c98a66', '#d19a76', '#bf7c5a', '#d6a283', '#c48766'];
  for (let r = 0; r < 16; r++) for (let k = 0; k < 8; k++) { const ox = (r % 2) * 16; x.fillStyle = pick(cols); x.fillRect(k * 32 + ox + 1, r * 16 + 1, 30, 14); }
  speck(x, 256, 256, ['rgba(255,255,255,.08)', 'rgba(0,0,0,.08)'], 1500, 2); return c; })();
const mkPav = (rx, ry) => tex(pavC, rx, ry);
const stuccoC = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#f5f2ea'; x.fillRect(0, 0, 256, 256); speck(x, 256, 256, ['rgba(215,205,190,.28)', 'rgba(255,255,255,.4)', 'rgba(190,180,165,.15)'], 3500, 2); return c; })();
const stuccoT = tex(stuccoC, 2, 2);
const stoneT = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#e4d3b2'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const ox = (r % 2) * 32; x.fillStyle = pick(['#e9dab9', '#dfcda9', '#ecdfc4', '#d8c4a0']); x.fillRect(k * 64 + ox + 1.5, r * 32 + 1.5, 61, 29); } speck(x, 256, 256, ['rgba(255,255,255,.1)', 'rgba(80,60,30,.1)'], 2500, 2); return tex(c, 2, 2); })();
const slateT = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#3d414b'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 16; r++) { for (let k = 0; k < 8; k++) { const ox = (r % 2) * 16; x.fillStyle = pick(['#454a55', '#3a3e48', '#4c515d', '#363a43']); x.fillRect(k * 32 + ox, r * 16, 31, 15); } x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, r * 16 + 14, 256, 2); } return tex(c, 1, 1); })();
const barkT = (() => { const c = cv(128, 256), x = c.getContext('2d'); x.fillStyle = '#6b4f37'; x.fillRect(0, 0, 128, 256); for (let i = 0; i < 700; i++) { x.strokeStyle = pick(['#4d3624', '#80603f', '#5b4230', '#8d6e4c']); x.lineWidth = rnd(1, 3); const px = rnd(0, 128); x.beginPath(); x.moveTo(px, rnd(0, 256)); x.lineTo(px + rnd(-3, 3), rnd(0, 256)); x.stroke(); } return tex(c, 1, 2); })();
const palmBarkT = (() => { const c = cv(64, 128), x = c.getContext('2d'); x.fillStyle = '#8b6a45'; x.fillRect(0, 0, 64, 128); for (let r = 0; r < 16; r++) { const y = r * 8; x.fillStyle = pick(['#6d5133', '#9a7850', '#785a3a']); x.fillRect(0, y + 1, 64, 6); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, y, 64, 1.5); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(40,25,10,.25)'; x.fillRect(k * 11 + (r % 2) * 5, y + 2, 2, 5); } } return tex(c, 1, 1); })();
const leafT = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#4c8a34'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { x.save(); x.translate(rnd(0, 256), rnd(0, 256)); x.rotate(rnd(0, 6.3)); x.fillStyle = `hsla(${rnd(75, 115)},${rnd(40, 65)}%,${rnd(22, 52)}%,.85)`; x.beginPath(); x.ellipse(0, 0, rnd(3, 7), rnd(1.5, 3), 0, 0, 7); x.fill(); x.restore(); } return tex(c, 2, 2); })();
const frondT = (() => { const c = cv(256, 96), x = c.getContext('2d'); x.strokeStyle = '#356b24'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 48); x.lineTo(256, 48); x.stroke();
  for (let i = 0; i < 64; i++) { const px = i * 3.8, len = 42 * Math.pow(1 - i / 70, .7) + 5; x.strokeStyle = pick(['#3f8a2c', '#53a238', '#367a27', '#62b042']); x.lineWidth = 2.2; x.beginPath(); x.moveTo(px, 48); x.lineTo(px + 15, 48 - len); x.moveTo(px, 48); x.lineTo(px + 15, 48 + len); x.stroke(); } return tex(c); })();
const glowT = (() => { const c = cv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,200,120,1)'); g.addColorStop(.35, 'rgba(255,170,80,.35)'); g.addColorStop(1, 'rgba(255,150,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return tex(c, 0, 0, true); })();
const cloudT = (() => { const c = cv(256, 128), x = c.getContext('2d'); for (let i = 0; i < 26; i++) { const px = rnd(40, 216), py = rnd(40, 90), r = rnd(18, 44), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); } return tex(c, 0, 0, true); })();
const waterT = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#7fd6ee'; x.fillRect(0, 0, 256, 256); x.lineWidth = 2; for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(255,255,255,${rnd(.15, .5)})`; x.beginPath(); const px = rnd(0, 256), py = rnd(0, 256); x.moveTo(px, py); x.bezierCurveTo(px + rnd(-30, 30), py + rnd(-30, 30), px + rnd(-30, 30), py + rnd(-30, 30), px + rnd(-40, 40), py + rnd(-40, 40)); x.stroke(); } return tex(c, 2, 1); })();

const M = o => new T.MeshStandardMaterial(o);
const mat = {
  wall: M({ map: stuccoT, roughness: .92 }), stone: M({ map: stoneT, roughness: .85 }), white: M({ color: 0xfbf8f1, roughness: .7 }),
  roof: M({ map: slateT, roughness: .6, side: T.DoubleSide }), bark: M({ map: barkT, roughness: 1 }), pbark: M({ map: palmBarkT, roughness: 1 }),
  frond: M({ map: frondT, alphaTest: .35, side: T.DoubleSide, roughness: .7 }), leaf: M({ map: leafT, bumpMap: leafT, bumpScale: 1.2, vertexColors: true, roughness: .85 }),
  pole: M({ color: 0x17130f, roughness: .45, metalness: .65 }), glass: M({ color: 0x2b3b4a, roughness: .08, metalness: .6 }),
  hedge: M({ map: leafT, color: 0x6f9d55, roughness: 1 }), wood: M({ color: 0x8a5a33, roughness: .8 }), water: M({ map: waterT, color: 0x8fdcf0, roughness: .05, metalness: .15, emissive: 0x1b8fb5, emissiveIntensity: .25 }),
  curb: M({ color: 0xe3ddd0, roughness: .9 }), soil: M({ color: 0x5b4330, roughness: 1 }), dark: M({ color: 0x2a1b12, roughness: .6 })
};
const lit = [], lampBulbs = [], glows = [], pools = [], bulbPts = [];
const sh = (o, c = true, r = true) => { o.castShadow = c; o.receiveShadow = r; return o; };
function add(geo, m, x, y, z, par, cast = true) { const o = sh(new T.Mesh(geo, m), cast); o.position.set(x, y, z); (par || S).add(o); return o; }
const bx = (w, h, d, m, x, y, z, par, cast) => add(new T.BoxGeometry(w, h, d), m, x, y, z, par, cast);
const cy = (rt, rb, h, m, x, y, z, par, seg = 12, cast) => add(new T.CylinderGeometry(rt, rb, h, seg), m, x, y, z, par, cast);
function plane(w, d, x, z, m, y) { const o = new T.Mesh(new T.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(x, y || .02, z); o.receiveShadow = true; S.add(o); return o; }
function tplane(w, d, x, z, base, rep, y, extra) { const t = base.clone(); t.needsUpdate = true; t.repeat.set(w / rep, d / rep); return plane(w, d, x, z, M(Object.assign({ map: t, roughness: .9 }, extra || {})), y); }
function inst(geo, m, items, cast) {
  const im = new T.InstancedMesh(geo, m, items.length), d = new T.Object3D(), col = new T.Color();
  items.forEach((it, i) => { d.position.set(...it.p); d.scale.set(...(it.s || [1, 1, 1])); d.rotation.set(0, it.r || 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); if (it.c != null) im.setColorAt(i, col.set(it.c)); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = !!cast; im.receiveShadow = true; S.add(im); return im;
}
function ribbon(pts, w, m, y) {
  const pos = [], uv = [], idx = []; let L = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; if (i) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pos.push(pts[i].x - tz * w / 2, 0, pts[i].z + tx * w / 2, pts[i].x + tz * w / 2, 0, pts[i].z - tx * w / 2); uv.push(0, L / w, 1, L / w); if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const o = new T.Mesh(g, m); o.position.y = y; o.receiveShadow = true; S.add(o); return o;
}
const curve2 = a => new T.CatmullRomCurve3(a.map(p => new T.Vector3(p[0], 0, p[1]))).getPoints(a.length * 8);

/* ---------------- sky, light ---------------- */
const sky = new T.Mesh(new T.SphereGeometry(600, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new T.Color() }, hor: { value: new T.Color() }, gl: { value: new T.Color(0xffa860) } },
  vertexShader: 'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'varying vec3 v;uniform vec3 top,hor,gl;void main(){float h=clamp(v.y,0.,1.);vec3 c=mix(hor,top,pow(h,.55));float s=pow(max(dot(v,normalize(vec3(-.9,.2,-.3))),0.),18.);c+=gl*s*.9;gl_FragColor=vec4(c,1.);}' }));
S.add(sky);
const sg = new Float32Array(1200); for (let i = 0; i < 400; i++) { const a = rnd(0, 6.28), e = .12 + rnd(0, 1.3), r = 560; sg[i * 3] = Math.cos(a) * Math.cos(e) * r; sg[i * 3 + 1] = Math.sin(e) * r; sg[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
const sgeo = new T.BufferGeometry(); sgeo.setAttribute('position', new T.BufferAttribute(sg, 3));
const stars = new T.Points(sgeo, new T.PointsMaterial({ color: 0xfff2d8, size: 2.2, transparent: true, fog: false, opacity: 0, depthWrite: false })); S.add(stars);
const clouds = []; for (let i = 0; i < 14; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, opacity: .8, color: 0xffe2c4 })); const a = rnd(0, 6.28), r = rnd(380, 520); s.position.set(Math.cos(a) * r, rnd(60, 150), Math.sin(a) * r); s.scale.set(rnd(160, 300), rnd(50, 90), 1); S.add(s); clouds.push(s); }
const hemi = new T.HemisphereLight(0xffe4c4, 0x45603a, .75); S.add(hemi);
const sun = new T.DirectionalLight(0xffd4a2, 2.0); sun.position.set(-70, 34, -26); sun.target.position.set(10, 0, -4); S.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(MOB ? 1024 : 2048, MOB ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -58, right: 58, top: 46, bottom: -46, near: 1, far: 240 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
const ptl = [[24, 5.5, -13.4], [34, 3, -5], [0, 4, 0]].map(p => { const l = new T.PointLight(0xffb870, 0, 22, 2); l.position.set(...p); S.add(l); return l; });

/* ---------------- ground, roads (as per master plan) ---------------- */
plane(1400, 1400, 0, 0, M({ map: fieldT, roughness: 1 }), -.02);
tplane(66, 40, 9.5, -4.8, grassT, 4, .02, { roughness: 1 });
const road = (w, d, x, z, y) => { const o = tplane(w, d, x, z, mkAsphalt(1, 1), 8, y || .03, { roughness: .88 }); return o; };
road(43.4, 4, .5, 0); road(4, 34.4, 24, -4.8); road(220, 5, 20, -24.5);
const dashT = (() => { const c = cv(64, 8), x = c.getContext('2d'); x.fillStyle = '#f4ead2'; x.fillRect(4, 2, 30, 4); return tex(c, 0, 0); })();
const dashes = (len, x, z, rot) => { const t = dashT.clone(); t.needsUpdate = true; t.wrapS = T.RepeatWrapping; t.repeat.set(len / 2, 1); const o = plane(len, .14, x, z, new T.MeshBasicMaterial({ map: t, transparent: true }), .05); o.rotation.z = rot || 0; return o; };
dashes(42, .5, 0); { const o = dashes(32, 24, -4.8); o.rotation.z = Math.PI / 2; } dashes(200, 20, -24.5);
[[43.4, .08, .5, -1.85], [43.4, .08, .5, 1.85]].forEach(a => plane(a[0], a[1], a[2], a[3], new T.MeshBasicMaterial({ color: 0xf2ecdf }), .05));
/* kerbs and brick walkways */
const walk = (w, d, x, z) => { tplane(w, d, x, z, mkPav(1, 1), 1, .05, { roughness: .78 }); };
walk(43, 1, .5, -2.5); walk(43, 1, .5, 2.5); walk(43, 1, .5, -13.2);
walk(1, 34.4, 21.5, -4.8); walk(1, 34.4, 26.5, -4.8);
[[43.4, .12, .5, -2.02], [43.4, .12, .5, 2.02], [.12, 34.4, 22.02, -4.8], [.12, 34.4, 25.98, -4.8]].forEach(a => bx(a[0], .1, a[1], mat.curb, a[2], .07, a[3], null, false));
bx(43, .1, .1, mat.curb, .5, .07, -3.02, null, false); bx(43, .1, .1, mat.curb, .5, .07, 3.02, null, false);

/* ---------------- plants ---------------- */
function crownGeo(seed) {
  const g = new T.SphereGeometry(1, 22, 16), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + .2 * Math.sin(x * 4.1 + seed) * Math.sin(y * 3.3 + seed * 2) + .14 * Math.sin(z * 6.2 + seed * 3) + .08 * Math.sin((x + z) * 11 + seed);
    p.setXYZ(i, x * d, y * d * .82, z * d); c.setHSL(.255 + .04 * Math.sin(x * 3 + seed), .5, .2 + .26 * ((y + 1) / 2) + .04 * Math.sin(z * 9 + seed)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
const crowns = [crownGeo(1), crownGeo(7), crownGeo(13)];
const trunkG = new T.CylinderGeometry(.5, 1, 1, 8);
function tree(x, z, s, par) {
  const g = new T.Group(), h = 1.5 * s, tr = sh(new T.Mesh(trunkG, mat.bark)); tr.scale.set(.1 * s, h, .1 * s); tr.position.y = h / 2; g.add(tr);
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + rnd(0, 1), b = sh(new T.Mesh(trunkG, mat.bark)); b.scale.set(.04 * s, .8 * s, .04 * s); b.position.set(Math.cos(a) * .22 * s, h + .1 * s, Math.sin(a) * .22 * s); b.rotation.set(Math.sin(a) * .7, 0, -Math.cos(a) * .7); g.add(b); }
  const n = 5 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { const c = sh(new T.Mesh(pick(crowns), mat.leaf)), r = i ? rnd(.55, .95) : 1.15, a = rnd(0, 6.28), rr = i ? rnd(.5, 1.1) : 0;
    c.scale.setScalar(r * s); c.position.set(Math.cos(a) * rr * s, h + (.5 + rnd(0, .9) + (i ? 0 : .5)) * s, Math.sin(a) * rr * s); c.rotation.y = rnd(0, 6); g.add(c); }
  g.position.set(x, 0, z); g.rotation.y = rnd(0, 6.28); (par || S).add(g); return g;
}
const frondG = (() => { const g = new T.PlaneGeometry(1.9, .55, 10, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getX(i) + .95) / 1.9, wy = p.getY(i); p.setX(i, t * 1.8); p.setY(i, .45 * t - t * t * .95); p.setZ(i, wy); } g.computeVertexNormals(); return g; })();
function palm(x, z, h) {
  const g = new T.Group(), tr = sh(new T.Mesh(new T.CylinderGeometry(.09, .15, h, 10, 6), mat.pbark)); tr.position.y = h / 2; g.add(tr);
  tr.material = mat.pbark.clone(); tr.material.map = palmBarkT.clone(); tr.material.map.needsUpdate = true; tr.material.map.repeat.set(1, h * 2);
  cy(.1, .1, .22, M({ color: 0x5f8f3a, roughness: .8 }), 0, h + .02, 0, g, 8);
  for (let i = 0; i < 15; i++) { const f = sh(new T.Mesh(frondG, mat.frond), !MOB, false), a = i * 2.4; f.position.y = h + .08; f.rotation.set(rnd(-.25, .15), a, rnd(-.25, .35), 'YXZ'); f.scale.setScalar(rnd(.85, 1.15)); g.add(f); }
  g.position.set(x, 0, z); g.rotation.z = rnd(-.03, .03); S.add(g); return g;
}
const flowerG = new T.IcosahedronGeometry(.07, 0), bushG = new T.SphereGeometry(1, 10, 8);
const FL = [0xff7a1a, 0xff9a3c, 0xe94a2d, 0xffd36b, 0xf06292, 0xffffff];
function bed(pts, spread) { /* flowers + shrubs along list of [x,z] */
  const f = [], b = [];
  pts.forEach(p => { for (let i = 0; i < 9; i++) f.push({ p: [p[0] + rnd(-spread, spread), rnd(.1, .22), p[1] + rnd(-spread, spread)], s: [1, 1, 1].map(() => rnd(.8, 1.5)), c: pick(FL) }); b.push({ p: [p[0], .17, p[1]], s: [rnd(.2, .32), rnd(.13, .2), rnd(.2, .32)], c: pick([0x3f7a33, 0x52903c, 0x2f6a2c]) }); });
  inst(flowerG, M({ roughness: .6, emissive: 0x331100, emissiveIntensity: .25 }), f, false); inst(bushG, mat.hedge, b, true);
}
function hedgeLine(x0, z0, x1, z1, h) { const l = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(l / .5), it = []; for (let i = 0; i <= n; i++) { const t = i / n; it.push({ p: [x0 + (x1 - x0) * t, (h || .35) / 2, z0 + (z1 - z0) * t], s: [.34, (h || .35) / 2 + rnd(-.02, .03), .34], c: pick([0x3a6f30, 0x477f38, 0x346629]) }); } inst(bushG, mat.hedge, it, true); }

/* ---------------- lamps ---------------- */
const lampParts = { base: new T.BoxGeometry(.18, .26, .18), pole: new T.CylinderGeometry(.025, .045, 1, 8), collar: new T.CylinderGeometry(.06, .06, .08, 8), arm: new T.TorusGeometry(.17, .014, 6, 12, Math.PI / 2), cap: new T.ConeGeometry(.15, .13, 4), glass: new T.BoxGeometry(.17, .22, .17), gl: new T.PlaneGeometry(2.4, 2.4) };
const bulbMat = M({ color: 0xfff0d0, emissive: 0xffa94a, emissiveIntensity: .5, roughness: .4 });
const poolMat = new T.MeshBasicMaterial({ map: glowT, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false });
function lamp(x, z, h, rot) {
  h = h || 1.9; const g = new T.Group();
  const b = sh(new T.Mesh(lampParts.base, mat.pole)); b.position.y = .13; g.add(b);
  const p = sh(new T.Mesh(lampParts.pole, mat.pole)); p.scale.y = h; p.position.y = h / 2 + .2; g.add(p);
  const c = new T.Mesh(lampParts.collar, mat.pole); c.position.y = .75; g.add(c);
  const arm = new T.Mesh(lampParts.arm, mat.pole); arm.position.set(.17, h + .03, 0); g.add(arm);
  const lg = new T.Mesh(lampParts.glass, bulbMat); lg.position.set(.17, h + .03, 0); g.add(lg); lampBulbs.push(lg);
  const cap = new T.Mesh(lampParts.cap, mat.pole); cap.position.set(.17, h + .2, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
  const s = new T.Sprite(new T.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: .1 })); s.scale.set(1.6, 1.6, 1); s.position.set(.17, h + .03, 0); g.add(s); glows.push(s);
  const gp = new T.Mesh(lampParts.gl, poolMat); gp.rotation.x = -Math.PI / 2; gp.position.set(.17, .09 - .03, 0); gp.renderOrder = 2; g.add(gp);
  g.position.set(x, 0, z); g.rotation.y = rot || 0; S.add(g); return g;
}
function bench(x, z, rot) { const g = new T.Group(); bx(1, .1, .36, mat.wood, 0, .34, 0, g); bx(1, .3, .06, mat.wood, 0, .56, -.17, g); [-.4, .4].forEach(k => bx(.08, .3, .34, mat.stone, k, .15, 0, g)); g.position.set(x, 0, z); g.rotation.y = rot || 0; S.add(g); }

/* ---------------- facade textures ---------------- */
function facade(o) { /* o: cols, floors, door (centre arch), shop */
  const cw = 120, W = o.cols * cw, FH = 140, H = o.floors * FH + 34, c = cv(W, H), x = c.getContext('2d'), e = cv(W, H), y = e.getContext('2d');
  x.fillStyle = '#f6f3ec'; x.fillRect(0, 0, W, H); speck(x, W, H, ['rgba(215,205,190,.25)', 'rgba(255,255,255,.4)'], W * 5, 2); y.fillStyle = '#000'; y.fillRect(0, 0, W, H);
  x.fillStyle = '#dcd4c4'; x.fillRect(0, H - 34, W, 34);
  for (let f = 1; f < o.floors; f++) { x.fillStyle = '#e8e1d3'; x.fillRect(0, f * FH + 6, W, 9); }
  const win = (cx, top, w, h, arch, lite) => {
    const l = cx - w / 2; x.fillStyle = '#fff'; x.fillRect(l - 7, top - 7, w + 14, h + 14); if (arch) { x.beginPath(); x.arc(cx, top, w / 2 + 7, Math.PI, 0); x.fill(); }
    const g = x.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, '#6d8598'); g.addColorStop(.5, '#2d3e4e'); g.addColorStop(1, '#1b2733'); x.fillStyle = g; x.fillRect(l, top, w, h); if (arch) { x.beginPath(); x.arc(cx, top, w / 2, Math.PI, 0); x.fill(); }
    const lines = ctx => { ctx.beginPath(); ctx.moveTo(cx, top - (arch ? w / 2 : 0)); ctx.lineTo(cx, top + h); ctx.moveTo(l, top + h * .5); ctx.lineTo(l + w, top + h * .5); ctx.stroke(); };
    x.strokeStyle = '#fff'; x.lineWidth = 3; lines(x); x.fillStyle = '#e2dacb'; x.fillRect(l - 10, top + h + 7, w + 20, 7);
    if (Math.random() < lite) { y.fillStyle = '#ffc577'; y.fillRect(l, top, w, h); if (arch) { y.beginPath(); y.arc(cx, top, w / 2, Math.PI, 0); y.fill(); } y.strokeStyle = '#000'; y.lineWidth = 3; lines(y); }
  };
  const mid = (o.cols - 1) / 2;
  for (let f = 0; f < o.floors; f++) { const y0 = f * FH + 18, ground = f === o.floors - 1;
    for (let k = 0; k < o.cols; k++) { const cx = (k + .5) * cw; if (ground && o.shop && !(o.door && k === mid)) win(cx, y0 + 18, 98, 98, false, .9);
      else if (k === mid && o.door) { if (ground) win(cx, y0 + 30, 74, 90, true, 1); else win(cx, y0 + 16, 64, 100, f === 0 && o.floors === 2, .95); }
      else win(cx, y0 + 16, 58, ground ? 98 : 92, false, .75); } }
  const m = M({ map: tex(c), emissiveMap: tex(e), emissive: 0xffffff, emissiveIntensity: .12, roughness: .8 }); m.userData = { b: .12, g: 1.7 }; lit.push(m); return m;
}
const fcache = {}; const fac = o => { const k = JSON.stringify(o); return fcache[k] || (fcache[k] = facade(o)); };

function hipRoof(w, d, h, rl, oh) {
  const hw = w / 2 + oh, hd = d / 2 + oh, v = [], tri = (a, b, c) => v.push(...a, ...b, ...c);
  tri([-hw, 0, hd], [hw, 0, hd], [rl, h, 0]); tri([-hw, 0, hd], [rl, h, 0], [-rl, h, 0]);
  tri([hw, 0, -hd], [-hw, 0, -hd], [-rl, h, 0]); tri([hw, 0, -hd], [-rl, h, 0], [rl, h, 0]);
  tri([hw, 0, hd], [hw, 0, -hd], [rl, h, 0]); tri([-hw, 0, -hd], [-hw, 0, hd], [-rl, h, 0]);
  const g = new T.BufferGeometry(), uv = []; for (let i = 0; i < v.length; i += 3) uv.push(v[i] * 1.6 + v[i + 2] * .6, v[i + 1] * 2.6);
  g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
function columns(g, n, span, h, z, r) { for (let i = 0; i < n; i++) { const px = -span / 2 + span * i / (n - 1); cy(r, r * 1.05, h, mat.white, px, h / 2 + .2, z, g, 14); bx(r * 3, .07, r * 3, mat.white, px, .22, z, g); bx(r * 3, .08, r * 3, mat.white, px, h + .2, z, g); } }
function pediment(g, w, y, z, d) { const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, w * .09); const m = sh(new T.Mesh(new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }), mat.white)); m.position.set(0, y, z - d / 2); g.add(m); }
function balustrade(g, w, y, z, n) { for (let i = 0; i < n; i++) cy(.018, .018, .22, mat.white, -w / 2 + w * i / (n - 1), y + .11, z, g, 6, false); bx(w, .045, .06, mat.white, 0, y + .24, z, g, false); }

/* ---------------- white premium villa (plots 1-8) ---------------- */
function villa(w) {
  const g = new T.Group(), bw = Math.max(2.9, w - 1.7), bd = 3.1, fh = 1.55, H = fh * 2, ax = w / 2 - bw / 2 - .35;
  const fr = fac({ cols: 5, floors: 2, door: true }), sd = fac({ cols: 3, floors: 2 });
  const body = sh(new T.Mesh(new T.BoxGeometry(bw, H, bd), [sd, sd, mat.white, mat.white, fr, fac({ cols: 5, floors: 2 })])); body.position.set(-ax / 2 + .1, H / 2 + .12, 0); g.add(body);
  const bxp = body.position.x;
  bx(bw + .14, .09, bd + .14, mat.white, bxp, H + .16, 0, g);                       /* cornice */
  const roof = sh(new T.Mesh(hipRoof(bw, bd, 1.0, bw * .28, .22), mat.roof)); roof.position.set(bxp, H + .2, 0); g.add(roof);
  bx(bw + .5, .05, bd + .5, mat.white, bxp, H + .2, 0, g, false);                     /* eaves */
  bx(.3, .8, .3, mat.white, bxp - bw * .3, H + .8, -.5, g); bx(.38, .06, .38, mat.white, bxp - bw * .3, H + 1.22, -.5, g);
  /* portico */
  const pw = bw * .52; columns(g, 4, pw, fh * 1.02, bd / 2 + .6, .07); bx(pw + .3, .12, .9, mat.white, bxp, fh * 1.02 + .3, bd / 2 + .38, g);
  bx(pw + .3, .08, .9, mat.white, bxp, .17, bd / 2 + .38, g);
  balustrade(g, pw + .3, fh * 1.02 + .36, bd / 2 + .8, 12);
  [0, 1, 2].forEach(i => bx(pw * .8 + i * .2, .05, .5 - i * .1, mat.stone, bxp, .06 + i * .05, bd / 2 + 1.2 - i * .1 + .02, g, false));
  [-1, 1].forEach(k => { cy(.1, .08, .14, mat.stone, bxp + k * (pw / 2 + .3), .1, bd / 2 + 1.05, g, 10); add(new T.SphereGeometry(.15, 12, 10), mat.hedge, bxp + k * (pw / 2 + .3), .31, bd / 2 + 1.05, g); });
  /* side annex: glass lounge with terrace */
  const aw = .95, ah = 1.4; bx(aw, ah, bd * .72, fac({ cols: 1, floors: 1, shop: true }), bxp + bw / 2 + aw / 2, ah / 2 + .12, .3, g);
  bx(aw + .1, .08, bd * .72 + .1, mat.white, bxp + bw / 2 + aw / 2, ah + .15, .3, g); balustrade(g, aw, ah + .18, bd * .72 / 2 + .3, 5);
  /* garden wall lanterns */
  [-1, 1].forEach(k => { const l = bx(.07, .12, .07, bulbMat, bxp + k * (pw / 2 + .02), fh * .55, bd / 2 + .05, g, false); lampBulbs.push(l); });
  /* pool + deck */
  const pz = bd / 2 + 2.35, pwid = 1.7, px = w / 2 - pwid / 2 - .3;
  bx(pwid + .8, .05, 1.9, mat.stone, px, .05, pz, g, false);
  const water = new T.Mesh(new T.PlaneGeometry(pwid, 1.1), mat.water); water.rotation.x = -Math.PI / 2; water.position.set(px, .085, pz); water.receiveShadow = true; g.add(water);
  [[0, .59, pwid + .16, .06], [0, -.59, pwid + .16, .06]].forEach(a => bx(a[2], .07, a[3], mat.white, px, .1, pz + a[1], g, false));
  [-1, 1].forEach(k => bx(.06, .07, 1.12, mat.white, px + k * (pwid / 2 + .05), .1, pz, g, false));
  const pl = bx(.1, .02, .1, new T.MeshBasicMaterial({ color: 0x66e6ff }), px, .09, pz, g, false); pools.push(pl);
  [-.55, -.1].forEach(k => bx(.22, .05, .62, M({ color: 0xf2ede2, roughness: .8 }), px + k, .12, pz + .8, g, false));
  add(new T.ConeGeometry(.42, .2, 12), M({ color: 0xf7efe0, roughness: .8, side: T.DoubleSide }), px + .5, .62, pz + .8, g); cy(.012, .012, .55, mat.pole, px + .5, .34, pz + .8, g, 6);
  /* path + lawn gate */
    return g;
}

/* ---------------- grand white commercial block (plots 9-12) ---------------- */
function commercial(w, ci) {
  const g = new T.Group(), cw = 4.6, cd = 4.8, ch = 4.8, wd = 4.0, wh = 3.3, wx = cw / 2 + (w - 1.2 - cw) / 4;
  const wallsC = [fac({ cols: 3, floors: 3, door: true, shop: true }), fac({ cols: 3, floors: 3 })];
  const center = sh(new T.Mesh(new T.BoxGeometry(cw, ch, cd), [wallsC[1], wallsC[1], mat.white, mat.white, fac({ cols: 5, floors: 3, door: true, shop: true }), wallsC[1]])); center.position.set(0, ch / 2 + .12, 0); g.add(center);
  const wingW = (w - 1.0 - cw) / 2;
  [-1, 1].forEach(k => { const wing = sh(new T.Mesh(new T.BoxGeometry(wingW, wh, wd), [fac({ cols: 3, floors: 2 }), fac({ cols: 3, floors: 2 }), mat.white, mat.white, fac({ cols: Math.max(3, Math.round(wingW / 1.0)), floors: 2, shop: true }), fac({ cols: 3, floors: 2 })])); wing.position.set(k * (cw / 2 + wingW / 2), wh / 2 + .12, -.4); g.add(wing);
    bx(wingW + .12, .1, wd + .12, mat.white, k * (cw / 2 + wingW / 2), wh + .17, -.4, g);
    const r = sh(new T.Mesh(hipRoof(wingW, wd, .75, wingW * .25, .2), mat.roof)); r.position.set(k * (cw / 2 + wingW / 2), wh + .2, -.4); g.add(r);
    /* awning over shop fronts */
    const aw = bx(wingW - .2, .05, .55, M({ color: ci % 2 ? 0xf0601e : 0xd8ab5a, roughness: .7 }), k * (cw / 2 + wingW / 2), 1.35, wd / 2 - .4 + .25, g, false); aw.rotation.x = .25; });
  bx(cw + .16, .1, cd + .16, mat.white, 0, ch + .17, 0, g); const roof = sh(new T.Mesh(hipRoof(cw, cd, 1.35, cw * .22, .25), mat.roof)); roof.position.set(0, ch + .2, 0); g.add(roof);
  [-1, 1].forEach(k => { bx(.34, .9, .34, mat.white, k * cw * .3, ch + 1.0, -.6, g); });
  /* grand portico: 6 tall columns, balcony slab, pediment */
  const pz = cd / 2 + .8, pwid = cw * .86; columns(g, 6, pwid, ch * .62, pz, .1); bx(pwid + .4, .18, 1.5, mat.white, 0, ch * .62 + .32, cd / 2 + .55, g); bx(pwid + .4, .1, 1.5, mat.white, 0, .17, cd / 2 + .55, g);
  balustrade(g, pwid + .4, ch * .62 + .4, pz + .02, 18); pediment(g, pwid + .6, ch * .62 + .4, cd / 2 + .55, .5);
  [0, 1, 2, 3].forEach(i => bx(pwid * .7 + i * .25, .05, .75 - i * .12, mat.stone, 0, .06 + i * .05, cd / 2 + 1.7 - i * .1, g, false));
  /* forecourt: parking bays, planters, cars */
  const fz = cd / 2 + 2.1, pt = tplane(w - .8, 2.2, 0, 0, mkPav(1, 1), 1, .055, { roughness: .8 }); pt.position.set(0, .055, fz + .6); g.add(pt);
  for (let i = 0; i < 9; i++) bx(.04, .01, 1.0, new T.MeshBasicMaterial({ color: 0xf2ecdf }), -w / 2 + .8 + i * ((w - 1.6) / 8), .065, fz + 1.5, g, false);
  for (let i = 0; i < 3; i++) car(g, -w / 2 + 1.5 + i * 1.95 + (ci % 2) * .4, fz + 1.2);
  [-1, 1].forEach(k => { for (let j = 0; j < 3; j++) { cy(.12, .1, .26, mat.stone, k * (pwid / 2 + .5), .15, cd / 2 + 1.1 + j * .8, g, 10); add(new T.SphereGeometry(.2, 12, 10), mat.hedge, k * (pwid / 2 + .5), .44, cd / 2 + 1.1 + j * .8, g); } });
  hedgeLine(-w / 2 + .3, cd / 2 + 4.35, w / 2 - .3, cd / 2 + 4.35, .45);
  return g;
}
function car(g, x, z) { const c = pick([0xf2efe9, 0x1c1c20, 0x7a8590, 0x8a1f1f, 0x23415e]), b = M({ color: c, roughness: .25, metalness: .6 }); bx(.55, .17, 1.15, b, x, .17, z, g); bx(.5, .16, .62, mat.glass, x, .33, z - .05, g); bx(.5, .02, .1, bulbMat, x, .18, z + .58, g, false); }

/* ---------------- plots (per master plan) ---------------- */
const hl = new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xf0601e, transparent: true, opacity: .35, depthWrite: false })); hl.visible = false; hl.position.y = .12; S.add(hl);
const olMat = new T.LineBasicMaterial({ color: 0xf0601e, transparent: true, opacity: .55 });
function sprite(t, sz) { const c = cv(128, 128), x = c.getContext('2d'); x.fillStyle = '#f0601e'; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 60px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, 68); const s = new T.Sprite(new T.SpriteMaterial({ map: tex(c), fog: false, transparent: true })); s.scale.set(sz, sz, 1); return s; }
for (let n = 1; n <= 12; n++) {
  const p = P[n], w = p.x1 - p.x0, d = p.z1 - p.z0;
  tplane(w - .1, d - .1, p.cx, p.cz, lawnT, 6, .045, { color: 0xdff0c8, roughness: 1 });
  S.add(new T.LineLoop(new T.BufferGeometry().setFromPoints([[p.x0, .1, p.z0], [p.x1, .1, p.z0], [p.x1, .1, p.z1], [p.x0, .1, p.z1]].map(a => new T.Vector3(...a))), olMat));
  if (p.n) { const b = commercial(w, n); b.position.set(p.cx, 0, p.z0 + 2.9); b.rotation.y = 0; S.add(b); p.bld = b; }
  else { const b = villa(w); b.position.set(p.cx, 0, p.z1 - 2.1); b.rotation.y = Math.PI; if (n % 2) b.scale.x = -1; S.add(b); p.bld = b; }
  const sp = sprite(n, 1.7); sp.position.set(p.cx, p.n ? 7.4 : 5.4, p.cz); S.add(sp);
}
/* boundary hedges between plots and the walkways */
hedgeLine(-20, -12.6, 19.6, -12.6, .35); hedgeLine(-20, 3.35, 20.3, 3.35, .3);

/* ---------------- palm avenue (6), lamps ---------------- */
for (let x = -18.5; x <= 20; x += 4.9) { palm(x, -2.5, rnd(3.2, 3.7)); palm(x + 2.4, 2.5, rnd(3.2, 3.7)); lamp(x + 2.4, -2.5, 1.9, Math.PI); lamp(x, 2.5, 1.9, 0); }
for (let z = -18; z <= 10; z += 4.6) { palm(26.5, z, rnd(3.2, 3.7)); lamp(26.5, z + 2.3, 1.9, Math.PI); if (z > -14) { palm(21.5, z + 2.3, rnd(3.2, 3.6)); } }
lamp(-20.6, -.4, 1.9, 0); lamp(-20.6, 5.5, 1.9, 0);

/* ---------------- (4) landscaped park north of plots 9-12 ---------------- */
tplane(42.4, 7.4, .2, -17.7, lawnT, 6, .035, { roughness: 1 });
const parkPath = curve2([[-19.5, -18.6], [-17, -16.2], [-14, -19.6], [-10.5, -16.6], [-7, -18.4], [-4, -19.8], [-1, -17.2], [2.5, -15.9], [6.5, -18.6], [10.5, -17], [14.5, -15.6], [18, -15.4]]);
ribbon(parkPath, .8, M({ map: mkPav(1, 1), roughness: .8 }), .06);
const rosette = new T.Group(); rosette.position.set(.6, 0, -18.2); S.add(rosette);
add(new T.CylinderGeometry(1.15, 1.2, .14, 28), mat.stone, 0, .09, 0, rosette); add(new T.CylinderGeometry(.95, .95, .17, 28), mat.soil, 0, .1, 0, rosette);
{ const it = []; for (let i = 0; i < 70; i++) { const a = rnd(0, 6.28), r = Math.sqrt(Math.random()) * .9; it.push({ p: [.6 + Math.cos(a) * r, .26 + rnd(0, .08), -18.2 + Math.sin(a) * r], s: [1.6, 1.6, 1.6], c: pick([0xe0245e, 0xff4d6d, 0xc2185b, 0xff8fab, 0xff7a1a]) }); } inst(flowerG, M({ roughness: .5, emissive: 0x220008, emissiveIntensity: .3 }), it, false); }
for (let i = 0; i < 5; i++) { const a = i * 1.256, ag = add(new T.ConeGeometry(.12, .7, 6), M({ color: 0x3f7f4d, roughness: .7 }), 0, .55, 0, rosette); ag.position.set(Math.cos(a) * .12, .55, Math.sin(a) * .12); ag.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); }
/* stone circle with boulders (top-left of plan) */
add(new T.CylinderGeometry(1.7, 1.75, .1, 28), mat.stone, -17.8, .08, -18.2); { const bl = []; for (let i = 0; i < 7; i++) { const a = i * .9; bl.push({ p: [-17.8 + Math.cos(a) * 1.0 + rnd(-.3, .3), .12, -18.2 + Math.sin(a) * .9 + rnd(-.3, .3)], s: [rnd(.2, .35), rnd(.12, .22), rnd(.2, .35)], c: pick([0x9a948a, 0xb0a99b, 0x857f76]) }); } inst(new T.IcosahedronGeometry(1, 1), M({ roughness: .95, flatShading: true }), bl, true); }
bench(-16.2, -16.6, Math.PI * .2); bench(-9.2, -15.2, Math.PI); bench(-3, -16.3, Math.PI); bench(10.4, -18.3, 0); bench(5.5, -20.3, 0);
bed(parkPath.filter((p, i) => i % 6 === 0).map(p => [p.x + rnd(-.9, .9), p.z + rnd(-.9, .9)]), .35);
[[-20, -20.6], [-12, -20.7], [-6, -20.9], [3, -20.7], [9, -20.8], [15, -20.6], [19, -17.4], [-13, -14.6], [8, -14.5]].forEach(p => tree(p[0], p[1], rnd(.95, 1.25)));
[[-18, -15], [-3, -15], [13, -19.2], [-8, -19]].forEach(p => palm(p[0], p[1], rnd(3, 3.6)));
parkPath.filter((p, i) => i % 12 === 5).forEach((p, i) => lamp(p.x + .7, p.z + .7, 1.7, i * 1.3));
/* rose arch on the path end */
{ const g = new T.Group(); [-.5, .5].forEach(k => bx(.07, 1.35, .07, mat.white, k, .68, 0, g)); const ar = add(new T.TorusGeometry(.5, .035, 8, 20, Math.PI), mat.white, 0, 1.33, 0, g); const fl = []; for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI; fl.push({ p: [Math.cos(a) * .5 + rnd(-.06, .06), 1.33 + Math.sin(a) * .5, rnd(-.07, .07)], s: [1.4, 1.4, 1.4], c: pick([0xf06292, 0xff4d6d, 0xffd1dc]) }); } const f = inst(flowerG, M({ roughness: .5 }), fl, false); S.remove(f); g.add(f); g.position.set(18.7, 0, -15.5); g.rotation.y = .3; S.add(g); }

/* ---------------- (2) landscaped park right of the entrance, (3) civic amenity ---------------- */
tplane(13.8, 22.6, 34, -10, lawnT, 6, .035, { roughness: 1 });
tplane(13.8, 9.2, 34, 7.2, stripeT, 5, .036, { roughness: 1 });
{ const fx = 34, fz = -6;
  [[2.5, 3.1]].forEach(a => { const rg = new T.Mesh(new T.RingGeometry(a[0], a[1], 48), new T.MeshStandardMaterial({ map: mkPav(8, 8), roughness: .8, side: T.DoubleSide })); rg.rotation.x = -Math.PI / 2; rg.position.set(fx, .06, fz); rg.receiveShadow = true; S.add(rg); });
  const disc = new T.Mesh(new T.CircleGeometry(2.5, 40), M({ map: grassT, roughness: 1 })); disc.rotation.x = -Math.PI / 2; disc.position.set(fx, .05, fz); S.add(disc);
  add(new T.CylinderGeometry(1.35, 1.45, .45, 32), mat.stone, fx, .25, fz); const bw = add(new T.CylinderGeometry(1.15, 1.15, .06, 32), mat.water, fx, .5, fz, null, false);
  cy(.14, .2, .9, mat.stone, fx, .9, fz, null, 16); cy(.62, .3, .16, mat.stone, fx, 1.38, fz, null, 20); const bw2 = add(new T.CylinderGeometry(.55, .55, .04, 20), mat.water, fx, 1.47, fz, null, false); cy(.07, .12, .5, mat.stone, fx, 1.7, fz, null, 12);
  const jet = add(new T.CylinderGeometry(.015, .08, 1, 10), new T.MeshStandardMaterial({ color: 0xcdf4ff, transparent: true, opacity: .55, emissive: 0x6ac8e8, emissiveIntensity: .3 }), fx, 2.2, fz, null, false); API.fountain = jet;
  ribbon(curve2([[26.9, -1.4], [30, -1.6], [31.6, -4], [31.6, -8], [31, -12], [30.8, -15.4]]), .8, M({ map: mkPav(1, 1), roughness: .8 }), .06);
  ribbon(curve2([[31.6, -4.6], [34, -2.2], [37.5, -3.2], [38.8, -6.5], [38.2, -10.5]]), .8, M({ map: mkPav(1, 1), roughness: .8 }), .06);
  /* gazebo */
  const gz = new T.Group(); gz.position.set(33.5, 0, -16.5); S.add(gz); cy(1.5, 1.6, .1, mat.stone, 0, .06, 0, gz, 8); [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const a = i * Math.PI / 4 + Math.PI / 8; cy(.04, .04, 1.5, mat.white, Math.cos(a) * 1.25, .85, Math.sin(a) * 1.25, gz, 8); }); cy(.1, 1.7, .6, M({ color: 0x3d2b20, roughness: .6 }), 0, 1.85, 0, gz, 8); cy(.01, .1, .25, mat.pole, 0, 2.28, 0, gz, 6); bench(0, 0, 0);
  /* playground: swings, slide, spring riders on rubber mat */
  const pm = new T.Mesh(new T.CircleGeometry(2.6, 36), M({ color: 0x3f6fb8, roughness: .9 })); pm.rotation.x = -Math.PI / 2; pm.position.set(37.2, .055, -11.6); pm.receiveShadow = true; S.add(pm);
  const pm2 = new T.Mesh(new T.RingGeometry(1.6, 2.6, 36), M({ color: 0xe0642c, roughness: .9 })); pm2.rotation.x = -Math.PI / 2; pm2.position.set(37.2, .058, -11.6); S.add(pm2);
  const sw = new T.Group(); sw.position.set(36.2, 0, -12.6); S.add(sw); [-.8, .8].forEach(k => { const l = bx(.06, 1.25, .06, mat.wood, k, .62, 0, sw); l.rotation.z = k * -.22; }); bx(1.8, .06, .06, mat.wood, 0, 1.24, 0, sw);
  [-.4, .4].forEach(k => { bx(.01, .95, .01, mat.pole, k, .75, 0, sw, false); bx(.3, .03, .12, M({ color: 0x2aa4a0 }), k, .27, 0, sw); });
  const sl = new T.Group(); sl.position.set(38.4, 0, -10.2); S.add(sl); bx(.9, .05, .9, mat.wood, 0, .85, 0, sl); [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]].forEach(a => bx(.05, .85, .05, mat.wood, a[0], .42, a[1], sl)); const ro = add(new T.ConeGeometry(.65, .38, 4), M({ color: 0xe9482c, roughness: .6 }), 0, 1.4, 0, sl); ro.rotation.y = Math.PI / 4; [[-.4, -.4], [.4, .4]].forEach(a => bx(.04, .55, .04, mat.wood, a[0], 1.12, a[1], sl));
  const slide = bx(.45, .04, 1.5, M({ color: 0xffc233, roughness: .4 }), 0, .45, 1.1, sl); slide.rotation.x = .55;
  [[35.5, -9.3, 0xe94a2d], [36.7, -9, 0xffc233]].forEach(a => { const s = bx(.18, .2, .38, M({ color: a[2], roughness: .5 }), a[0], .3, a[1]); cy(.01, .01, .25, mat.pole, a[0], .12, a[1], null, 6); });
  bench(31.5, -8.4, Math.PI / 2); bench(37.5, -5.2, -Math.PI / 2); bench(34, -2.2, 0);
  bed([[29.5, -19], [31, -19.6], [37, -19.5], [39, -17.5], [39.6, -14], [28.5, -12.6], [29, -8], [29.2, -3], [38, -2]], .5);
  [[28.5, -20.3], [37.8, -20.2], [40, -18], [28.6, -15], [40.1, -4], [29, -4.5]].forEach(p => tree(p[0], p[1], rnd(1, 1.3)));
  [[31.5, -2], [36, -2.6], [29.8, -9.8], [39.2, -8]].forEach((p, i) => lamp(p[0], p[1], 1.7, i));
  hedgeLine(27.3, -21.2, 40.8, -21.2, .5);
  /* civic amenity area sign + planting */
  const sc = cv(512, 128), sx2 = sc.getContext('2d'); sx2.fillStyle = '#2a140c'; sx2.fillRect(0, 0, 512, 128); sx2.strokeStyle = '#d8ab5a'; sx2.lineWidth = 6; sx2.strokeRect(8, 8, 496, 112); sx2.fillStyle = '#f7e9d0'; sx2.font = '600 46px Georgia'; sx2.textAlign = 'center'; sx2.textBaseline = 'middle'; sx2.fillText('CIVIC AMENITY AREA', 256, 66);
  const sgn = new T.Mesh(new T.PlaneGeometry(3, .75), new T.MeshBasicMaterial({ map: tex(sc) })); sgn.position.set(34, 1.3, 3.3); S.add(sgn); [-1.2, 1.2].forEach(k => bx(.08, 1.2, .08, mat.pole, 34 + k, .6, 3.2));
  hedgeLine(27.4, 2.4, 40.6, 2.4, .35); hedgeLine(27.4, 11.8, 40.6, 11.8, .45);
  [[28.4, 10.6], [40, 10.6], [40, 5], [28.4, 5]].forEach(p => tree(p[0], p[1], rnd(1, 1.25)));
}

/* ---------------- (1) entrance arch ---------------- */
const arch = new T.Group(); arch.position.set(24, 0, -14.8); S.add(arch);
{ const wm = new T.Mesh(new T.PlaneGeometry(2.6, .66), new T.MeshBasicMaterial({ transparent: true, fog: false })); const plate = bx(3.2, .95, .22, mat.dark, 0, 5.15, 0, arch);
  new T.TextureLoader().load('assets/img/wordmark.png', t => { t.encoding = T.sRGBEncoding; t.anisotropy = MAXA; wm.material.map = t; wm.material.needsUpdate = true; });
  wm.position.set(0, 5.15, .13); arch.add(wm); const wm2 = wm.clone(); wm2.position.z = -.13; wm2.rotation.y = Math.PI; arch.add(wm2);
  [-3.2, 3.2].forEach(k => { bx(1.05, 3.9, 1.05, mat.stone, k, 1.95, 0, arch); bx(1.25, .2, 1.25, mat.white, k, 3.95, 0, arch); bx(1.15, .35, 1.15, mat.stone, k, .18, 0, arch); const lb = bx(.45, .5, .45, bulbMat, k, 4.35, 0, arch, false); lampBulbs.push(lb); add(new T.ConeGeometry(.4, .25, 4), mat.pole, k, 4.72, 0, arch).rotation.y = Math.PI / 4; const nb = bx(.12, 2.3, .06, bulbMat, k, 2.1, 0.54 * (k < 0 ? 1 : 1), arch, false); lampBulbs.push(nb); });
  bx(8.1, .55, .9, mat.stone, 0, 4.2, 0, arch); const ar = add(new T.TorusGeometry(2.7, .2, 10, 36, Math.PI), mat.stone, 0, 3.95, 0, arch); ar.scale.set(1, .38, 1.4);
  /* wall wings with lit niches */
  [-1, 1].forEach(k => { for (let i = 0; i < 3; i++) { const x = k * (4.6 + i * 1.9); bx(.5, 1.5, .5, mat.stone, x, .85, 0, arch); const nb = bx(.1, .75, .05, bulbMat, x, .95, .27, arch, false); lampBulbs.push(nb); bx(1.4, 1.1, .3, mat.stone, x - k * .95, .6, 0, arch); } });
}
lamp(21.6, -14, 1.9, Math.PI); lamp(26.4, -14, 1.9, 0); lamp(21.6, -19, 1.9, Math.PI); lamp(26.4, -19, 1.9, 0);
/* open gate leaf: vertical bars */
{ const g = new T.Group(); bx(2.2, .06, .08, mat.pole, 0, 2.2, 0, g); bx(2.2, .06, .08, mat.pole, 0, .3, 0, g); for (let i = 0; i < 18; i++) bx(.04, 1.95, .05, mat.pole, -1.05 + i * .123, 1.25, 0, g, false); g.position.set(22.4, 0, -16.2); g.rotation.y = Math.PI / 2; S.add(g); }

/* ---------------- boundary wall with lit niches (west, south, east) ---------------- */
const wallG = new T.BoxGeometry(1, 1, 1), pilG = new T.BoxGeometry(.5, 1.6, .5), nicheG = new T.BoxGeometry(.12, .75, .06);
function wall(x0, z0, x1, z1) { const rot = 0, l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / l, uz = (z1 - z0) / l, w = sh(new T.Mesh(wallG, mat.stone)); w.scale.set(l, 1.2, .3); w.position.set((x0 + x1) / 2, .6, (z0 + z1) / 2); w.rotation.y = Math.atan2(-uz, ux); S.add(w);
  const n = Math.floor(l / 4.2), pil = [], nic = []; for (let i = 0; i <= n; i++) { const px = x0 + ux * l * i / n, pz = z0 + uz * l * i / n; pil.push({ p: [px, .8, pz], r: 0 }); if (i < n) { const mx = px + ux * l / n / 2, mz = pz + uz * l / n / 2; nic.push({ p: [mx - uz * .17, .75, mz + ux * .17], r: w.rotation.y }); nic.push({ p: [mx + uz * .17, .75, mz - ux * .17], r: w.rotation.y }); } }
  inst(pilG, mat.stone, pil, true); const nm = M({ color: 0xfff0d0, emissive: 0xffa94a, emissiveIntensity: .6 }); lampBulbs.push({ material: nm }); inst(nicheG, nm, nic, false); }
wall(-21.6, -21.8, -21.6, 12.8); wall(-21.6, 12.8, 41.4, 12.8); wall(41.4, -21.8, 41.4, 12.8);
wall(-21.6, -21.8, 21.2, -21.8); wall(27.1, -21.8, 41.4, -21.8);
hedgeLine(-21, 12.2, 41, 12.2, .55); hedgeLine(-21.1, -21.2, -21.1, 12.2, .55); hedgeLine(40.9, -21.2, 40.9, 12.2, .55);
for (let x = -19; x <= 40; x += 6) palm(x + rnd(-.5, .5), 13.8, rnd(3.4, 4.2)); for (let z = -19; z <= 10; z += 6) palm(-23, z, rnd(3.4, 4.2));

/* ---------------- surroundings: fields, far trees, hills ---------------- */
{ const it = [], tr = []; for (let i = 0; i < 360; i++) { const a = rnd(0, 6.28), r = rnd(46, 230), x = 10 + Math.cos(a) * r * 1.2, z = -5 + Math.sin(a) * r; if (Math.abs(z + 24.5) < 5 && x > -60) continue; if (x > -26 && x < 46 && z > -29 && z < 17) continue; const s = rnd(1.6, 3.4); tr.push({ p: [x, .8 * s, z], s: [.12 * s, 1.6 * s, .12 * s], c: 0x6b4f37 }); it.push({ p: [x, 2.3 * s, z], s: [s, s * .9, s], c: pick([0x3f7a33, 0x4f8a3a, 0x356b2e, 0x5a8f3c, 0x6a9a45]) }); }
  inst(trunkG, mat.bark, tr, false); inst(crowns[0], mat.leaf, it, true); }
for (let i = 0; i < 9; i++) { const a = i * .7 + .2, h = new T.Mesh(new T.SphereGeometry(1, 16, 8), M({ color: 0x4a6a46, roughness: 1 })); h.scale.set(rnd(120, 220), rnd(14, 30), rnd(60, 110)); h.position.set(Math.cos(a) * 520, -2, Math.sin(a) * 520); h.rotation.y = -a; S.add(h); }
/* far approach-road lamps */
for (let x = -60; x <= 100; x += 14) if (Math.abs(x - 24) > 6) lamp(x, -21.7, 2.2, Math.PI);

/* ---------------- day / night ---------------- */
const dT = new T.Color(0x3a5a9a), dH = new T.Color(0xffc690), nT = new T.Color(0x070b1f), nH = new T.Color(0x3b1d2e), hd = new T.Color(0xffe4c4), hn = new T.Color(0x5f6fb0), gd = new T.Color(0x45603a), gn = new T.Color(0x151c2a), sd = new T.Color(0xffd4a2), sn = new T.Color(0x8fa6ff);
function night(n) {
  const u = sky.material.uniforms; u.top.value.copy(dT).lerp(nT, n); u.hor.value.copy(dH).lerp(nH, n); S.fog.color.copy(u.hor.value);
  sun.intensity = 2.0 * (1 - n) + .35 * n; sun.color.copy(sd).lerp(sn, n); hemi.intensity = .75 - .38 * n; hemi.color.copy(hd).lerp(hn, n); hemi.groundColor.copy(gd).lerp(gn, n);
  stars.material.opacity = n; R.toneMappingExposure = 1.05 + .1 * n; clouds.forEach(c => c.material.opacity = .8 - .55 * n);
  lit.forEach(m => m.emissiveIntensity = m.userData.b + m.userData.g * n); lampBulbs.forEach(l => l.material.emissiveIntensity = .5 + 3 * n);
  glows.forEach(g => g.material.opacity = .1 + .9 * n); poolMat.opacity = .85 * n; mat.water.emissiveIntensity = .25 + .9 * n; ptl.forEach(l => l.intensity = 2.2 * n);
}

/* ---------------- optional external GLB models (assets/models/villa.glb, commercial.glb) ---------------- */
function tryModels() {
  const probe = f => fetch('assets/models/' + f, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
  Promise.all([probe('villa.glb'), probe('commercial.glb')]).then(ok => { if (!ok[0] && !ok[1]) return;
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    s.onload = () => { const L = new T.GLTFLoader(); [['villa.glb', ok[0], [1, 2, 3, 4, 5, 6, 7, 8], 4.2], ['commercial.glb', ok[1], [9, 10, 11, 12], 9.2]].forEach(a => { if (!a[1]) return;
      L.load('assets/models/' + a[0], gl => { a[2].forEach(n => { const p = P[n], m = gl.scene.clone(true), b = new T.Box3().setFromObject(m), sz = b.getSize(new T.Vector3()), k = a[3] / Math.max(sz.x, sz.z);
        m.scale.setScalar(k); m.position.set(p.cx - (b.min.x + sz.x / 2) * k, -b.min.y * k, p.cz - (b.min.z + sz.z / 2) * k); m.rotation.y = p.n ? 0 : Math.PI; m.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); if (p.bld) S.remove(p.bld); S.add(m); }); }, undefined, e => console.warn('GLB failed', e)); }); };
    document.head.appendChild(s); });
}

/* ---------------- camera: scroll path + explore mode ---------------- */
const K = [[[30, 4.4, -52], [24, 4, -14]], [[24.5, 2.4, -6], [-12, 2.6, 0]], [[15, 3.2, -1.2], [2, 2.2, 7.5]], [[-8, 9, 15], [2, 1, -4]], [[10, 62, 12], [10, 0, -4]], [[70, 40, 50], [10, 0, -2]], [[2, 9, -36], [0, 1, -16]], [[19, 3.2, 3.6], [-6, 3, -6]], [[24, 5, -42], [24, 4, -14]], [[62, 22, -30], [26, 0, -4]]],
  N = [0, .02, .12, .3, .4, .3, .5, 1, .7, .55], V = a => new T.Vector3(...a);
const secs = $$('main>section'); let sel = 0, mx = 0, my = 0, last = -1, nn = 0; const pos = V(K[0][0]), tg = V(K[0][1]);
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
function tgt() {
  const y = scrollY + innerHeight * .45; let i = 0; secs.forEach((s, k) => { if (s.offsetTop <= y) i = k; });
  const a = secs[i].offsetTop, b = i < secs.length - 1 ? secs[i + 1].offsetTop : a + secs[i].offsetHeight, t = ez(cl((y - a) / (b - a))), j = Math.min(i + 1, K.length - 1), ki = Math.min(i, K.length - 1);
  let p = V(K[ki][0]).lerp(V(K[j][0]), t), l = V(K[ki][1]).lerp(V(K[j][1]), t); const n = N[ki] + (N[j] - N[ki]) * t;
  if (sel && secs[i].id === 'masterplan') { const q = P[sel]; p = V([q.cx + 2, q.n ? 10.5 : 8.5, q.cz + (q.n ? 11.5 : -10.5)]); l = V([q.cx, 1.4, q.cz]); }
  return { p, l, n, i };
}
function size() { R.setSize(innerWidth, innerHeight, false); C.aspect = innerWidth / innerHeight; C.fov = innerWidth < 720 ? 66 : 48; C.updateProjectionMatrix(); } addEventListener('resize', size); size();

const X = { t: 0, on: false, yaw: Math.PI, pitch: -.05, pos: V([24, .62, -20]), keys: {}, joy: { x: 0, y: 0 }, nt: 0, drag: null, spd: 2.4 };
const fwd = () => V([-Math.sin(X.yaw), 0, -Math.cos(X.yaw)]), qd = new T.Quaternion(), eu = new T.Euler(0, 0, 0, 'YXZ');
addEventListener('keydown', e => { if (X.on) { X.keys[e.key.toLowerCase()] = 1; if (/^(arrow|\s)/i.test(e.key) || e.key === ' ') e.preventDefault(); } });
addEventListener('keyup', e => { X.keys[e.key.toLowerCase()] = 0; });
const cvs = R.domElement;
cvs.addEventListener('pointerdown', e => { if (X.on) { X.drag = { x: e.clientX, y: e.clientY }; cvs.setPointerCapture(e.pointerId); } });
cvs.addEventListener('pointermove', e => { if (X.on && X.drag) { X.yaw -= (e.clientX - X.drag.x) * .0035; X.pitch = cl(X.pitch - (e.clientY - X.drag.y) * .0035, -1.3, 1.3); X.drag.x = e.clientX; X.drag.y = e.clientY; } });
['pointerup', 'pointercancel'].forEach(t => cvs.addEventListener(t, () => X.drag = null));
cvs.addEventListener('wheel', e => { if (X.on) { e.preventDefault(); X.pos.addScaledVector(V([-Math.sin(X.yaw) * Math.cos(X.pitch), Math.sin(X.pitch), -Math.cos(X.yaw) * Math.cos(X.pitch)]), -e.deltaY * .012); } }, { passive: false });
(function joy() { const j = document.getElementById('joy'); if (!j) return; const k = j.firstElementChild; let id = null;
  const mv = e => { const r = j.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.min(1, Math.hypot(dx, dy) / 48), a = Math.atan2(dy, dx); X.joy.x = Math.cos(a) * m; X.joy.y = Math.sin(a) * m; k.style.transform = `translate(${X.joy.x * 38}px,${X.joy.y * 38}px)`; };
  j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); mv(e); e.stopPropagation(); }); j.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
  const up = () => { id = null; X.joy.x = X.joy.y = 0; k.style.transform = ''; }; j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up); })();
let savedY = 0;
API.explore = on => {
  if (on === X.on) return; X.on = on; document.body.classList.toggle('xp', on);
  if (on) { X.t = 0; savedY = scrollY; X.pos.set(24, .62, -19.5); X.yaw = Math.PI; X.pitch = -.04; X.nt = 0; const nb = document.getElementById('xnight'); if (nb) nb.textContent = 'Evening'; const h = document.getElementById('xhint'); if (h) { h.style.opacity = 1; setTimeout(() => h.style.opacity = 0, 9000); } }
  else { X.keys = {}; X.joy.x = X.joy.y = 0; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, savedY); document.documentElement.style.scrollBehavior = ''; }
};
API.night = () => { X.nt = X.nt ? 0 : .88; return X.nt ? 'Daytime' : 'Evening'; };
API.pick = n => { sel = n; if (!n) { hl.visible = false; return; } const p = P[n]; hl.visible = true; hl.scale.set(p.x1 - p.x0, 1, p.z1 - p.z0); hl.position.set(p.cx, .12, p.cz); };
API.status = (n, st) => { if (P[n]) P[n].status = st; };

let clock = performance.now(), first = true, tw = 0;
function loop(t) {
  requestAnimationFrame(loop); const dt = Math.min(.05, (t - clock) / 1000); clock = t; tw += dt;
  if (X.on) {
    const k = X.keys, f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) - X.joy.y, r = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + X.joy.x, v = X.spd * (k.shift ? 2.6 : 1) * dt, fw = fwd();
    X.pos.addScaledVector(fw, f * v); X.pos.x += Math.cos(X.yaw) * r * v; X.pos.z -= Math.sin(X.yaw) * r * v; X.pos.y = cl(X.pos.y + ((k.e || k[' '] ? 1 : 0) - (k.q ? 1 : 0)) * v, .3, 60);
    X.pos.x = cl(X.pos.x, -45, 80); X.pos.z = cl(X.pos.z, -60, 45);
    X.t += dt; const rt = X.t < 1.6 ? 2.2 : 12, sk = 1 - Math.exp(-rt * dt); pos.lerp(X.pos, sk); eu.set(X.pitch, X.yaw, 0); qd.setFromEuler(eu); C.position.copy(pos); C.quaternion.slerp(qd, sk); tg.copy(pos).addScaledVector(V([-Math.sin(X.yaw), 0, -Math.cos(X.yaw)]), 8);
    nn += (X.nt - nn) * (1 - Math.pow(.05, dt));
  } else {
    const g = tgt(), s = RM ? 1 : 1 - Math.pow(.05, dt * 3), p = g.p; if (last >= 0 && g.i !== last && API.whoosh) API.whoosh(); last = g.i;
    p.x += mx * (RM ? 0 : 2.5); p.y -= my * (RM ? 0 : 1.2); pos.lerp(p, s); tg.lerp(g.l, s); nn += (g.n - nn) * (RM ? 1 : 1 - Math.pow(.2, dt)); C.position.copy(pos); C.lookAt(tg);
  }
  night(nn);
  if (hl.visible) hl.material.opacity = .3 + .12 * Math.sin(t * .005);
  mat.water.map.offset.set(tw * .02, tw * .015); if (API.fountain) API.fountain.scale.y = .9 + .12 * Math.sin(tw * 3); clouds.forEach((c, i) => { c.position.x += Math.sin(i) * dt * .6; });
  const bar = document.getElementById('bar'); if (bar) bar.style.width = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100 + '%';
  R.render(S, C);
  if (first) { first = false; API.ok = true; API._res && API._res(true); }
}
API.ready = new Promise(res => { API._res = res; });
S.updateMatrixWorld(true); S.traverse(o => { if (o !== hl && o !== API.fountain && !clouds.includes(o)) o.matrixAutoUpdate = false; });
requestAnimationFrame(loop); tryModels();
})();
