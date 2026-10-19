// Head V2 — cabeça cartoon 3D procedural (beauty pass).
//
// Forma base: um campo de distância (SDF) com volumes anatômicos fundidos por união suave — crânio, terço médio,
// maçãs do rosto, mandíbula (do queixo ao ângulo), queixo e pescoço. A malha é uma grade única (pele + pescoço)
// projetada nesse campo por raios a partir de dentro da cabeça.
// Relevo fino: um campo de deslocamento em (x, y) na frente do rosto — órbitas, prega da pálpebra, nariz (ponte,
// ponta, asas, narinas), lábios paramétricos com arco do cupido, filtro, sulcos e maçãs.
// A pele envolve o globo ocular (pálpebras na própria malha) e a abertura do olho é recortada nela.
// Sombreamento: shader de pele com "wrap" avermelhado (falso espalhamento subsuperficial), oclusão por cavidade
// calculada na malha, brilho por vértice (lábios), sombras projetadas. Sem assets externos.
import * as THREE from 'three';
import { resolve } from './presets.js';

const { clamp } = THREE.MathUtils;
const sqrt = Math.sqrt, exp = Math.exp;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const gau = (d, r) => exp(-(d * d) / (r * r));
const smaxS = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25 };
const col = h => new THREE.Color(h);

// ---------- SDF ----------
function ellip(x, y, z, rx, ry, rz) {
  const a = x / rx, b = y / ry, c = z / rz, k0 = sqrt(a * a + b * b + c * c);
  const a1 = a / rx, b1 = b / ry, c1 = c / rz, k1 = sqrt(a1 * a1 + b1 * b1 + c1 * c1);
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}
// super-elipsoide: frente mais "chapada" (norma-p em xz para z>0, p≈2.3–2.8), nuca arredondada (rzB).
// A norma-p é aproximada sem pow (rápido): na diagonal ela vale 2^(1/p-1/2) da norma euclidiana; cF = 1 - esse fator.
const sqC = n => 1 - Math.pow(2, 1 / n - .5);
function superE(x, y, z, rx, ry, rzF, rzB, cF) {
  const X = Math.abs(x) / rx, Z = Math.abs(z) / (z > 0 ? rzF : rzB), q = X * X + Z * Z;
  let h = q;
  if (z > 0 && cF > 0 && q > 1e-12) { const w = 2 * X * Z / q, f = 1 - cF * w * w; h = q * f * f }
  const v = y / ry, k = sqrt(h + v * v);
  return (k - 1) * Math.min(rx, ry, z > 0 ? rzF : rzB);
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 }
function roundCone(px, py, pz, ax, ay, az, ra, bx, by, bz, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}

function makeSDF(P) {
  const [cy, cz, crx, cry, crz, crzB = crz, cn0 = 2] = P.cran, [fy, fz, frx, fry, frz, fn0 = 2] = P.face, cn = sqC(cn0), fn = sqC(fn0), [bx, by, bz, brx, bry, brz, bk] = P.cheekB;
  const [jcy, jcz, jcr, jgx, jgy, jgz, jgr, jk, jcw = 0] = P.jaw, [hy, hz, hrx, hry, hrz, hk] = P.chin, [nr, nty, ntz, nby, nbz, nk] = P.neck;
  const cut = nby + .06;
  // esferas envolventes: se o ponto está longe de um volume, ele não altera a união suave → pula (bem mais rápido)
  const bs = (x, y, z, r) => ({ x, y, z, r }), far = (b, ax, y, z, d, k) => { const dx = ax - b.x, dy = y - b.y, dz = z - b.z; return sqrt(dx * dx + dy * dy + dz * dz) - b.r > d + k + .2 };
  const segB = (ax, ay, az, ra, bx2, by2, bz2, rb) => bs((ax + bx2) / 2, (ay + by2) / 2, (az + bz2) / 2, Math.hypot(bx2 - ax, by2 - ay, bz2 - az) / 2 + Math.max(ra, rb));
  const BF = bs(0, fy, fz, Math.max(frx, fry, frz)), BC = bs(bx, by, bz, Math.max(brx, bry, brz)), BJ = segB(jcw, jcy, jcz, jcr, jgx, jgy, jgz, jgr);
  const BW = segB(0, jcy, jcz, jcr, jcw, jcy, jcz, jcr), BH = bs(0, hy, hz, Math.max(hrx, hry, hrz)), BN = segB(0, nty, ntz, nr, 0, nby, nbz, nr * 1.1);
  const S = P.scm, BS = S && segB(S[0], S[1], S[2], S[6], S[3], S[4], S[5], S[6]); // esternocleidomastoideo: de trás da orelha à base do pescoço
  return (x, y, z) => {
    const ax = sqrt(x * x + 4e-4); // |x| suave
    let d = superE(x, y - cy, z - cz, crx, cry, crz, crzB, cn);
    if (!far(BF, ax, y, z, d, .3)) d = smin(d, superE(x, y - fy, z - fz, frx, fry, frz, frz, fn), .3);
    if (!far(BC, ax, y, z, d, bk)) d = smin(d, ellip(ax - bx, y - by, z - bz, brx, bry, brz), bk);
    if (!far(BJ, ax, y, z, d, jk)) d = smin(d, roundCone(ax, y, z, jcw, jcy, jcz, jcr, jgx, jgy, jgz, jgr), jk);
    if (jcw > 0 && !far(BW, ax, y, z, d, jk * .5)) d = smin(d, roundCone(ax, y, z, 0, jcy, jcz, jcr, jcw, jcy, jcz, jcr), jk * .5); // queixo largo (mandíbula quadrada)
    if (!far(BH, ax, y, z, d, hk)) d = smin(d, ellip(x, y - hy, z - hz, hrx, hry, hrz), hk);
    if (!far(BN, ax, y, z, d, nk)) d = smin(d, roundCone(x, y, z, 0, nty, ntz, nr, 0, nby, nbz, nr * 1.1), nk);
    if (S && !far(BS, ax, y, z, d, S[7])) d = smin(d, roundCone(ax, y, z, S[0], S[1], S[2], S[6], S[3], S[4], S[5], S[6] * .8), S[7]);
    return y - cut > .05 ? d : smaxS(d, cut - y, .05);
  };
}

// do ponto interno O, ao longo de dir, até a primeira saída da superfície. sGuess = distância do vizinho (acelera muito).
function traceOut(sdf, ox, oy, oz, dx, dy, dz, sGuess = 0) {
  let s = Math.max(sGuess - .02, 0), d = sdf(ox + dx * s, oy + dy * s, oz + dz * s);
  if (d >= 0) { s = 0; d = sdf(ox, oy, oz) }
  let prev = s, dp = d;
  for (let k = 0; k < 90; k++) {
    prev = s; dp = d; s += Math.max(-d * .9, .002);
    d = sdf(ox + dx * s, oy + dy * s, oz + dz * s);
    if (d >= 0) break;
  }
  // regula falsi (Illinois) no intervalo [prev, s]
  let a = prev, fa = dp, b = s, fb = d, side = 0;
  for (let j = 0; j < 7 && b - a > 1e-5; j++) {
    const m = (a * fb - b * fa) / (fb - fa), fm = sdf(ox + dx * m, oy + dy * m, oz + dz * m);
    if (fm < 0) { a = m; fa = fm; if (side === -1) fb *= .5; side = -1 } else { b = m; fb = fm; if (side === 1) fa *= .5; side = 1 }
  }
  return (a * fb - b * fa) / (fb - fa);
}
// superfície frontal z(x, y): raio vindo da frente
function makeFrontZ(sdf) {
  return (x, y) => {
    let z = 1.5, prev = z, d = sdf(x, y, z);
    for (let k = 0; k < 80; k++) {
      if (d < 0) { let a = prev, b = z; for (let j = 0; j < 16; j++) { const m = (a + b) * .5; if (sdf(x, y, m) < 0) b = m; else a = m; if (a - b < 2e-5) break } return (a + b) * .5 }
      if (z < -.5) return -.5;
      prev = z; z -= Math.max(d * .9, .002); d = sdf(x, y, z);
    }
    return z;
  };
}

// ---------- olho: quadro local ----------
function cornerFn(u, peak) { // 0 nos cantos, 1 no ponto mais aberto
  if (Math.abs(u) >= 1) return 0;
  const w = u < peak ? (u - peak) / (peak + 1) : (u - peak) / (1 - peak);
  return Math.pow(Math.cos(clamp(w, -1, 1) * Math.PI / 2), .8);
}
function eyeFrame(P, s) {
  const th = s * P.tilt, c = Math.cos(th), sn = Math.sin(th), Re = P.Re;
  const e = { s, ex: s * P.eyeX, ey: P.eyeY, halfW: Re * Math.sin(P.openW) * 1.02, hu: Re * Math.sin(P.openU) * 1.1, hl: Re * Math.sin(-P.openL) * 1.1, Rl: Re * 1.1, zc: 0 };
  e.Rl2 = e.Rl * e.Rl;
  e.local = (x, y) => { const dx = x - e.ex, dy = y - e.ey; return [s * (dx * c + dy * sn), -dx * sn + dy * c] };
  e.toHead = (U, V) => { const lx = s * U; return [e.ex + lx * c - V * sn, e.ey + lx * sn + V * c] };
  e.H = (uN, up) => up ? e.hu * cornerFn(uN, P.peakU) : e.hl * cornerFn(uN, P.peakL);
  return e;
}

// ---------- relevo do rosto + máscaras de cor ----------
function makeFaceField(P, eyes) {
  const eyeX = P.eyeX, eyeY = P.eyeY, tipY = P.noseTipY, mY = P.mouthY, mw = P.mouthW, nW = P.noseW, Re = P.Re;
  const rootY = eyeY - .02, chinY = P.chin[0];
  const out = { dz: 0, lipU: 0, lipL: 0, lipHi: 0, line: 0, blush: 0, ao: 0, nostril: 0, lid: 0, hi: 0, gloss: 0 };
  const ymAt = ax => { const t = Math.min(ax / mw, 1.25); return mY + P.smile * .04 * t * t - .004 * gau(ax, .03) };
  const ymC = ymAt(mw);
  return function field(x, y) {
    const ax = sqrt(x * x + 1e-4); // |x| suave: sem vinco na linha média
    let dz = 0, ao = 0, hi = 0, lid = 0, lipU = 0, lipL = 0, lipHi = 0, line = 0, nostril = 0, gloss = 0;
    // testa e arcada
    dz += P.browRidge * exp(-((ax / .58) ** 4)) * gau(y - (eyeY + .25), .09); // arcada contínua (sem vale no meio)
    hi += .35 * gau(x, .28) * gau(y - .45, .22);
    // órbitas
    const sock = gau(ax - eyeX, Re * 1.15) * gau(y - eyeY, Re * .95);
    dz -= P.socket * sock;
    const inner = gau(ax - (eyeX - Re * .98), .07) * gau(y - (eyeY + .015), .075);
    dz -= .016 * inner; ao += .2 * inner;
    // pálpebras: prega, pele da pálpebra, bolsinha inferior
    for (const e of eyes) {
      const [U, V] = e.local(x, y), uN = U / e.halfW;
      if (uN < -1.5 || uN > 1.6 || V < -.32 || V > .3) continue;
      const uc = clamp(uN, -1, 1), Hu = e.H(uc, true), Hl = e.H(uc, false);
      const fade = (1 - sstep(.7, 1.1, uN)) * (1 - sstep(.6, 1.0, -uN));
      const vc = Hu + P.creaseGap * (.4 + .6 * cornerFn(uc * .9, P.peakU));
      const cr = gau(V - vc, .015) * fade;
      dz -= P.crease * cr; ao += .9 * cr * P.crease / .016;
      dz += P.crease * .5 * gau(V - (vc - .024), .017) * fade;
      if (V > 0) lid = Math.max(lid, fade * sstep(vc + .07, vc - .01, V));
      dz += .003 * gau(V + Hl + .045, .03) * fade;
    }
    // maçãs do rosto
    dz += P.cheekH * gau(ax - .41, .2) * gau(y - (ymC + .25), .16);
    // ---- nariz ----
    if (ax < .42 && y < rootY + .25 && y > tipY - .3) {
      const q = (rootY - y) / (rootY - tipY), qc = clamp(q, 0, 1), bw = (.04 + .05 * Math.pow(qc, 1.6)) * nW;
      const prof = P.noseH * Math.pow(qc, P.scoop) * (q > 1 ? exp(-(((q - 1) / .14) ** 2)) : 1);
      dz += prof * exp(-((x / bw) ** 2));
      hi += .8 * exp(-((x / (bw * .45)) ** 2)) * sstep(.05, .45, q) * (1 - sstep(.95, 1.15, q));
      const dy = y - (tipY + .014), ry = dy > 0 ? P.tipR * 1.2 : P.tipR * .7, r2 = (x / (P.tipR * nW)) ** 2 + (dy / ry) ** 2;
      if (r2 < 1) { const k = 1 - r2; dz += P.tipH * Math.pow(k, 1.5); hi += 1.1 * k * k * k; gloss += .25 * k * k }
      const aX = P.alaeX * nW, a2 = ((ax - aX) / (.048 * nW)) ** 2 + ((y - (tipY - .006)) / .042) ** 2;
      if (a2 < 1) dz += P.alaeH * Math.pow(1 - a2, 1.5);
      const ring = sqrt(a2), side = sstep(aX * .55, aX * 1.05, ax) + sstep(tipY - .02, tipY + .03, y) * .6;
      const crease = gau(ring - 1.05, .15) * Math.min(side, 1) * sstep(tipY - .07, tipY - .02, y);
      dz -= P.alaeH * .25 * crease; ao += .2 * crease;
      const n2 = ((ax - .041 * nW) / (.025 * nW)) ** 2 + ((y - (tipY - .052)) / .013) ** 2;
      nostril = exp(-n2 * 1.4); dz -= .012 * nostril;
      const under = gau(x, .1) * gau(y - (tipY - .082), .026);
      dz -= .01 * under; ao += .45 * under;
    }
    // ---- boca ----
    const t = ax / mw;
    dz += P.muzzle * gau(x, .34) * gau(y - (mY + .03), .2);
    if (t < 3 && y > mY - .4 && y < tipY + .1) {
      const ym = ymAt(ax), tc = Math.min(t, 1), xf = t < 1 ? 1 : exp(-(((t - 1) / .1) ** 2));
      const thU = P.lipU * Math.pow(Math.max(0, 1 - Math.pow(tc, 2.4)), .7) * (1 + P.bow * (gau(tc - .3, .15) - .45 * gau(tc, .085)));
      const thL = P.lipL * Math.pow(Math.max(0, 1 - Math.pow(tc, 2)), .6);
      if (y >= ym) {
        const v = (y - ym) / Math.max(thU, .003);
        dz += P.lipH * (thU / P.lipU) * (exp(-(((v - .4) / .72) ** 2)) + .12 * gau(v - 1.03, .13)) * xf;
        lipU = (1 - sstep(.82, 1.12, v)) * sstep(.0015, .006, thU);
        hi += .9 * gau(v - 1.08, .12) * xf * sstep(.002, .01, thU);
      } else {
        const w = (ym - y) / Math.max(thL, .003);
        dz += P.lipH * 1.1 * (thL / P.lipL) * exp(-(((w - .45) / .62) ** 2)) * xf;
        lipL = (1 - sstep(.82, 1.12, w)) * sstep(.0015, .006, thL);
        lipHi = gau(w - .38, .22) * gau(x, mw * .45);
      }
      const lf = t < 1 ? 1 : exp(-(((t - 1) / .06) ** 2));
      dz -= .02 * gau(y - ym, .008 + .004 * tc) * lf;
      line = gau(y - ym, .006 + .002 * tc) * lf;
      const corner = gau(ax - mw * 1.02, .02) * gau(y - ymC, .022);
      dz -= .012 * corner; ao += .5 * corner;
      dz += P.smile * .016 * gau(ax - (mw + .07), .06) * gau(y - (ymC + .03), .07);
      const sul = gau(y - (mY - P.lipL - .052), .03) * gau(x, mw * .85);
      dz -= .016 * sul; ao += .4 * sul;
      ao += .35 * gau(y - (mY - P.lipL - .022), .02) * gau(x, mw * .7);
      const band = sstep(mY + P.lipU * .9, mY + P.lipU * 1.5, y) * sstep(tipY - .03, tipY - .09, y);
      dz -= .007 * gau(x, .02) * band; dz += .005 * gau(ax - .032, .014) * band;
      gloss += lipU * .55 + lipL * 1.0;
      const fold = (P.fold ?? .5) * (.4 + .6 * Math.min(P.smile, 1));
      if (fold > .05) { // dobra nasolabial (sorriso / maturidade)
        const px = .14 * nW, py = tipY - .02, sx = mw * 1.1 - px, sy = ymC + .01 - py;
        const tt = clamp(((ax - px) * sx + (y - py) * sy) / (sx * sx + sy * sy), 0, 1);
        const dd = Math.hypot(ax - (px + sx * tt), y - (py + sy * tt)), nl = gau(dd, .035) * Math.pow(Math.sin(Math.PI * tt), .7);
        dz -= .014 * fold * nl; ao += .3 * nl * fold;
      }
    }
    // queixo
    dz += P.chinH * gau(x, .2) * gau(y - (chinY + .06), .12);
    hi += .35 * gau(x, .12) * gau(y - (chinY + .08), .08);
    out.dz = dz; out.ao = ao; out.hi = hi; out.lid = lid; out.lipU = lipU; out.lipL = lipL; out.lipHi = lipHi; out.line = line; out.nostril = nostril; out.gloss = gloss;
    out.blush = .6 * gau(ax - .42, .19) * gau(y - (ymC + .25), .15) + .35 * gau(x, .07) * gau(y - tipY, .06) + .12 * gau(x, .2) * gau(y - (chinY + .06), .12);
    return out;
  };
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
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return fixNormals(geo);
}
function fixNormals(geo) { // normais unitárias (fitas com pontas finas geram normais nulas) → GLB sem avisos
  const n = geo.attributes.normal.array;
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]); if (l > 1e-8) { n[i] /= l; n[i + 1] /= l; n[i + 2] /= l } else { n[i] = 0; n[i + 1] = 0; n[i + 2] = 1 } }
  return geo;
}
function mirrorX(geo) {
  const g = geo.clone(); g.scale(-1, 1, 1);
  const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t }
  g.index.needsUpdate = true; g.computeVertexNormals(); return fixNormals(g);
}
function setColors(geo, fn) {
  const p = geo.attributes.position, cl = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i), i); cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b }
  geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  if (!geo.attributes.gloss) geo.setAttribute('gloss', new THREE.BufferAttribute(new Float32Array(p.count), 1));
  return geo;
}
function mergeGeos(list) { // junta geometrias indexadas (cor/brilho só se todas tiverem)
  const hasC = list.every(g => g.attributes.color);
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), colA = new Float32Array(nv * 3), gl = new Float32Array(nv), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); if (hasC) colA.set(g.attributes.color.array, ov * 3);
    if (g.attributes.gloss) gl.set(g.attributes.gloss.array, ov);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[oi + i] = ia[i] + ov;
    ov += n; oi += ia.length;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (hasC) { m.setAttribute('color', new THREE.BufferAttribute(colA, 3)); m.setAttribute('gloss', new THREE.BufferAttribute(gl, 1)) }
  for (let i = 0; i < nor.length; i += 3) { const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]); if (l > 1e-8) { nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l } else nor[i + 2] = 1 }
  m.setIndex(new THREE.BufferAttribute(idx, 1)); list.forEach(g => g.dispose()); return m;
}

function irisTexture(cols, pupil) {
  const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  // eixo y: do centro da pupila (topo) até a borda da íris (base). eixo x: ângulo (u≈.25 = parte de baixo do olho)
  const p = pupil, g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040202'); g.addColorStop(p - .02, '#070404'); g.addColorStop(p + .03, cols[0]);
  g.addColorStop(p + .2, cols[1]); g.addColorStop(.8, cols[2]); g.addColorStop(.9, '#1c0e06'); g.addColorStop(1, '#0d0603');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { // fibras radiais
    const x = rnd() * W, y0 = H * (p + .02 + rnd() * .08), y1 = H * (.55 + rnd() * .35);
    c.strokeStyle = rnd() > .45 ? 'rgba(255,226,160,' + (.05 + rnd() * .12) + ')' : 'rgba(35,15,4,' + (.08 + rnd() * .16) + ')';
    c.lineWidth = .8 + rnd() * 2.2; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + (rnd() - .5) * 8, (y0 + y1) / 2, x + (rnd() - .5) * 4, y1); c.stroke();
  }
  const ring = c.createLinearGradient(0, H * (p - .01), 0, H * (p + .14)); // colarete claro
  ring.addColorStop(0, 'rgba(255,225,150,0)'); ring.addColorStop(.45, 'rgba(255,225,150,.32)'); ring.addColorStop(1, 'rgba(255,225,150,0)');
  c.fillStyle = ring; c.fillRect(0, H * (p - .01), W, H * .15);
  // luz entrando por baixo (cáustica) e sombra da pálpebra em cima
  const lg = c.createLinearGradient(0, 0, W, 0);
  for (let k = 0; k <= 16; k++) { const u = k / 16, v = Math.cos(2 * Math.PI * (u - .25)); lg.addColorStop(u, v > 0 ? 'rgba(255,200,120,' + (.38 * v * v).toFixed(3) + ')' : 'rgba(10,4,0,' + (.5 * v * v).toFixed(3) + ')') }
  c.globalCompositeOperation = 'source-atop'; c.fillStyle = lg; c.fillRect(0, H * (p + .03), W, H * (.97 - p));
  c.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; return t;
}

// Pele: difusa com "wrap" colorido (luz vermelha atravessa o terminador) + rugosidade por vértice (brilho dos lábios)
function skinMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .56, metalness: 0, specularIntensity: .55, sheen: .3, sheenRoughness: .5, sheenColor: col('#ffd2c2'), name: 'Skin' });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float gloss;\nvarying float vGloss;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGloss = gloss;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGloss;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .24, clamp(vGloss, 0., 1.));')
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace(
        'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
        '{ float shF = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n' +
        '  directLight.color *= mix( 1.0, shF, smoothstep( 0.0, 0.35, dot( geometryNormal, directLight.direction ) ) ); }'))
      .replace('#include <lights_physical_pars_fragment>', THREE.ShaderChunk.lights_physical_pars_fragment.replace(
        'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
        'float nlW = dot( geometryNormal, directLight.direction ); vec3 wW = vec3( .4, .2, .15 );\n' +
        'vec3 wrapD = pow( clamp( ( vec3( nlW ) + wW ) / ( 1.0 + wW ), 0.0, 1.0 ), vec3( 1.5 ) );\n' +
        'reflectedLight.directDiffuse += wrapD * directLight.color * BRDF_Lambert( material.diffuseColor );'));
  };
  m.customProgramCacheKey = () => 'skin-wrap-v2';
  return m;
}

// ---------- construção principal ----------
export function buildHead(presetId, adj, opts = {}) {
  const T0 = performance.now(), marks = {}, mark = l => { marks[l] = Math.round(performance.now() - T0) };
  const Q = opts.quality || 1;
  const P = resolve(presetId, adj);
  const disposables = [], root = new THREE.Group();
  root.name = 'Head_V2_' + presetId;
  const track = o => (disposables.push(o), o);
  const sdf = makeSDF(P), frontZ = makeFrontZ(sdf);
  const eyes = [-1, 1].map(s => eyeFrame(P, s));
  const field = makeFaceField(P, eyes);
  const skin = col(P.skin), blush = col(P.blush), lipC = col(P.lip), lineC = col(P.lipLine), lidC = col(P.lidShadow);
  const hsl = {}; skin.getHSL(hsl);
  const shade = new THREE.Color().setHSL(hsl.h - .018, Math.min(1, hsl.s * 1.02), hsl.l * .6);
  const skinHi = new THREE.Color().setHSL(hsl.h + .006, hsl.s * .92, Math.min(.92, hsl.l * 1.13));
  const lipUC = lipC.clone().multiplyScalar(.8), lipHiC = lipC.clone().lerp(col('#ffd0c8'), .3), nostrilC = col('#3a1612'), deep = col('#6e3634');
  const skinMat = track(skinMaterial());

  function surfNoDome(x, y) { return frontZ(x, y) + field(x, y).dz }
  for (const e of eyes) e.zc = surfNoDome(e.ex, e.ey) - P.sink;
  function domeLift(x, y, z, lw = 1) { // a pele envolve o globo ocular → pálpebras (lw: só onde a superfície olha para a frente)
    for (const e of eyes) {
      const dx = x - e.ex, dy = y - e.ey, r2 = dx * dx + dy * dy; if (r2 > e.Rl2 * 1.5) continue;
      // perfil da "tampa" do globo: esfera até 85% do raio, depois continua com a mesma inclinação e cai suave (C1, sem vinco circular)
      const t = sqrt(r2) / e.Rl, u = t - .85, hS = e.zc + e.Rl * (u < 0 ? sqrt(1 - t * t) : .5268 - 1.6135 * u - 2.2 * u * u);
      z += (smaxS(z, hS, .08) - z) * lw;
    }
    return z;
  }
  const surfZ = (x, y) => domeLift(x, y, surfNoDome(x, y));
  const zRimE = P.Re * Math.cos(P.irisAng);
  mark('setup');

  // ---- pele: cabeça + pescoço numa malha só ----
  {
    const LON = Math.round(300 * Q), LAT = Math.round(320 * Q), WARP = .5, W = LON + 1;
    const [, nty, ntz, nby, nbz] = P.neck, Cy = -.02, Cz = -.1, yBot = nby + .12;
    const TA = .76, TB = .93, thA = 150 * Math.PI / 180, thH = Math.PI / 2 * 1.04;
    const NS = 600, cdf = new Float64Array(NS + 1);
    for (let i = 1; i <= NS; i++) { const th = thA * (i - .5) / NS; cdf[i] = cdf[i - 1] + .45 + 1.0 * sstep(.75, 1.2, th) * (1 - sstep(2.35, 2.6, th)) }
    const invTh = s => { const tg = s * cdf[NS]; let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < tg) lo = m; else hi = m } return thA * (lo + (tg - cdf[lo]) / ((cdf[hi] - cdf[lo]) || 1)) / NS };
    const axisZ = y => y > nty ? Cz + (ntz - Cz) * clamp((Cy - y) / (Cy - nty), 0, 1) : ntz + (nbz - ntz) * clamp((nty - y) / (nty - nby), 0, 1);
    const sinP = new Float64Array(W), cosP = new Float64Array(W);
    for (let ix = 0; ix < W; ix++) { const lon = -Math.PI + 2 * Math.PI * ix / LON, ph = lon - WARP * Math.sin(lon); sinP[ix] = Math.sin(ph); cosP[ix] = Math.cos(ph) }
    const N = W * (LAT + 1), pos = new Float32Array(N * 3), colors = new Float32Array(N * 3), gloss = new Float32Array(N), state = new Uint8Array(N);
    const c = new THREE.Color(); let rowGuess = 0;
    for (let iy = 0; iy <= LAT; iy++) {
      const t = iy / LAT; let oy, oz, th, face = false;
      if (t <= TA) { oy = Cy; oz = Cz; th = invTh(t / TA); face = true }
      else if (t <= TB) { const s = (t - TA) / (TB - TA); oy = Cy + (yBot - Cy) * s; oz = axisZ(oy); th = thA + (thH - thA) * sstep(0, 1, s) }
      else { const s = (t - TB) / (1 - TB); oy = yBot; oz = axisZ(oy); th = thH + (Math.PI - thH) * s }
      const sth = Math.sin(th), cth = Math.cos(th); let guess = rowGuess;
      for (let ix = 0; ix < W; ix++) {
        const i = iy * W + ix, dx = sth * sinP[ix], dy = cth, dz0 = sth * cosP[ix];
        const sHit = traceOut(sdf, 0, oy, oz, dx, dy, dz0, guess); guess = sHit; if (ix === 0) rowGuess = sHit;
        let x = dx * sHit, y = oy + dy * sHit, z = oz + dz0 * sHit;
        const wf = face ? sstep(.05, .5, cosP[ix]) * (1 - sstep(.3, .7, -cth) * sstep(.75, .4, cosP[ix])) : 0;
        let f = null, eyeState = 0;
        if (wf > 0) { f = field(x, y); z += f.dz * wf }
        let lifted = false; const lwF = sstep(.3, .8, cosP[ix]);
        if (wf > .9) for (const e of eyes) {
          const [U, V] = e.local(x, y), uN = U / e.halfW;
          if (Math.abs(uN) >= 1 || Math.abs(V) > .24) continue;
          const Hh = e.H(uN, V >= 0), vN = Hh > 1e-4 ? Math.abs(V) / Hh : 9;
          if (vN >= 1 && vN < 1.32 && Math.abs(uN) < .985 && Hh > .002) { // vértice vai exatamente para a borda da pálpebra
            const [x2, y2] = e.toHead(U, Math.sign(V || 1) * Hh); x = x2; y = y2;
            f = field(x, y); z = frontZ(x, y) + f.dz; eyeState = 2;
          }
          z = domeLift(x, y, z, lwF); lifted = true;
          if (vN < 1 && Math.abs(uN) < .985 && Hh > .002) { // interior: escondido atrás do globo e da íris
            if (Hh - Math.abs(V) < .013) { const [x2, y2] = e.toHead(U, Math.sign(V || 1) * Hh); x = x2; y = y2 } // fileira junto à borda vira "parede" sob a pálpebra (sem degraus)
            const r2 = (x - e.ex) ** 2 + (y - e.ey) ** 2; z = e.zc + Math.min(sqrt(Math.max(P.Re * P.Re - r2, 0)) - .016, zRimE - .03); eyeState = 1;
          }
          break;
        }
        if (wf > 0 && !lifted) z = domeLift(x, y, z, lwF);
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; state[i] = eyeState;
        // cor
        c.copy(skin);
        if (f) {
          const k = wf;
          c.lerp(skinHi, clamp(f.hi * k * .4, 0, .5));
          c.lerp(blush, clamp(f.blush * k * .5, 0, .55));
          c.lerp(lidC, clamp(f.lid * k * P.lidShade * .55, 0, .5));
          c.lerp(shade, clamp(f.ao * k * .5, 0, .6));
          c.lerp(lipUC, clamp(f.lipU * k, 0, 1));
          c.lerp(lipC, clamp(f.lipL * k, 0, 1));
          c.lerp(lipHiC, clamp(f.lipHi * f.lipL * k * .45, 0, 1));
          c.lerp(lineC, clamp(f.line * k * .9, 0, 1));
          c.lerp(nostrilC, clamp(f.nostril * k * .85, 0, .85));
          gloss[i] = clamp(f.gloss * k, 0, 1);
        }
        if (eyeState === 2) c.lerp(blush, .22);
        if (eyeState === 1) c.copy(deep);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
    }
    mark('loop');
    const idx = new Uint32Array(LON * LAT * 6); let o = 0;
    for (let iy = 0; iy < LAT; iy++) for (let ix = 0; ix < LON; ix++) {
      const a = iy * W + ix, b = a + 1, cc = a + W, d = cc + 1;
      idx[o++] = a; idx[o++] = cc; idx[o++] = b; idx[o++] = b; idx[o++] = cc; idx[o++] = d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    const nr = geo.attributes.normal;
    { // costura e polos: normais unificadas
      const v = new THREE.Vector3();
      for (let iy = 1; iy < LAT; iy++) { const a = iy * W, b = a + LON; v.set(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize(); nr.setXYZ(a, v.x, v.y, v.z); nr.setXYZ(b, v.x, v.y, v.z) }
      for (const iy of [0, LAT]) { v.set(0, 0, 0); for (let ix = 0; ix < W; ix++) v.x += nr.getX(iy * W + ix), v.y += nr.getY(iy * W + ix), v.z += nr.getZ(iy * W + ix); v.normalize(); for (let ix = 0; ix < W; ix++) nr.setXYZ(iy * W + ix, v.x, v.y, v.z) }
    }
    fixNormals(geo); mark('normals');
    { // oclusão por cavidade (duas escalas) + sombra sob a mandíbula
      const cc = new THREE.Color(), cav = (i, j, k) => {
        const jl = (j - k + LON) % LON, jr = (j + k) % LON, iu = Math.max(i - k, 0), id = Math.min(i + k, LAT);
        const p = i * W + j, A = [i * W + jl, i * W + jr, iu * W + j, id * W + j];
        let ax = 0, ay = 0, az = 0; for (const q of A) { ax += pos[q * 3]; ay += pos[q * 3 + 1]; az += pos[q * 3 + 2] }
        return (ax / 4 - pos[p * 3]) * nr.getX(p) + (ay / 4 - pos[p * 3 + 1]) * nr.getY(p) + (az / 4 - pos[p * 3 + 2]) * nr.getZ(p);
      };
      const s1 = Math.max(1, Math.round(3 * Q)), s2 = Math.max(2, Math.round(9 * Q));
      for (let i = 1; i < LAT; i++) for (let j = 0; j < W; j++) {
        const p = i * W + j; if (state[p] === 1) continue;
        const c1 = cav(i, j % LON, s1), c2 = cav(i, j % LON, s2);
        const dark = .3 * sstep(.0005, .005, c1) + .4 * sstep(.002, .016, c2), dn = sstep(-.3, -.85, nr.getY(p)) * .35;
        const lite = .1 * sstep(-.002, -.008, c1);
        if (dark + dn + lite > .003) {
          cc.fromArray(colors, p * 3).lerp(shade, clamp(dark + dn, 0, .7)).lerp(skinHi, lite); cc.toArray(colors, p * 3);
        }
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.setAttribute('gloss', new THREE.BufferAttribute(gloss, 1));
    const head = new THREE.Mesh(track(geo), skinMat); head.name = 'Head_Skin'; root.add(head);
  }
  mark('head');

  const normalAt = (x, y) => {
    const e = .004, dzx = (surfZ(x + e, y) - surfZ(x - e, y)) / (2 * e), dzy = (surfZ(x, y + e) - surfZ(x, y - e)) / (2 * e);
    return new THREE.Vector3(-dzx, -dzy, 1).normalize();
  };

  // ---- orelhas ----
  {
    const eS = P.earS, yE = P.eyeY - .1, zE = -.1;
    let xs = 1.3; for (let k = 0; k < 60; k++) { const d = sdf(xs, yE, zE); if (d < 1e-4) break; xs -= d * .9 }
    // concha única: elipsoide achatado, face externa escavada (cavidade + anti-hélice), borda grossa = hélice, lóbulo cheio
    const H = .225 * eS, Wd = .13 * eS, T = .05 * eS, shell = new THREE.SphereGeometry(1, 72, 56), sp = shell.attributes.position, depth = new Float32Array(sp.count);
    for (let i = 0; i < sp.count; i++) {
      const ux = sp.getX(i), uy = sp.getY(i), uz = sp.getZ(i), r = Math.min(1, Math.hypot(uy, uz));
      const lobe = sstep(-.5, -.82, uy), dish = (1 - sstep(.6, .9, r)) * (1 - lobe);
      const anti = gau(r - .56, .11) * sstep(-.35, .15, uy) * (1 - lobe), concha = gau(uy + .12, .3) * gau(uz - .15, .32) * dish;
      const dd = ux > 0 ? ux * (1.0 * dish - .45 * anti + .45 * concha) : 0;
      const wz = Wd * (.7 + .3 * sstep(-.95, .15, uy));
      sp.setXYZ(i, (ux - dd) * T + T * .45 + .012 * eS * sstep(.2, 1, -uz) * (1 - lobe), uy * H, uz * wz - .03 * eS * uy);
      depth[i] = dd;
    }
    shell.computeVertexNormals();
    const parts = [setColors(shell, (c, x, y, z, i) => c.copy(skin).lerp(blush, .28).lerp(shade, clamp(depth[i] * .45, 0, .5)))];
    const tr = new THREE.SphereGeometry(1, 20, 14); tr.scale(.018 * eS, .03 * eS, .02 * eS); tr.translate(T * .9, -.045 * eS, Wd * .82); // trago
    parts.push(setColors(tr, c => c.copy(skin).lerp(blush, .25)));
    const geoR = mergeGeos(parts);
    for (const s of [-1, 1]) {
      const g = s > 0 ? geoR : mirrorX(geoR);
      const m = new THREE.Mesh(track(g), skinMat); m.name = 'Ear_' + (s < 0 ? 'L' : 'R');
      m.position.set(s * (xs + .018 * eS), yE, zE); m.rotation.set(0, s * -.2, s * .08); root.add(m);
    }
  }

  // ---- sobrancelhas ----
  const browMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, name: 'Brow' }));
  const browC = col(P.brow), browSoft = browC.clone().lerp(skin, .45);
  for (const e of eyes) {
    const s = e.s, N = 34, pts = [], rw = [], rh = [];
    const x0 = P.eyeX - e.halfW * .98, x1 = P.eyeX + e.halfW * 1.18 * P.browLen, by = P.eyeY + P.browGap;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = x0 + (x1 - x0) * t, pk = P.browPeak;
      const arch = P.browArch * (1 - Math.pow((t - pk) / (t < pk ? pk : 1 - pk), 2)) - P.browArch * .45;
      const y = by + arch + P.browSlope * (t - .3) * 3 - (t > .85 ? (t - .85) * .12 : 0) - .012 * (1 - sstep(0, .2, t));
      pts.push(new THREE.Vector3(s * x, y, surfZ(s * x, y) + .006));
      const taper = Math.sqrt(sstep(0, .06, t)) * (1 - .8 * sstep(.45, 1, t)) * (.85 + .15 * Math.sin(Math.PI * t));
      rw.push(P.browTh * taper); rh.push(P.browTh * taper * .32);
    }
    const g = ribbon(pts, rw, rh, (i, p) => normalAt(p.x, p.y), 12);
    setColors(g, (c, x, y, z, i) => { const t = Math.floor(i / 12) / (N - 1); c.copy(browC).lerp(browSoft, .55 * (1 - sstep(.04, .22, t))) });
    const m = new THREE.Mesh(track(g), browMat); m.name = 'Brow_' + (s < 0 ? 'L' : 'R'); root.add(m);
  }

  // ---- olhos ----
  const scleraMat = track(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, clearcoat: .5, clearcoatRoughness: .25, name: 'Sclera' }));
  const irisTex = track(irisTexture(P.iris, .3));
  const irisMat = track(new THREE.MeshPhysicalMaterial({ map: irisTex, roughness: .55, name: 'Iris' }));
  const corneaMat = track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .12, roughness: .03, clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1, depthWrite: false, name: 'Cornea' }));
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, name: 'Catchlight' }));
  const lashMat = track(new THREE.MeshStandardMaterial({ color: col(P.liner), roughness: .55, name: 'Lash' }));
  const lowLashMat = track(new THREE.MeshStandardMaterial({ color: col(P.liner).lerp(skin, .45), roughness: .7, name: 'LowerLash' }));
  const carMat = track(new THREE.MeshStandardMaterial({ color: col('#d98b86'), roughness: .35, name: 'Caruncle' }));
  const Re = P.Re, ia = P.irisAng, rIris = Re * Math.sin(ia), zRim = Re * Math.cos(ia);

  for (const e of eyes) {
    const s = e.s, grp = new THREE.Group(); grp.name = 'Eye_' + (s < 0 ? 'L' : 'R');
    grp.position.set(e.ex, e.ey, e.zc);
    grp.lookAt(0, e.ey, e.zc + 4.5); // leve convergência: os dois olhos olham para o mesmo ponto
    const sg = new THREE.SphereGeometry(Re, 64, 44, 0, Math.PI * 2, ia * .985, Math.PI - ia * .985); sg.rotateX(Math.PI / 2);
    setColors(sg, (c, x, y, z) => {
      const dx = x / Re, dy = y / Re, dz = z / Re;
      c.set('#efe5dc').multiplyScalar(1 - .42 * sstep(-.1, .7, dy) - .3 * Math.pow(1 - clamp(dz, 0, 1), 2));
      c.lerp(col('#d9a29a'), .5 * sstep(.55, .95, Math.abs(dx)));
    });
    const sclera = new THREE.Mesh(track(sg), scleraMat); sclera.name = 'Sclera'; grp.add(sclera);
    // íris côncava (lente) sob a córnea
    const ig = new THREE.RingGeometry(1e-4, rIris * 1.002, 72, 12);
    { const p = ig.attributes.position, uv = ig.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y) / rIris;
        p.setZ(i, zRim + .002 - .022 * Re * (1 - r * r));
        const a = Math.atan2(-y, -x); uv.setXY(i, ((a / (2 * Math.PI)) % 1 + 1) % 1, 1 - r); // u≈.25 em baixo, v=1 na pupila
      }
      ig.computeVertexNormals(); fixNormals(ig); }
    const iris = new THREE.Mesh(track(ig), irisMat); iris.name = 'Iris'; grp.add(iris);
    const cg = new THREE.SphereGeometry(Re * 1.004, 56, 18, 0, Math.PI * 2, 0, ia * 1.3); cg.rotateX(Math.PI / 2);
    { const p = cg.attributes.position, rc = Re * Math.sin(ia * 1.3); for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)) / rc; p.setZ(i, p.getZ(i) + .016 * Re / .25 * Math.max(0, 1 - r * r)) } cg.computeVertexNormals(); fixNormals(cg) }
    const cornea = new THREE.Mesh(track(cg), corneaMat); cornea.renderOrder = 3; cornea.name = 'Cornea'; grp.add(cornea);
    const spark = (lon, lat, r, sq) => {
      const R = Re * 1.06, p = new THREE.Vector3(R * Math.sin(lon) * Math.cos(lat), R * Math.sin(lat), R * Math.cos(lon) * Math.cos(lat));
      const g = new THREE.CircleGeometry(r, 28); g.scale(1, sq, 1);
      const m = new THREE.Mesh(track(g), catchMat); m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); m.renderOrder = 4; m.name = 'Catchlight'; grp.add(m);
    };
    spark(-s * .2 - .12, .24, .03 * Re / .25, .85); spark(s * .17 - .04, -.24, .012 * Re / .25, .8);
    root.add(grp);

    // carúncula (canto interno)
    { const [x, y] = e.toHead(-e.halfW * .9, -e.hl * .05), r2 = (x - e.ex) ** 2 + (y - e.ey) ** 2;
      const g = new THREE.SphereGeometry(1, 20, 14); g.scale(.026 * Re / .25, .02 * Re / .25, .014);
      const m = new THREE.Mesh(track(g), carMat); m.position.set(x, y, e.zc + sqrt(Math.max(Re * Re - r2, 0)) - .004); m.name = 'Caruncle'; root.add(m) }

    const edgePt = (uN, up, dv = 0) => { const [x, y] = e.toHead(uN * e.halfW, (up ? 1 : -1) * (e.H(uN, up) + dv)); return new THREE.Vector3(x, y, surfZ(x, y) + .002) };
    const radial = (i, p) => normalAt(p.x, p.y);
    { // borda inferior (linha d'água) em tom de pele
      const n = 44, pts = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n; pts.push(edgePt(u, false)); rw.push(.0055 * Math.pow(Math.sin(Math.PI * i / n), .5) + .001) }
      const g = ribbon(pts, rw, rw, radial, 8); setColors(g, c => c.copy(skin).lerp(blush, .3));
      const m = new THREE.Mesh(track(g), skinMat); m.name = 'Lid_Rim_' + (s < 0 ? 'L' : 'R'); root.add(m);
    }
    if (P.lowerLash > 0) { // cílio inferior discreto na metade externa
      const n = 30, pts = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -.15 + 1.1 * i / n; pts.push(edgePt(Math.min(u, .97), false, .007)); rw.push(.0042 * P.lowerLash * Math.pow(Math.sin(Math.PI * i / n), .7) + .0004) }
      const m = new THREE.Mesh(track(ribbon(pts, rw, rw.map(r => r * .6), radial, 6)), lowLashMat); m.name = 'LowerLash_' + (s < 0 ? 'L' : 'R'); root.add(m);
    }
    const lashGeos = [];
    { // linha de cílios superior (delineado) com asa no canto externo
      const n = 48, list = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n, w = P.lash * (.2 + .8 * sstep(-1, .55, u)); list.push(edgePt(u, true, w * .45)); rw.push(w) }
      if (P.flick > 0) {
        const [xa, ya] = e.toHead(e.halfW * .98, e.H(.98, true)), dir = new THREE.Vector2(.82, .57).normalize();
        for (let k = 1; k <= 8; k++) { const t = k / 8, U = e.halfW + P.flick * t * dir.x, V = e.H(.98, true) * .4 + P.flick * t * dir.y + P.lash * .3, [x, y] = e.toHead(U, V); list.push(new THREE.Vector3(x, y, surfZ(x, y) + .003)); rw.push(P.lash * (1 - t * .95)) }
      }
      rw[0] = .0006; rw[rw.length - 1] = .0004;
      lashGeos.push(ribbon(list, rw, rw.map(r => r * .55), radial, 10));
    }
    for (let k = 0; k < P.lashN; k++) { // tufos de cílios: mais longos e inclinados para fora no canto externo
      const t = (k + .5) / P.lashN, uu = Math.min(-.3 + 1.26 * Math.pow(t, .8), .96), base = edgePt(uu, true, P.lash * .5);
      const nrm = normalAt(base.x, base.y), tang = edgePt(Math.min(uu + .03, .995), true, P.lash * .5).sub(base).normalize();
      const up = new THREE.Vector3(-Math.sin(s * P.tilt), Math.cos(P.tilt), 0);
      const L = P.lashLen * (.4 + .6 * sstep(-.4, .85, uu)) * (1 + .1 * Math.sin(k * 2.7)), lean = .1 + .8 * t * t;
      const pts = [], rw = [], rh = [];
      for (let j = 0; j <= 10; j++) {
        const a = j / 10;
        pts.push(base.clone().addScaledVector(nrm, L * (.62 * a - .3 * a * a)).addScaledVector(up, L * (.12 * a + .62 * a * a)).addScaledVector(tang, L * lean * a * (.5 + .5 * a)));
        const r = Math.pow(1 - a, .85); rw.push(.0068 * Re / .25 * r + .0003); rh.push(.0024 * r + .0002);
      }
      lashGeos.push(ribbon(pts, rw, rh, () => nrm, 6));
    }
    { const m = new THREE.Mesh(track(mergeGeos(lashGeos)), lashMat); m.name = 'Lashes_' + (s < 0 ? 'L' : 'R'); root.add(m) } // delineado + tufos numa malha
  }

  // ---- linha da boca: traço fino no fundo do sulco ----
  {
    const N = 40, pts = [], rw = [], mw = P.mouthW;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = (t * 2 - 1) * mw * 1.02, ax = Math.abs(x), tt = Math.min(ax / mw, 1.25);
      const y = P.mouthY + P.smile * .04 * tt * tt - .004 * gau(ax, .03);
      pts.push(new THREE.Vector3(x, y, surfZ(x, y) + .0015)); rw.push(.0038 * Math.pow(Math.sin(Math.PI * t), .5));
    }
    const mat = track(new THREE.MeshStandardMaterial({ color: col(P.lipLine), roughness: .6, name: 'MouthLine' }));
    const m = new THREE.Mesh(track(ribbon(pts, rw, rw.map(r => r * .7), () => new THREE.Vector3(0, 0, 1), 8)), mat); m.name = 'Mouth_Line'; root.add(m);
  }

  root.traverse(o => { if (o.isMesh) { const transp = o.material.transparent; o.castShadow = !transp && o.name !== 'Catchlight'; o.receiveShadow = !transp } });
  mark('total'); root.userData.params = P; root.userData.timings = marks;
  const dispose = () => { root.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose() }); disposables.forEach(d => d.dispose && d.dispose()) };
  return { group: root, dispose, params: P };
}
