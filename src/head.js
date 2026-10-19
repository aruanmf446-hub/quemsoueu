// Head V2 — cabeça cartoon 3D procedural.
// Uma única malha contínua (crânio + mandíbula + nariz + lábios + bochechas + pálpebras) esculpida por perfis e campos
// de deslocamento. A pele envolve o globo ocular (pálpebras fazem parte da malha) e a abertura do olho é recortada na
// própria malha. Olhos, sobrancelhas, orelhas e pescoço são peças separadas. Sem assets externos.
import * as THREE from 'three';
import { resolve } from './presets.js';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const gau = (d, r) => Math.exp(-(d * d) / (r * r));
const sgnPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25 };
const col = h => new THREE.Color(h);

// ---------- perfil do crânio ----------
// Parte de cima: cúpula elíptica. Parte de baixo (abaixo da bochecha): uma super-elipse contínua;
// jawQ < 2 → queixo mais suave/pontudo, jawQ > 2 → mandíbula mais quadrada. Sem curvas em S.
function makeProfile(P) {
  const yb = P.bottom, yt = P.top, yT = P.templeY, yE = -.12;
  // transições smoothstep entre bochecha e têmpora: inclinação 0 nas duas pontas (junta limpo com a super-elipse e com a cúpula), sem ondulação
  const mix = (a, b, y) => a + (b - a) * sstep(yE, yT, y);
  const Aup = y => mix(P.cheekW, P.w, y), Dfu = y => mix(.75, .67, y), Dbu = y => mix(.68, .765, y);
  const out = { a: 0, df: 0, db: 0, n: 2 }, tmp = { a: 0, df: 0, db: 0, n: 2 };
  function raw(y, out) {
    if (y > yT) {
      const k = Math.sqrt(Math.max(0, 1 - Math.pow((y - yT) / (yt - yT), 2)));
      out.a = Aup(yT) * k; out.df = Dfu(yT) * k; out.db = Dbu(yT) * k; out.n = 2;
    } else if (y >= yE) {
      out.a = Aup(y); out.df = Dfu(y); out.db = Dbu(y); out.n = 2;
    } else {
      const s = clamp((yE - y) / (yE - yb), 0, 1), q = P.jawQ, kk = Math.pow(Math.max(0, 1 - Math.pow(s, q)), 1 / q);
      out.a = P.cheekW * kk; out.df = .75 * Math.pow(kk, .55); out.db = .68 * Math.pow(kk, .9);
      out.n = 2 + (P.jawN - 2) * sstep(0, .4, s);
    }
  }
  const TAPS = [[-2, 1], [-1, 2], [0, 3], [1, 2], [2, 1]];
  function dims(y) { // perfil bruto + média curta só nas junções (curvatura contínua → sem linha de sombreamento)
    raw(y, out);
    const wJ = Math.max(Math.exp(-Math.pow((y - yE) / .09, 2)), Math.exp(-Math.pow((y - yT) / .09, 2)));
    if (wJ > .02) {
      let a = 0, df = 0, db = 0, n = 0, ws = 0;
      for (const [k, w] of TAPS) { raw(y + k * .025, tmp); a += tmp.a * w; df += tmp.df * w; db += tmp.db * w; n += tmp.n * w; ws += w }
      out.a += (a / ws - out.a) * wJ; out.df += (df / ws - out.df) * wJ; out.db += (db / ws - out.db) * wJ; out.n += (n / ws - out.n) * wJ;
    }
    return out;
  }
  return { dims, yb, yt };
}

// ---------- campo de relevo + tintas do rosto ----------
function makeFaceField(P) {
  const eyeX = P.eyeX, eyeY = P.eyeY, tipY = P.noseTipY, mY = P.mouthY, mw = P.mouthW;
  const out = { dz: 0, lip: 0, line: 0, blush: 0, ao: 0, nostril: 0, sock: 0 };
  return function field(x, y) {
    const ax = Math.abs(x);
    let dz = 0;
    dz += P.browRidge * gau(ax - .30, .34) * gau(y - (eyeY + .22), .09);              // arcada
    const sock = gau(ax - eyeX, .27) * gau(y - eyeY, .2);
    dz -= P.socket * sock;                                                            // órbita
    dz -= .02 * gau(x, .09) * gau(y - eyeY, .12);                                     // raiz do nariz
    dz += P.cheekH * gau(ax - .44, .25) * gau(y + .2, .21);                           // bochechas
    // nariz: ponte → ponta → asas
    const q = clamp((eyeY + .03 - y) / (eyeY + .03 - tipY), 0, 1.8);
    const bridgeFade = q <= 1 ? 1 : Math.exp(-Math.pow((q - 1) / .2, 2));
    dz += P.noseH * Math.pow(Math.min(q, 1), 1.4) * gau(x, (.05 + .045 * q) * P.noseW) * bridgeFade;
    dz += P.tipH * gau(x, .11 * P.noseW) * gau(y - tipY, .08);
    dz += P.alaeH * gau(ax - .115 * P.noseW, .062) * gau(y - (tipY - .03), .058);
    dz -= .025 * gau(x, .17) * gau(y - (tipY - .12), .045);                            // recuo sob o nariz
    // dobra nasolabial: do nariz ao canto da boca (dá estrutura ao sorriso)
    const sx = mw * 1.08 - .16 * P.noseW, sy = (mY + P.smile * .07 * 1.2) - (tipY - .01);
    const tt = clamp(((ax - .16 * P.noseW) * sx + (y - (tipY - .01)) * sy) / (sx * sx + sy * sy), 0, 1);
    const dd = Math.hypot(ax - (.16 * P.noseW + sx * tt), y - (tipY - .01 + sy * tt)), nl = gau(dd, .04) * Math.pow(Math.sin(Math.PI * tt), .7);
    dz -= .016 * (.4 + .6 * P.smile) * nl;
    // focinho/boca
    dz += P.muzzle * gau(x, .36) * gau(y - (mY - .02), .22);
    const yl = y - (mY + P.smile * .07 * Math.pow(Math.min(ax / mw, 1.3), 2));
    const exU = Math.exp(-Math.pow(ax / (mw * .92), 4)), exL = Math.exp(-Math.pow(ax / (mw * .82), 4)), exG = Math.exp(-Math.pow(ax / (mw * 1.07), 4));
    const cupid = 1 - .3 * gau(x, .05);
    dz += P.lipH * exU * cupid * gau(yl - P.lipU * .45, P.lipU * .6);
    dz += P.lipH * 1.25 * exL * gau(yl + P.lipL * .5, P.lipL * .6);
    dz -= .034 * exG * gau(yl, .02);                                                  // linha da boca
    dz -= .02 * exL * gau(y - (mY - P.lipL - .04), .032);                             // sulco abaixo do lábio
    dz -= .012 * gau(x, .04) * gau(y - (mY + P.lipU + .055), .05);                    // filtro
    dz += P.chinH * gau(x, .27) * gau(y - (P.bottom + .24), .16);                     // queixo
    // tintas
    const ux = Math.exp(-Math.pow(ax / (mw * .94), 4)), lx = Math.exp(-Math.pow(ax / (mw * .82), 4));
    const lipU = ux * sstep(-.005, .004, yl) * (1 - sstep(P.lipU - .012, P.lipU + .004, yl));
    const lipL = lx * sstep(-.005, .004, -yl) * (1 - sstep(P.lipL - .014, P.lipL + .004, -yl));
    out.lip = Math.max(lipU, lipL * .95);
    out.line = exG * gau(yl, .011);
    out.blush = .5 * gau(ax - .46, .23) * gau(y + .16, .17) + .3 * gau(x, .11) * gau(y - tipY, .075) + .12 * gau(x, .22) * gau(y - (P.bottom + .24), .12);
    out.ao = .3 * sock + .16 * gau(x, .12) * gau(y - (tipY - .085), .04) + .5 * exL * gau(y - (mY - P.lipL - .045), .04) + .25 * nl;
    out.nostril = gau(ax - .068 * P.noseW, .024) * gau(y - (tipY - .06), .02);
    out.sock = sock;
    out.dz = dz; return out;
  };
}

function cornerFn(u, peak) { // 0 nos cantos, 1 no ponto mais aberto (pico deslocado p/ o canto interno)
  if (Math.abs(u) >= 1) return 0;
  const w = u < peak ? (u - peak) / (peak + 1) : (u - peak) / (1 - peak);
  return Math.pow(Math.cos(clamp(w, -1, 1) * Math.PI / 2), .85);
}
const PEAK_U = -.18, PEAK_L = .08;

// Quadro do olho: coordenadas locais (U = externo+, V = cima+) ⇄ espaço da cabeça.
function eyeFrame(P, s, zs0) {
  const th = s * P.tilt, c = Math.cos(th), sn = Math.sin(th), Re = P.Re;
  const e = { s, ex: s * P.eyeX, ey: P.eyeY, halfW: Re * Math.sin(P.openW) * 1.02, hu: Re * Math.sin(P.openU) * 1.1, hl: Re * Math.sin(-P.openL) * 1.1, Rl: Re * 1.1, zc: zs0 - P.sink };
  e.Rl2 = e.Rl * e.Rl;
  e.local = (x, y) => { const dx = x - e.ex, dy = y - e.ey; return [s * (dx * c + dy * sn), -dx * sn + dy * c] };
  e.toHead = (U, V) => { const lx = s * U; return [e.ex + lx * c - V * sn, e.ey + lx * sn + V * c] };
  e.H = (uN, up) => up ? e.hu * cornerFn(uN, PEAK_U) : e.hl * cornerFn(uN, PEAK_L);
  return e;
}

// ---------- utilidades de malha ----------
function ribbon(pts, rw, rh, nrm, seg = 10) {
  const n = pts.length, pos = [], idx = [], t = new THREE.Vector3(), w = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    t.copy(b).sub(a).normalize(); nn.copy(nrm(i, pts[i]));
    w.crossVectors(t, nn).normalize(); nn.crossVectors(w, t).normalize();
    for (let j = 0; j < seg; j++) {
      const al = j / seg * Math.PI * 2, c = Math.cos(al) * rw[i], s = Math.sin(al) * rh[i];
      pos.push(pts[i].x + w.x * c + nn.x * s, pts[i].y + w.y * c + nn.y * s, pts[i].z + w.z * c + nn.z * s);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return geo;
}

// SphereGeometry duplica vértices na emenda (ix=0 e ix=LON) e colapsa cada polo em uma linha inteira de vértices.
// Em vez de fundir a malha (caro), unifica as normais nesses pontos para não aparecer costura.
function weldSeamNormals(geo, LON, LAT) {
  const n = geo.attributes.normal, W = LON + 1, v = new THREE.Vector3(), u = new THREE.Vector3();
  for (let iy = 1; iy < LAT; iy++) {
    const a = iy * W, b = a + LON;
    v.set(n.getX(a), n.getY(a), n.getZ(a)); u.set(n.getX(b), n.getY(b), n.getZ(b)); v.add(u).normalize();
    n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
  }
  for (const iy of [0, LAT]) {
    v.set(0, 0, 0);
    for (let ix = 0; ix < W; ix++) v.x += n.getX(iy * W + ix), v.y += n.getY(iy * W + ix), v.z += n.getZ(iy * W + ix);
    v.normalize();
    for (let ix = 0; ix < W; ix++) n.setXYZ(iy * W + ix, v.x, v.y, v.z);
  }
}

function setColors(geo, fn) {
  const p = geo.attributes.position, cl = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i), i); cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b }
  geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
}

function irisTexture(cols) {
  const W = 512, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#060404'); g.addColorStop(.3, '#0a0605'); g.addColorStop(.335, cols[0]);
  g.addColorStop(.52, cols[1]); g.addColorStop(.86, cols[2]); g.addColorStop(1, '#1a0d06');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 520; i++) { // fibras radiais
    const x = rnd() * W, y0 = H * (.31 + rnd() * .1), y1 = H * (.6 + rnd() * .35);
    c.strokeStyle = rnd() > .5 ? 'rgba(255,225,160,' + (.05 + rnd() * .1) + ')' : 'rgba(40,18,6,' + (.08 + rnd() * .14) + ')';
    c.lineWidth = 1 + rnd() * 2; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + (rnd() - .5) * 3, y1); c.stroke();
  }
  const gl = c.createLinearGradient(0, H * .3, 0, H * .46); // anel claro ao redor da pupila
  gl.addColorStop(0, 'rgba(255,230,170,0)'); gl.addColorStop(.5, 'rgba(255,230,170,.28)'); gl.addColorStop(1, 'rgba(255,230,170,0)');
  c.fillStyle = gl; c.fillRect(0, H * .3, W, H * .16);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; return t;
}

// ---------- construção principal ----------
export function buildHead(presetId, adj, opts = {}) {
  const T0 = performance.now(), marks = {}, mark = l => { marks[l] = Math.round(performance.now() - T0) };
  const Q = opts.quality || 1; // 1 = completo; ~.5 = prévia leve enquanto o slider é arrastado
  const P = resolve(presetId, adj);
  const disposables = [], root = new THREE.Group();
  root.name = 'Head_V2_' + presetId;
  const track = o => (disposables.push(o), o);
  const profile = makeProfile(P), field = makeFaceField(P);
  const skin = col(P.skin), blush = col(P.blush), lipC = col(P.lip), lineC = col(P.lipLine), deep = col('#7a3333');
  const shade = (() => { const o = {}; skin.getHSL(o); return new THREE.Color().setHSL(o.h - .01, Math.min(1, o.s * 1.35), o.l * .68) })();

  const skinMat = track(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .58, metalness: 0, sheen: .6, sheenRoughness: .5, sheenColor: col('#ffb9a0'), clearcoat: .06, clearcoatRoughness: .6, name: 'Skin' }));

  // superfície frontal (heightfield) usada para ancorar olhos, sobrancelhas e boca
  function frontBase(x, y) { const d = profile.dims(y); return Math.abs(x) >= d.a ? 0 : d.df * Math.pow(1 - Math.pow(Math.abs(x) / d.a, d.n), 1 / d.n) }
  function surfNoDome(x, y) { return frontBase(x, y) + field(x, y).dz }
  const eyes = [-1, 1].map(s => eyeFrame(P, s, surfNoDome(s * P.eyeX, P.eyeY)));
  function domeLift(x, y, z) { // a pele envolve o globo ocular (pálpebras)
    const d = profile.dims(y), cph = Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(Math.abs(x) / Math.max(d.a, 1e-4), 1), d.n))), lw = .35 + .65 * sstep(.55, .88, cph);
    for (const e of eyes) { const dx = x - e.ex, dy = y - e.ey, r2 = dx * dx + dy * dy; if (r2 < e.Rl2) z += (smax(z, e.zc + Math.sqrt(e.Rl2 - r2), .05) - z) * lw }
    return z;
  }
  const surfZ = (x, y) => domeLift(x, y, surfNoDome(x, y));

  // ---- cabeça: uma malha só ----
  {
    const LON = Math.round(232 * Q), LAT = Math.round(224 * Q), WARP = .42; // mais densidade na frente (rosto)
    const ZERO = { dz: 0, lip: 0, line: 0, blush: 0, ao: 0, nostril: 0, sock: 0 };
    let lastY = NaN, dA = 0, dDf = 0, dDb = 0, dN = 2;
    const geo = new THREE.SphereGeometry(1, LON, LAT);
    geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
    const p = geo.attributes.position, colors = new Float32Array(p.count * 3), c = new THREE.Color();
    const H = profile.yt - profile.yb;
    for (let i = 0; i < p.count; i++) {
      const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i), rho = Math.hypot(ux, uz);
      const u = rho > 1e-7 ? Math.atan2(ux, uz) : 0, ph = u - WARP * Math.sin(u);
      let y = profile.yb + (uy + 1) / 2 * H;
      if (y !== lastY) { const d = profile.dims(y); lastY = y; dA = d.a; dDf = d.df; dDb = d.db; dN = d.n } // o perfil só muda de um anel para outro
      const sph = Math.sin(ph), cph = Math.cos(ph), ee = 2 / dN;
      let x = dA * sgnPow(sph, ee), z = (cph >= 0 ? dDf : dDb) * sgnPow(cph, ee);
      const wf = sstep(.05, .55, cph);
      let f = wf > 0 ? field(x, y) : ZERO, eyeState = 0; // a nuca não precisa do relevo do rosto
      if (wf > 0) z += f.dz * wf;
      // olhos: dome da pálpebra, abertura recortada e borda ajustada na curva exata
      if (wf > .9) for (const e of eyes) {
        let [U, V] = e.local(x, y); const uN = U / e.halfW;
        if (Math.abs(uN) >= 1 || Math.abs(V) > .22) { if (Math.abs(x - e.ex) < e.Rl * 1.3 && Math.abs(y - e.ey) < e.Rl * 1.3) z = domeLift(x, y, z); continue }
        const Hh = e.H(uN, V >= 0), vN = Hh > 1e-4 ? Math.abs(V) / Hh : 9;
        if (vN >= 1 && vN < 1.34 && Math.abs(uN) < .88 && Hh > .02) { // ajusta o vértice à borda da pálpebra
          [x, y] = e.toHead(U, Math.sign(V || 1) * Hh);
          z = surfNoDome(x, y); f = field(x, y); eyeState = 2;
        }
        z = domeLift(x, y, z);
        if (vN < 1 && Math.abs(uN) < .88 && Hh > .02) { const r2 = (x - e.ex) ** 2 + (y - e.ey) ** 2; z = e.zc + Math.sqrt(Math.max(P.Re * P.Re - r2, 0)) - .014; eyeState = 1 } // dentro da abertura: logo atrás da superfície do globo
        break;
      }
      if (P.jawLift > 0) y += P.jawLift * sstep(profile.yb + .75, profile.yb + .02, y) * sstep(.4, -.7, z);
      p.setXYZ(i, x, y, z);
      // cor por vértice: pele + rubor + lábios + sombras
      c.copy(skin);
      const k = wf;
      c.lerp(blush, clamp(f.blush * k * .55, 0, .6));
      c.lerp(shade, clamp(f.ao * k * .55, 0, .75));
      c.lerp(lipC, clamp(f.lip * k, 0, 1));
      c.lerp(lineC, clamp(f.line * k * .85, 0, 1));
      c.lerp(shade, clamp(f.nostril * k * .5, 0, .55));
      if (eyeState === 2) c.lerp(blush, .55);
      if (eyeState === 1) c.copy(deep);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); mark('loop');
    geo.computeVertexNormals(); weldSeamNormals(geo, LON, LAT); const merged = geo; mark('merge'); 
    mark('normals');
    { // sombra sob o queixo/mandíbula: só onde a superfície olha para baixo
      const nr = merged.attributes.normal, ca = merged.attributes.color, cc = new THREE.Color();
      for (let i = 0; i < ca.count; i++) { const dn = sstep(-.25, -.9, nr.getY(i)); if (dn > 0) { cc.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)).lerp(shade, dn * .5); ca.setXYZ(i, cc.r, cc.g, cc.b) } }
    }
    const head = new THREE.Mesh(track(merged), skinMat); head.name = 'Head_Skin'; root.add(head);
  }

  mark('head');
  // ---- pescoço ----
  {
    const geo = new THREE.CylinderGeometry(P.neckR * .92, P.neckR * 1.15, .95, 64, 8, false);
    setColors(geo, (c, x, y) => { c.copy(skin).lerp(shade, .62 * sstep(.02, .42, y)) });
    const neck = new THREE.Mesh(track(geo), skinMat); neck.position.set(0, P.bottom - .12, -.13); neck.name = 'Neck'; root.add(neck);
  }

  // ---- orelhas ----
  for (const s of [-1, 1]) {
    const yE = -.03, d = profile.dims(yE), g = new THREE.Group(); g.name = 'Ear_' + (s < 0 ? 'L' : 'R');
    const eS = P.earS;
    const outer = new THREE.SphereGeometry(1, 40, 28); outer.scale(.05 * eS, .2 * eS, .135 * eS);
    setColors(outer, c => c.copy(skin).lerp(blush, .2));
    { const m = new THREE.Mesh(track(outer), skinMat); m.name = g.name + '_Outer'; g.add(m) }
    const inner = new THREE.SphereGeometry(1, 32, 24); inner.scale(.028 * eS, .125 * eS, .08 * eS);
    setColors(inner, c => c.copy(skin).lerp(blush, .45).multiplyScalar(.9));
    const inn = new THREE.Mesh(track(inner), skinMat); inn.name = g.name + '_Inner'; inn.position.set(s * .026 * eS, -.005, .012); g.add(inn);
    g.position.set(s * (d.a - .035), yE, -.045); g.rotation.set(0, s * -.32, s * .12);
    root.add(g);
  }

  const normalAt = (x, y) => {
    const e = .004, dzx = (surfZ(x + e, y) - surfZ(x - e, y)) / (2 * e), dzy = (surfZ(x, y + e) - surfZ(x, y - e)) / (2 * e);
    return new THREE.Vector3(-dzx, -dzy, 1).normalize();
  };

  // ---- sobrancelhas ----
  const browMat = track(new THREE.MeshStandardMaterial({ color: col(P.brow), roughness: .85, name: 'Brow' }));
  for (const s of [-1, 1]) {
    const N = 28, pts = [], rw = [], rh = [];
    const x0 = P.eyeX - P.Re * 1.05, x1 = P.eyeX + P.Re * (1.2 * P.browLen), by = P.eyeY + P.browGap;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = x0 + (x1 - x0) * t;
      const arch = P.browArch * (1 - Math.pow((t - P.browPeak) / (t < P.browPeak ? P.browPeak : 1 - P.browPeak), 2)) - P.browArch * .4;
      const y = by + arch + P.browSlope * (t - .3) * 3 - (t > .82 ? (t - .82) * .1 : 0);
      pts.push(new THREE.Vector3(s * x, y, surfZ(s * x, y) + .004));
      const taper = Math.sqrt(sstep(0, .07, t)) * (1 - .72 * sstep(.5, 1, t)) * (.72 + .28 * Math.sin(Math.PI * clamp(t * 1.2, 0, 1)));
      rw.push(P.browTh * taper * (t < .06 ? .8 : 1)); rh.push(P.browTh * taper * .5);
    }
    const m = new THREE.Mesh(track(ribbon(pts, rw, rh, (i, p) => normalAt(p.x, p.y), 10)), browMat); m.name = 'Brow_' + (s < 0 ? 'L' : 'R'); root.add(m);
  }

  // ---- olhos ----
  const scleraMat = track(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .28, clearcoat: .6, clearcoatRoughness: .2, name: 'Sclera' }));
  const irisTex = track(irisTexture(P.iris));
  const irisMat = track(new THREE.MeshPhysicalMaterial({ map: irisTex, roughness: .3, clearcoat: .8, clearcoatRoughness: .12, name: 'Iris' }));
  const corneaMat = track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .1, roughness: .02, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false, name: 'Cornea' }));
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, name: 'Catchlight' }));
  const lashMat = track(new THREE.MeshStandardMaterial({ color: col('#140d0c'), roughness: .5, name: 'Lash' }));

  for (const e of eyes) {
    const s = e.s, Re = P.Re, grp = new THREE.Group(); grp.name = 'Eye_' + (s < 0 ? 'L' : 'R');
    grp.position.set(e.ex, e.ey, e.zc);
    const sg = new THREE.SphereGeometry(Re, 56, 40);
    setColors(sg, (c, x, y, z) => {
      const dx = x / Re, dy = y / Re, dz = z / Re;
      c.set('#fdf8f2').multiplyScalar(1 - .34 * Math.max(0, dy - .05) - .22 * Math.pow(1 - clamp(dz, 0, 1), 2));
      c.lerp(col('#e9b9b0'), .5 * sstep(.62, .95, Math.abs(dx)));
    });
    const sclera = new THREE.Mesh(track(sg), scleraMat); sclera.name = 'Sclera'; grp.add(sclera);
    const ig = new THREE.SphereGeometry(Re * 1.006, 56, 20, 0, Math.PI * 2, 0, P.irisAng); ig.rotateX(Math.PI / 2);
    const iris = new THREE.Mesh(track(ig), irisMat); iris.name = 'Iris'; grp.add(iris);
    const cg = new THREE.SphereGeometry(Re * 1.02, 48, 20, 0, Math.PI * 2, 0, 1.0); cg.rotateX(Math.PI / 2);
    const cornea = new THREE.Mesh(track(cg), corneaMat); cornea.renderOrder = 3; cornea.name = 'Cornea'; grp.add(cornea);
    const spark = (lon, lat, r) => {
      const R = Re * 1.03, pos = new THREE.Vector3(R * Math.sin(lon) * Math.cos(lat), R * Math.sin(lat), R * Math.cos(lon) * Math.cos(lat));
      const g = new THREE.SphereGeometry(1, 20, 14); g.scale(r, r * .92, r * .25);
      const m = new THREE.Mesh(track(g), catchMat); m.position.copy(pos); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()); m.name = 'Catchlight'; grp.add(m);
    };
    const sk = P.id === 'cute_round' ? 1.25 : 1;
    spark(-s * .27, .3, .034 * sk); spark(s * .2, -.3, .016 * sk);
    root.add(grp);

    // bordas das pálpebras: seguem exatamente a curva de abertura, sobre a superfície real
    const edge = (up, n, extra) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const uN = -1 + 2 * i / n, [x, y] = e.toHead(uN * e.halfW, (up ? 1 : -1) * e.H(uN, up));
        pts.push(new THREE.Vector3(x, y, surfZ(x, y) + .002));
      }
      return pts;
    };
    const radial = (i, p) => normalAt(p.x, p.y);
    { // inferior: borda fina e rosada
      const pts = edge(false, 40), rw = pts.map((p, i) => .0075 * Math.pow(Math.sin(Math.PI * i / 40), .5) + .0015);
      const m = new THREE.Mesh(track(ribbon(pts, rw, rw, radial, 8)), skinMat);
      setColors(m.geometry, c => c.copy(skin).lerp(blush, .6)); m.name = 'Lid_Rim_L'; root.add(m);
    }
    { // superior: linha de cílios, com flick no canto externo
      const base = edge(true, 40); let list = base;
      if (P.flick > 0) {
        const ext = [];
        for (let k = 1; k <= 6; k++) { const U = e.halfW + P.flick * k / 6 * .9, V = e.H(.98, true) * .5 + P.flick * k / 6 * .7, [x, y] = e.toHead(U, V); ext.push(new THREE.Vector3(x, y, surfZ(x, y) + .002)) }
        list = base.concat(ext); // U cresce rumo ao canto externo nos dois olhos
      }
      const L = list.length, rw = list.map((p, i) => { const t = i / (L - 1); return P.lash * (.35 + .65 * Math.pow(Math.sin(Math.PI * t), .6)) });
      rw[0] = rw[L - 1] = .0005;
      const m = new THREE.Mesh(track(ribbon(list, rw, rw.map(r => r * .75), radial, 8)), lashMat); m.name = 'Lashline'; root.add(m);
    }
  }

  // ---- linha da boca (fina, afundada no sulco) ----
  {
    const N = 36, pts = [], rw = [], mw = P.mouthW;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = (t * 2 - 1) * mw * 1.04, y = P.mouthY + P.smile * .07 * Math.pow(Math.min(Math.abs(x) / mw, 1.3), 2);
      pts.push(new THREE.Vector3(x, y, surfZ(x, y) + .002));
      rw.push(.0065 * Math.pow(Math.sin(Math.PI * t), .6));
    }
    const mat = track(new THREE.MeshStandardMaterial({ color: col(P.lipLine), roughness: .6, name: 'MouthLine' }));
    const m = new THREE.Mesh(track(ribbon(pts, rw, rw.map(r => r * .8), () => new THREE.Vector3(0, 0, 1), 8)), mat); m.name = 'Mouth_Line'; root.add(m);
  }

  mark('total'); root.userData.params = P; root.userData.timings = marks;
  const dispose = () => { root.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose() }); disposables.forEach(d => d.dispose && d.dispose()) };
  return { group: root, dispose, params: P };
}
