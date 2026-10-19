// Cabeça de robô (bola com tela): casco branco com faixas laranja, painéis e respiros, tela escura curva com rosto
// em luz emissiva (desenhado em canvas), "orelhas" com anel de luz, aletas no topo e luz de coração.
// Mesmo contrato de buildHead: { group, dispose, params }.
import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const col = h => new THREE.Color(h);
const unitNormals = g => { const n = g.attributes.normal.array; for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]); if (l > 1e-8) { n[i] /= l; n[i + 1] /= l; n[i + 2] /= l } else { n[i] = 0; n[i + 1] = 0; n[i + 2] = 1 } } return g };

function faceTexture(P) {
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), glow = P.glow || '#5fe3ff', blushC = P.blushColor || '#ff8a55';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const stroke = (fn, w, color, blur) => { c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.shadowColor = color; c.shadowBlur = blur; c.beginPath(); fn(); c.stroke(); c.restore() };
  const ex = W * .27, ey = H * .47, r = H * .17, expr = P.expression || 'happy';
  for (const sx of [-1, 1]) {
    const x = W / 2 + sx * ex;
    if (expr === 'happy') stroke(() => c.arc(x, ey + r * .45, r, Math.PI * 1.12, Math.PI * 1.88), H * .07, glow, 30);
    else if (expr === 'angry') stroke(() => { c.moveTo(x - r, ey - r * .1 - sx * r * .35); c.lineTo(x + r, ey - r * .1 + sx * r * .35) }, H * .07, glow, 30);
    else { c.save(); c.fillStyle = glow; c.shadowColor = glow; c.shadowBlur = 30; c.beginPath(); c.ellipse(x, ey, r * .55, r * .8, 0, 0, Math.PI * 2); c.fill(); c.restore() }
    for (let k = 0; k < 3; k++) stroke(() => { const bx = x + sx * r * .1 + (k - 1) * r * .28, by = ey + r * 1.15; c.moveTo(bx - r * .06, by - r * .12); c.lineTo(bx + r * .06, by + r * .12) }, H * .02, blushC, 14);
  }
  stroke(() => c.arc(W / 2, H * .6, H * .09, Math.PI * .15, Math.PI * .85), H * .045, glow, 24);
  // linhas de varredura bem sutis
  c.globalAlpha = .08; c.fillStyle = '#fff'; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 1); c.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function buildRobot(P, opts = {}) {
  const Q = opts.quality || 1, root = new THREE.Group(), disposables = [], track = o => (disposables.push(o), o);
  root.name = 'Head_V2_' + P.id;
  const R = 1, shellC = col(P.shell || '#ece6da'), accent = col(P.accent || '#f08a24'), dark = col('#2b2a2a');
  const add = (geo, m, name, parent = root) => { if (geo.attributes.normal) unitNormals(geo); const o = new THREE.Mesh(track(geo), m); o.name = name; parent.add(o); return o };
  // tela: janela em coordenadas angulares (longitude u, latitude v), super-elipse
  const SW = P.screenW || .78, SH = P.screenH || .5, SY = P.screenY || .12, inScreen = (u, v, pad = 0) => Math.pow(Math.abs(u) / (SW + pad), 4) + Math.pow(Math.abs(v - SY) / (SH + pad), 4) < 1;

  { // casco: esfera com faixa laranja, recesso da tela, vincos de painel, sujeira
    const g = new THREE.SphereGeometry(R, Math.round(160 * Q), Math.round(120 * Q)), p = g.attributes.position, cl = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), u = Math.atan2(x, z), v = Math.asin(clamp(y, -1, 1));
      let r = R;
      const sd = Math.pow(Math.abs(u) / (SW + .07), 4) + Math.pow(Math.abs(v - SY) / (SH + .07), 4);
      r -= .035 * sstep(1.15, .95, sd); // recesso da tela
      const seamA = Math.abs(v - (SY - SH - .13)), seamB = Math.abs(Math.abs(u) - 1.55);
      r -= .012 * sstep(.02, .005, seamA) + .01 * sstep(.02, .005, seamB) * sstep(.9, .5, Math.abs(v));
      p.setXYZ(i, x * r, y * r, z * r);
      c.copy(shellC);
      const band = sstep(.06, .03, Math.abs(v - (SY - SH - .22))) * sstep(1.3, 1.0, Math.abs(u));
      const side = sstep(.03, 0, Math.abs(Math.abs(u) - 1.35) - .08) * sstep(.95, .7, Math.abs(v)) * (1 - sstep(-.6, -.75, v));
      c.lerp(accent, Math.max(band, side, .9 * sstep(.95, 1.1, sd) * sstep(1.25, 1.12, sd)));
      if (v < -.55) c.lerp(dark, sstep(-.55, -.75, v) * .85); // base / rodas
      const n = Math.sin(x * 23.1 + y * 17.3) * Math.sin(y * 29.7 - z * 13.1) * Math.sin(z * 19.3 + x * 11.7);
      c.multiplyScalar(1 - .12 * sstep(.4, .9, n) - .06 * sstep(-.2, -.7, y));
      cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b;
    }
    g.computeVertexNormals(); unitNormals(g); g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.deleteAttribute('uv');
    add(g, track(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .45, clearcoat: .4, clearcoatRoughness: .35, name: 'Shell' })), 'Head_Shell');
  }
  { // tela curva com rosto emissivo
    const NR = 24, NA = 96, pos = [], uv = [], idx = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) {
      const r = i / NR, a = j / NA * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const k = Math.pow(Math.pow(Math.abs(ca), 4) + Math.pow(Math.abs(sa), 4), -.25); // super-elipse
      const u = ca * k * r * SW, v = SY + sa * k * r * SH, rr = R - .012 + .02 * (1 - r * r);
      pos.push(Math.sin(u) * Math.cos(v) * rr, Math.sin(v) * rr, Math.cos(u) * Math.cos(v) * rr); uv.push(.5 + u / SW * .5, .5 + (v - SY) / SH * .5);
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); unitNormals(g);
    const tex = track(faceTexture(P));
    add(g, track(new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.5, name: 'Screen' })), 'Screen');
  }
  // "orelhas": discos laterais com anel de luz
  const glowMat = track(new THREE.MeshBasicMaterial({ color: col(P.glow || '#5fe3ff'), name: 'Glow' }));
  const discMat = track(new THREE.MeshPhysicalMaterial({ color: accent, roughness: .4, clearcoat: .4, name: 'Accent' }));
  const darkMat = track(new THREE.MeshPhysicalMaterial({ color: 0x1c1d20, roughness: .3, clearcoat: .6, name: 'Dark' }));
  for (const s of [-1, 1]) {
    const grp = new THREE.Group(); grp.name = 'Ear_' + (s < 0 ? 'L' : 'R'); grp.position.set(s * .93, .05, -.05); grp.rotation.set(0, s * Math.PI / 2, 0); root.add(grp);
    add(new THREE.CylinderGeometry(.32, .36, .14, 48).rotateX(Math.PI / 2), discMat, 'Ear_Disc', grp).position.z = .02;
    add(new THREE.CylinderGeometry(.24, .24, .02, 48).rotateX(Math.PI / 2), darkMat, 'Ear_Lens', grp).position.z = .095;
    add(new THREE.TorusGeometry(.2, .018, 12, 64), glowMat, 'Ear_Ring', grp).position.z = .1;
    // aleta no topo
    const fin = add(new THREE.BoxGeometry(.2, .32, .07, 4, 4, 2), discMat, 'Fin_' + (s < 0 ? 'L' : 'R'));
    fin.position.set(s * .55, .93, -.1); fin.rotation.set(-.15, 0, s * -.5);
  }
  { // luz de coração e respiros
    const heart = new THREE.Shape(); heart.moveTo(0, -.05); heart.bezierCurveTo(-.09, .02, -.05, .09, 0, .045); heart.bezierCurveTo(.05, .09, .09, .02, 0, -.05);
    const v = SY - SH - .23, ring = add(new THREE.TorusGeometry(.1, .018, 12, 48), track(new THREE.MeshBasicMaterial({ color: col(P.blushColor || '#ffb347'), name: 'HeartGlow' })), 'Heart_Ring');
    ring.position.set(0, Math.sin(v) * 1.01, Math.cos(v) * 1.01); ring.lookAt(0, Math.sin(v) * 3, Math.cos(v) * 3);
    const h = add(new THREE.ShapeGeometry(heart, 12), ring.material, 'Heart'); h.position.copy(ring.position).multiplyScalar(1.004); h.lookAt(0, Math.sin(v) * 3, Math.cos(v) * 3);
    for (const s of [-1, 1]) { const vent = add(new THREE.BoxGeometry(.16, .05, .03), darkMat, 'Vent'); vent.position.set(s * .38, Math.sin(v + .03) * .985, Math.cos(v + .03) * .9); vent.lookAt(s * .38 * 3, Math.sin(v) * 3, Math.cos(v) * 3) }
  }
  root.position.y = -.2;
  root.traverse(o => { if (o.isMesh) { o.castShadow = !(o.material.isMeshBasicMaterial); o.receiveShadow = true } });
  root.userData.params = P; root.userData.timings = { total: 0 };
  const dispose = () => { root.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose() }); disposables.forEach(d => d.dispose && d.dispose()) };
  return { group: root, dispose, params: P };
}
