// Corpo inteiro da Head V2 — só a malha (sem roupa, sem acessórios, sem genitais), em pose A.
//
// Forma: campo de distância (SDF) com volumes fundidos por união suave:
//  - tronco por curvas (largura, frente e costas por altura, como a casca do rosto): trapézio, peito, costelas,
//    cintura, barriga, quadril; seios (mulheres adultas), peitoral, barriga, glúteos por personagem;
//  - pescoço que continua o pescoço da cabeça (as duas superfícies se cruzam por dentro, sem degrau);
//  - braços (deltoide, bíceps, antebraço), mãos com palma, 4 dedos de 3 falanges e polegar;
//  - pernas (coxa, joelho, panturrilha), pés com calcanhar, arco e dedos arredondados; virilha lisa.
// Malha: "surface nets" esparso — só os blocos perto da superfície são avaliados (rápido e leve), vértices
// projetados na superfície, normais suaves. Cor por vértice a partir da pele do personagem.
import * as THREE from 'three';
import {FRONTIER_CHARACTERS} from './frontier.js';
import {FOREST_CHARACTERS} from './forest.js';

const { clamp } = THREE.MathUtils;
const sqrt = Math.sqrt;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const smax = (a, b, k) => -smin(-a, -b, k);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), DEG = Math.PI / 180;

// ---------- primitivas ----------
function roundCone(px, py, pz, a, ra, b, rb) {
  const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z, l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pax = px - a.x, pay = py - a.y, paz = pz - a.z, y = pax * bax + pay * bay + paz * baz, z = y - l2;
  const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y, x2 = qx * qx + qy * qy + qz * qz, y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - rb;
  if (Math.sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - ra;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
}
// Os pontos e raios não mudam durante a malhagem: prepara os coeficientes só uma vez.
function coneField(a, ra, b, rb) {
  const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z, l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (px, py, pz) => {
    const pax = px - a.x, pay = py - a.y, paz = pz - a.z, y = pax * bax + pay * bay + paz * baz, z = y - l2;
    const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y, x2 = qx * qx + qy * qy + qz * qz, y2 = y * y * l2, z2 = z * z * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - rb;
    if (Math.sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - ra;
    return (sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
  };
}
function ellip(px, py, pz, c, rx, ry, rz) {
  const x = (px - c.x) / rx, y = (py - c.y) / ry, z = (pz - c.z) / rz, k0 = sqrt(x * x + y * y + z * z);
  const k1 = sqrt(x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz)); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}
// elipsoide orientado (base u, v, w)
function ellipO(px, py, pz, c, u, v, w, ru, rv, rw) {
  const dx = px - c.x, dy = py - c.y, dz = pz - c.z, a = dx * u.x + dy * u.y + dz * u.z, b = dx * v.x + dy * v.y + dz * v.z, e = dx * w.x + dy * w.y + dz * w.z;
  const x = a / ru, y = b / rv, z = e / rw, k0 = sqrt(x * x + y * y + z * z), k1 = sqrt(x * x / (ru * ru) + y * y / (rv * rv) + z * z / (rw * rw)); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(ru, rv, rw);
}
// curva monotônica suave (Hermite) por pontos
function curve(xs, vs) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return x => {
    if (x <= xs[0]) return vs[0]; if (x >= xs[n - 1]) return vs[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------- tipos de corpo por personagem ----------
// heads: altura total em "cabeças"; W: largura geral; sh/chest/waist/hip: multiplicadores; breasts: tamanho (0 = sem);
// belly: barriga; muscle: musculatura; glute; arm/hand/foot/leg: proporções; hunch: corcunda leve
const BASE = { heads: 6, W: 1, sh: 1, chest: 1, waist: 1, hip: 1, depth: 1, breasts: 0, belly: 0, muscle: 0, glute: 1, arm: 1, hand: 1, foot: 1, leg: 1, hunch: 0, fingers: 5, aPose: 52 };
export const BODIES = {
  feminine_soft: { head: .8, heads: 5.9, breasts: 1, waist: .93, hip: 1.0, sh: .94, glute: .95 },
  feminine_bold: { head: .8, heads: 6, breasts: 1.12, waist: .91, hip: 1.04, sh: .96, glute: 1.0 },
  cute_round: { head: .7, neckUp: .3, heads: 3.4, W: .8, sh: .92, waist: 1.0, hip: .88, belly: .18, arm: 1.12, hand: 1.35, foot: 1.35, leg: .92, glute: .8 },
  masculine_soft: { head: 1.0, heads: 6.4, W: 1.12, sh: 1.28, chest: 1.12, waist: .98, hip: .9, depth: 1.08, muscle: .55, glute: .85, hand: 1.08, foot: 1.08 },
  old_king: { head: .78, heads: 6.1, W: 1.14, sh: 1.22, chest: 1.08, waist: 1.12, hip: .95, depth: 1.1, belly: .55, muscle: .25, glute: .85, hand: 1.08, foot: 1.08 },
  alchemist_villain: { head: 1.22, heads: 6.6, W: .8, sh: 1.08, chest: .95, waist: .82, hip: .86, hunch: .18, glute: .6, hand: 1.18, arm: 1.06 },
  dwarf_bard: { head: .7, neckUp: .22, heads: 3.9, W: 1.3, sh: 1.12, chest: 1.1, waist: 1.15, hip: 1.0, depth: 1.15, belly: .55, muscle: .2, leg: .82, arm: .95, hand: 1.25, foot: 1.25 },
  sad_clown: { head: .86, neckUp: .22, heads: 4.7, W: 1.2, sh: .98, chest: 1.05, waist: 1.4, hip: 1.28, depth: 1.25, belly: 1.25, glute: 1.1, hand: 1.2, foot: 1.4 },
  orc_warrior: { head: 1.1, heads: 6.3, W: 1.55, sh: 1.42, chest: 1.28, waist: 1.08, hip: .95, depth: 1.18, muscle: 1, glute: .95, hand: 1.3, foot: 1.25, arm: 1.05 },
  cactus_cowboy: { head: .85, heads: 5.2, W: 1.55, sh: .85, chest: .9, waist: .88, hip: .85, depth: .9, glute: .3, cactus: true, fingers: 4, arm: 1.05, hand: .85 },
  // vegetais com corpo humanoide vermelho (referências): rei pimentão baixo e robusto, pimenta esguia e definida
  pepper_king: { head: 1.0, neckUp: .6, heads: 3.5, W: 1.08, sh: 1.05, chest: 1.08, waist: 1.1, hip: 1.0, depth: 1.08, belly: .35, muscle: .2, leg: .86, arm: .98, hand: 1.18, foot: 1.6, glute: .8, vegSkin: true },
  chili_bandit: { head: .95, neckUp: .42, heads: 4.3, W: .92, sh: 1.14, chest: 1.02, waist: .92, hip: .8, depth: .95, muscle: .65, arm: 1.08, hand: 1.18, leg: 1.04, glute: .7, vegSkin: true }
};

// Novas identidades reaproveitam as proporções aprovadas; apenas o Nico usa a base infantil sem seios.
BODIES.nana_explorer = {...BODIES.feminine_bold};
BODIES.moon_guardian = {...BODIES.feminine_soft};
BODIES.nico_inventor = {...BODIES.cute_round};
BODIES.ruby_sorceress = {...BODIES.feminine_bold};

for(const c of FOREST_CHARACTERS)BODIES[c.id]={...BODIES[c.body]};

// Silhuetas próprias das novas referências; as treze bases anteriores permanecem imutáveis.
for(const id of ['forest_archer_f','forest_guard_f'])BODIES[id]={...BODIES[id],head:.95,heads:5.55,W:.88,sh:.91,chest:.94,waist:.91,hip:1,arm:1.03,leg:.96};
BODIES.forest_archer_f={...BODIES.forest_archer_f,W:.94,sh:.98,chest:.98,waist:.98,neckUp:.27};
for(const id of ['moon_guardian','ruby_sorceress','forest_princess'])BODIES[id]={...BODIES[id],head:.95,heads:5.65,W:.87,sh:.91,chest:.95,waist:.90,hip:1,leg:.97};
BODIES.nana_explorer={...BODIES.nana_explorer,head:1,heads:5.1,neckUp:.27,neckBase:1.05,W:.96,sh:1,chest:.98,waist:.88,hip:1.04,hand:1.08,foot:1.15,leg:.97};
BODIES.nico_inventor={...BODIES.nico_inventor,head:.74,heads:3.50,neckUp:.44,W:.70,sh:.94,chest:.91,waist:.91,hip:.90,depth:.90,belly:.025,arm:1.02,hand:1.03,foot:1.15,leg:.97};

for(const c of FRONTIER_CHARACTERS)BODIES[c.id]={...BODIES[c.body],...(c.large?{W:1.95,heads:6.1,sh:1.02,arm:1.18,hand:1.08}: {})};
// Duas roupas do mesmo jovem: escala e anatomia permanecem idênticas entre as skins.
for(const id of ['bread_baker','bread_vigilante'])BODIES[id]={...BODIES.masculine_soft,head:1,heads:5.7,neckUp:.24,W:1.04,sh:1.14,chest:1.04,muscle:.32,hand:1.12,foot:1.18};
// Silhueta própria somente das novas skins: coluna compacta, ombros largos e extremidades robustas.
const DESERT_CACTUS = {head:1,heads:3.15,W:1.08,sh:.92,chest:1,waist:.97,hip:.88,depth:1.15,belly:.2,muscle:.18,glute:.15,cactus:true,fingers:4,arm:.92,hand:1.65,foot:1.8,leg:.85,aPose:48};
BODIES.flame_guardian={...BODIES.masculine_soft,heads:5.8,head:1,W:1.12,sh:1.25,chest:1.12};
BODIES.frontier_cowboy={...DESERT_CACTUS};
BODIES.cactus_soldier={...DESERT_CACTUS,sh:1.03,chest:1.08,muscle:.35,hand:1.8};
BODIES.cactus_soldier_large={...DESERT_CACTUS,head:1,heads:3.65,W:1.52,sh:1.12,chest:1.15,waist:1.1,hip:1.02,depth:1.16,belly:.32,muscle:.5,arm:.98,hand:1.8,foot:1.8};

// escala da cabeça com corpo (a cabeça é desenhada grande para o close do rosto; no corpo inteiro ela diminui)
export const headScale = id => (BODIES[id] && BODIES[id].head) || 1;
// O quadro de corpo inteiro conserva espaço acima da criança. O zoom automático
// não deve apresentar Nico com a mesma altura aparente das figuras adultas.
export const bodyViewHeight = (id,height) => ['nico_inventor','frontier_cowboy','cactus_soldier','cactus_soldier_large'].includes(id)?Math.max(height,8.2):height;

// Valores normalizados também identificam os caches; NaN e valores fora da faixa não chegam à geometria.
export function normalizeBuild(build = {}) {
  const number = (value, lo, hi) => Number.isFinite(Number(value)) ? clamp(Number(value), lo, hi) : 0;
  return { weight: number(build?.weight, -1, 1), muscle: number(build?.muscle, 0, 1) };
}
function buildProportions(base, build) {
  const { weight: w, muscle: m } = build, thin = Math.max(0, -w), fat = Math.max(0, w);
  return { ...base,
    sh: base.sh - .08 * thin + .08 * fat + .20 * m,
    chest: base.chest - .12 * thin + .12 * fat + .22 * m,
    waist: base.waist - .26 * thin + .38 * fat - .08 * m,
    hip: base.hip - .16 * thin + .24 * fat,
    depth: base.depth - .10 * thin + .16 * fat,
    belly: Math.max(0, base.belly * (1 - .75 * thin) + .95 * fat - .15 * m),
    muscle: base.muscle + .85 * m,
    glute: Math.max(.1, base.glute - .12 * thin + .20 * fat + .06 * m),
    armWidth: 1 - .24 * thin + .30 * fat + .10 * m,
    legWidth: 1 - .21 * thin + .28 * fat + .08 * m
  };
}

// ---------- SDF do corpo ----------
function makeBodySDF(fit, presetId, hs = 1, mermaid = false, build = normalizeBuild()) { // hs: escala da cabeça (a cabeça diminui em volta da base do pescoço; o corpo não muda)
  const P = fit.P, original = { ...BASE, ...(BODIES[presetId] || {}) }, B = buildProportions(original, build);
  const fat = Math.max(0, build.weight), thin = Math.max(0, -build.weight);
  const desertCactus=['frontier_cowboy','cactus_soldier','cactus_soldier_large'].includes(presetId);
  const prims = []; // { f(x,y,z) com x ≥ 0 (corpo simétrico), b: esfera envolvente, k }
  const add = (f, b, k) => prims.push({ f, b, k });
  const bs = (c, r) => ({ x: c.x, y: c.y, z: c.z, r });
  const chinY = P.lathe ? P.lathe.y[0] : P.loft.y[0], H = fit.top - Math.max(chinY, -1.2);
  const [nr, nty, ntz, nby, nbz] = P.neck;
  const joints = {}, W = B.W;
  if (B.veg) return makeVegSDF(fit, B, prims, add, bs, joints);

  const yN = nby + .02 + (B.neckUp ?? .1), ySole = fit.top - B.heads * H, Lb = yN - ySole, z0 = nbz + .02;
  const Y = f => yN - f * Lb;
  joints.ySole = ySole; joints.Lb = Lb; joints.yNeck = yN; joints.zCenter = z0;

  // ---- pescoço: continua o da cabeça (mesma seção oval), alargando para dentro do trapézio ----
  { const a = V(0, nby + .26 * hs, nbz - .02 * hs), b = V(0, nby - .1, nbz - .06), r1 = nr * hs * (desertCactus?1.02:1.14), r2 = nr * (.3 + .7 * hs) * (B.neckBase||1) * (desertCactus?1.1:(1.24 + .22 * fat + .16 * build.muscle));
    const neckField=coneField(a,r1,b,r2);
    // Nas colunas novas, a tampa fica dentro da cabeça: uma esfera de pescoço não pode aflorar pelo rosto.
    add((x, y, z) => desertCactus?Math.max(neckField(x*1.03,y,nbz+(z-nbz)/.88)*.92,y-(nby+.08*hs)):neckField(x * 1.14, y, z) * .92, bs(V(0, nby, nbz), .8), .1);
    const radius=Math.max(r1,r2),loY=Math.min(a.y,b.y)-radius,hiY=Math.max(a.y,b.y)+radius,loZ=Math.min(a.z,b.z)-radius,hiZ=Math.max(a.z,b.z)+radius;
    prims[0].lower=(x,y,z)=>.92*Math.max(Math.abs(x*(desertCactus?1.03:1.14))-radius,loY-y,y-hiY,loZ-z,z-hiZ);
  }

  // ---- tronco por curvas ----
  const M = { sh: B.sh, ch: B.chest, wa: B.waist, hi: B.hip }, mu = B.muscle, bel = B.belly;
  //          f      meia-largura                      frente                          costas
  const rows = [
    [0.000, .42 * (nr * hs / .35),                  .06,                              -.34],
    [0.035, .72 * M.sh,                         .3 + .04 * mu,                    -.46 - .06 * mu],
    [0.085, .96 * M.sh,                         .36 + .06 * mu,                   -.5 - .06 * mu],
    [0.150, .93 * M.ch,                         .38 + .07 * mu + .03 * bel,       -.5],
    [0.225, .80 * (M.ch + M.wa) / 2,            .35 + .12 * bel,                  -.45],
    [0.300, .64 * M.wa,                         .3 + .25 * bel,                   -.39],
    [0.370, .74 * (M.wa + M.hi) / 2,            .33 + .26 * bel,                  -.41],
    [0.430, .95 * M.hi,                         .32 + .12 * bel,                  -.48],
    [0.470, .8 * M.hi,                          .2,                               -.38],
    [0.505, .34 * M.hi,                         .02,                              -.16]
  ];
  const fA = curve(rows.map(r => r[0]), rows.map(r => r[1] * W)), fF = curve(rows.map(r => r[0]), rows.map(r => r[2] * W * B.depth)), fB = curve(rows.map(r => r[0]), rows.map(r => r[3] * W * B.depth));
  const hunchZ = f => -B.hunch * sstep(.0, .2, f) * (1 - sstep(.2, .45, f)) * .9;
  // Medidas do tronco para a vinculação: barrigas largas não pertencem aos braços.
  joints.torsoAt=y=>{const f=(yN-y)/Lb,t=clamp(f,0,.505),front=fF(t),back=fB(t);return {rx:Math.max(.05,fA(t)),rz:Math.max(.05,(front-back)/2),z:z0+(front+back)/2+hunchZ(t)}};
  const tTop = 0, tBot = .505, torsoB = bs(V(0, Y(.25), z0), Lb * .3 + 1.2 * W);
  const cactus = !!B.cactus, PT = cactus && P.pattern;
  let sectionY=NaN,sectionA,sectionZ,sectionH,sectionRib=0;
  add((x, y, z) => {
    const f = (yN - y) / Lb; if (f < tTop - .2 || f > tBot + .2) return Math.max(Math.abs(f - .25) * Lb - .3 * Lb, .05);
    if(y!==sectionY){
      const ff=clamp(f,tTop,tBot),zf=fF(ff),zb=fB(ff);
      sectionY=y;sectionA=Math.max(fA(ff),.05);sectionZ=z0+(zf+zb)/2+hunchZ(ff);sectionH=Math.max((zf-zb)/2,.05);
      sectionRib=0;if(thin>0)for(const row of [.19,.22,.25]){const t=Math.max(0,1-Math.abs(ff-row)/.007);sectionRib+=t*t*(3-2*t)*.005*W*thin}
    }
    const a=sectionA,zc=sectionZ,hz=sectionH,X = x / a, Z = (z - zc) / hz, q = sqrt(X * X + Z * Z);
    let d = (q - 1) * Math.min(a, hz) * .92;
    // Relevo raso acompanhando a seção do tronco; não acrescenta nódulos nas laterais.
    if(sectionRib)d-=sectionRib*sstep(.35,.65,X)*(1-sstep(.8,1.05,X))*sstep(0,.4,Z);
    if (f < tTop) d = Math.max(d, (tTop - f) * Lb); if (f > tBot - .03) d = smax(d, (f - tBot) * Lb, .25);
    if (PT) { const phi = Math.atan2(x, z - zc); d += PT.depth * .7 * (1 - sqrt(.5 + .5 * Math.cos(PT.n * phi))) }
    return d;
  }, torsoB, .02);

  // ---- volumes do tronco ----
  if (B.breasts > 0) { // seios: forma lisa e arredondada (sem mamilo), levemente para fora e para baixo
    const s = B.breasts * W, f = .158, zf = fF(f) + z0;
    const c = V(.31 * W, Y(f) - .04 * s, zf - .1 * s), u = V(.96, 0, .28).normalize(), v = V(0, 1, 0), w = V(-.28, 0, .96).normalize();
    add((x, y, z) => ellipO(x, y, z, c, u, v, w, .3 * s, .27 * s, .25 * s), bs(c, .4 * s), .22 * s);
  }
  if (mu > 0 && !B.breasts && presetId !== 'cute_round') { // Cute mantém o peito plano; seios permanecem independentes
    const f = .15, c = V(.32 * W * M.ch, Y(f) + .02, fF(f) + z0 - .12);
    add((x, y, z) => ellip(x, y, z, c, .42 * W, .22 * W, .1 * W * (1 + .5 * mu)), bs(c, .5 * W), .22 * W);
  }
  { // abdômen definido também nas mulheres adultas, abaixo dos seios
    if (mu >= .8) for (let r = 0; r < 3; r++) for (const xx of [.11]) { const cc = V(xx * W, Y(.215 + r * .045), fF(.215 + r * .045) + z0 - .05); add((x, y, z) => ellip(x, y, z, cc, .1 * W, .07 * W, .025 * W * mu), bs(cc, .14 * W), .12 * W) }
  }
  if (bel > 0) { const c = V(0, Y(.33 + .018 * fat), fF(.33) + z0 - .3 * bel * W); add((x, y, z) => ellip(x, y, z, c, .55 * W * (.8 + .3 * bel), .5 * W * (.8 + .3 * bel), .38 * W * (.8 + .4 * bel)), bs(c, Math.max(.8, .55 * (.8 + .4 * bel)) * W), (.25 + .08 * fat) * W) }
  if (B.glute > 0) { const g = B.glute, c = V(.26 * W * M.hi, Y(.455), fB(.455) + z0 + .16 * W); add((x, y, z) => ellip(x, y, z, c, .3 * W * g, .32 * W * g, .26 * W * g), bs(c, .45 * W * g), .22 * W) }

  if (thin > 0) {
    const c = V(.42 * W * M.sh, Y(.075), z0 + fF(.075) - .07 * W);
    add((x, y, z) => ellip(x, y, z, c, .32 * W, .035 * W, .045 * W * thin), bs(c, .35 * W), .09 * W);
  }

  // ---- braços em pose A ----
  const shX = .98 * W * original.sh, shJ = V(shX, Y(.07), z0 - .04 + hunchZ(.07)), ang = B.aPose * DEG;
  const up = .19 * Lb * B.arm, fo = .165 * Lb * B.arm, rA = .23 * W * (1 + .35 * mu) * B.armWidth;
  const dir = V(Math.cos(ang), -Math.sin(ang), .02).normalize(), elbow = shJ.clone().addScaledVector(dir, up);
  const dir2 = V(Math.cos(ang + 14 * DEG), -Math.sin(ang + 14 * DEG), .16).normalize(), wrist = elbow.clone().addScaledVector(dir2, fo);
  joints.elbow = elbow; joints.wrist = wrist; joints.shoulder = shJ;
  { const c = shJ.clone().add(V(.02 * W, .03, 0)); add((x, y, z) => ellip(x, y, z, c, rA * 1.15, rA * 1.05, rA * 1.1), bs(c, rA * 1.4), .26 * W) } // deltoide
  add(coneField(shJ, rA, elbow, rA * .74), bs(shJ.clone().lerp(elbow, .5), up / 2 + rA), .14 * W);
  const armFront=V(0,0,1),armNormal=armFront.clone().cross(dir).normalize(),foreNormal=armFront.clone().cross(dir2).normalize();
  if (mu > 0) { const c = shJ.clone().lerp(elbow, .52).add(V(0, 0, .05)); add((x, y, z) => ellipO(x, y, z, c, dir, armFront, armNormal, up * .3, rA * (.9 + .35 * mu), rA * .9), bs(c, build.weight || build.muscle ? Math.max(up * .35, rA * (.9 + .35 * mu) + .02) : up * .35), .16 * W) }
  add(coneField(elbow, rA * .76, wrist, rA * .54), bs(elbow.clone().lerp(wrist, .5), fo / 2 + rA), .1 * W);
  { const c = elbow.clone().lerp(wrist, .28); add((x, y, z) => ellipO(x, y, z, c, dir2, armFront, foreNormal, fo * .3, rA * .8, rA * .7), bs(c, build.weight || build.muscle ? Math.max(fo * .35, rA * .8 + .02) : fo * .35), .16 * W) } // antebraço
  hand(wrist, dir2, .095 * Lb * B.hand * (.85 + .15 * W), rA * .5, B.fingers);

  // ---- pernas ----
  const hipJ = V(.45 * W * original.hip, Y(.465), z0 + .02), lk = (.735 - .465) * B.leg, la = (.955 - .735) * B.leg;
  const fK = .465 + (.49 * (lk / (lk + la))), knee = V(.4 * W * (.9 + .1 * original.hip), Y(fK), z0 + .05), ankle = V(.36 * W, ySole + .033 * Lb * (.9 + .1 * B.foot), z0 - .02);
  joints.knee = knee; joints.ankle = ankle; joints.hip = hipJ; joints.W = W; joints.Y = Y; joints.M = M; joints.mermaid = mermaid;
  if (!mermaid) { // sereia: sem pernas (a cauda é uma peça do figurino)
  const rT = .38 * W * (1 + .15 * mu) * (.92 + .12 * original.hip) * B.legWidth, rK = .25 * W * (1 + .15 * mu) * B.legWidth, rAn = .125 * W * (1 + .15 * mu) * (1 + .10 * fat);
  add(coneField(hipJ, rT, knee, rK), bs(hipJ.clone().lerp(knee, .5), hipJ.distanceTo(knee) / 2 + rT), .14 * W);
  { const c = hipJ.clone().lerp(knee, .35).add(V(.0, 0, .08 * W)); add((x, y, z) => ellip(x, y, z, c, rT * .8, hipJ.distanceTo(knee) * .36, rT * .78), bs(c, Math.max(rT * .8, hipJ.distanceTo(knee) * .36) + .05), .3 * W) } // quadríceps
  add(coneField(knee, rK * .97, ankle, rAn), bs(knee.clone().lerp(ankle, .5), knee.distanceTo(ankle) / 2 + rK), .12 * W);
  { const c = knee.clone().lerp(ankle, .26).add(V(-.01, 0, -.08 * W)); add((x, y, z) => ellip(x, y, z, c, rK * .9, knee.distanceTo(ankle) * .28, rK * .9), bs(c, Math.max(rK * .9, knee.distanceTo(ankle) * .28) + .05), .22 * W) } // panturrilha
  { const c = knee.clone().add(V(0, -.02, rK * .5)); add((x, y, z) => ellip(x, y, z, c, rK * .55, rK * .6, rK * .4), bs(c, rK), .14 * W) } // joelho
  foot(ankle, ySole, .105 * Lb * B.foot * (.9 + .1 * W), W);
  }
  if (cactus) joints.ribs = PT;

  function hand(wr, along, Lh, rw, nF) { // mão relaxada, palma virada para a coxa, polegar para a frente
    const u = along.clone().normalize(), w0 = V(0, 0, 1), v = u.clone().cross(w0).normalize(); // v: normal da palma (para o corpo/baixo)
    if (v.x > 0) v.negate(); const w = v.clone().cross(u).normalize(); // w: lado do polegar (frente)
    if (w.z < 0) w.negate();
    const at = (a, b, c) => wr.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(w, c);
    const pc = at(Lh * .3, 0, 0);
    add((x, y, z) => ellipO(x, y, z, pc, u, v, w, Lh * .3, Lh * .11, Lh * .24), bs(pc, Lh * .35), .05 * Lh);
    add(coneField(wr, rw, at(Lh * .14, 0, 0), rw * 1.05), bs(wr, Lh * .25), .06 * Lh);
    const rf = Lh * .062, fingers = nF === 4 ? [[.17, .95, .1], [0, 1, 0], [-.17, .9, -.1]] : [[.2, .93, .07], [.065, 1, .02], [-.07, .95, -.03], [-.2, .78, -.1]];
    for (const [wo, len, spread] of fingers) {
      let p = at(Lh * .54, Lh * .01, Lh * wo), d = u.clone().addScaledVector(w, spread * .35).normalize();
      const segs = [.25, .17, .13].map(s => s * Lh * len); let r = rf * (len < .85 ? .9 : 1);
      for (let k = 0; k < 3; k++) {
        d = d.clone().addScaledVector(v, .22 + .1 * k).normalize(); const q = p.clone().addScaledVector(d, segs[k]), a0 = p.clone(), r0 = r, r1 = r * (k === 2 ? .86 : .94);
        add(coneField(a0, r0, q, r1), bs(a0.clone().lerp(q, .5), segs[k] / 2 + r0), .012 * Lh);
        p = q; r = r1;
      }
    }
    { let p = at(Lh * .1, Lh * .04, Lh * .2), d = u.clone().multiplyScalar(.55).addScaledVector(w, .7).addScaledVector(v, .25).normalize(); let r = rf * 1.15; // polegar
      for (const s of [.2, .16, .13]) { const q = p.clone().addScaledVector(d, s * Lh), a0 = p.clone(), r0 = r; add(coneField(a0, r0, q, r0 * .9), bs(a0.clone().lerp(q, .5), s * Lh / 2 + r0), .02 * Lh); p = q; r *= .9; d = d.clone().addScaledVector(u, .35).addScaledVector(v, .15).normalize() } }
  }
  function foot(an, yS, Lf, Wd) { // pé com calcanhar, peito do pé e dedos arredondados; sola plana
    const heel = V(an.x, yS + Lf * .14, an.z - Lf * .12), ball = V(an.x + Lf * .05, yS + Lf * .1, an.z + Lf * .58), toe = V(an.x + Lf * .07, yS + Lf * .08, an.z + Lf * .78);
    const soleField=coneField(heel,Lf*.15,ball,Lf*.14);
    add((x, y, z) => smax(soleField(x,y,z), yS - y, .02), bs(heel.clone().lerp(ball, .5), Lf * .55), .06 * Wd);
    add(coneField(an, Lf * .12 * Wd ** .3, ball.clone().add(V(0, Lf * .04, -Lf * .15)), Lf * .1), bs(an.clone().lerp(ball, .5), Lf * .5), .08 * Wd);
    add((x, y, z) => smax(ellip(x, y, z, toe, Lf * .19, Lf * .09, Lf * .17), yS - y, .02), bs(toe, Lf * .25), .05 * Wd);
  }
  joints.bounds = { x: Math.max(wrist.x + .5 * Lb * .1 * B.hand + .4, 1.4 * W + .4, shJ.x + rA * 1.6), y0: ySole - .1, y1: nby + .5, z0: z0 - 1.0 * W * B.depth - .6, z1: z0 + 1.2 * W * B.depth + .5 + bel * .4 };
  const result = finish(prims, joints, B);
  if(P.sculptedFace&&!P.lathe){
    // O antigo topo era uma cápsula mais larga que o pescoço da cabeça:
    // sua calota aflorava como uma emenda em U. Na zona de sobreposição,
    // limite o corpo ao mesmo cone oval da cabeça, ligeiramente por dentro.
    // Abaixo dessa zona, o trapézio e os controles de corpo ficam livres.
    const bodyField=result.f,ay=nty,az=ntz,by=nby,bz=nbz,dy=by-ay,dz=bz-az,l2=dy*dy+dz*dz,low=nby-.08*hs,high=nby+.12*hs;
    result.f=(x,y,z)=>{
      const d=bodyField(x,y,z);if(y<=low)return d;
      const radial=Math.hypot(x*1.14,z-nbz),mask=1-sstep(nr*hs*1.30,nr*hs*1.80,radial);if(mask<=0)return d;
      const xx=x/hs*1.14,yy=nby+(y-nby)/hs,zz=nbz+(z-nbz)/hs,t=clamp(((yy-ay)*dy+(zz-az)*dz)/l2,0,1);
      const neck=(Math.hypot(xx,yy-ay-dy*t,zz-az-dz*t)-nr*(1+.08*t))*.92*hs+.006*hs;
      return d+(Math.max(d,neck)-d)*sstep(low,high,y)*mask;
    };
  }
  if (build.weight || build.muscle) {
    // A faixa que encosta na cabeça conserva exatamente o campo original. A largura extra nasce abaixo dela.
    const neutral = makeBodySDF(fit, presetId, hs, mermaid), changed = result.f;
    const low = nby - .20 * hs, high = nby + .08 * hs;
    result.f = (x, y, z) => {
      if (y <= low) return changed(x, y, z);
      if (y >= high) return neutral.f(x, y, z);
      const t = sstep(low, high, y);
      return changed(x, y, z) * (1 - t) + neutral.f(x, y, z) * t;
    };
  }
  return result;
}

// vegetais: o vegetal inteiro é a "cabeça"; braços e pernas finos de desenho animado (luva-mão com 4 dedos)
function makeVegSDF(fit, B, prims, add, bs, joints) {
  const P = fit.P, L = P.lathe, yBot = Math.max(L.y[0], P.neck[3] + .08), rBot = L.r[0], zc = L.cz, r = B.limbR;
  const hip = V(rBot * .5, yBot + .2, zc), knee = V(rBot * .65, yBot - B.legLen * .5, zc + .06), ankle = V(rBot * .62, yBot - B.legLen, zc - .02);
  add(coneField(hip, r * 1.1, knee, r), bs(hip.clone().lerp(knee, .5), B.legLen * .3 + r), .04);
  add(coneField(knee, r, ankle, r * .85), bs(knee.clone().lerp(ankle, .5), B.legLen * .3 + r), .03);
  const ySole = ankle.y - .1 * B.foot, fc = V(ankle.x + .02, ySole + .1 * B.foot, ankle.z + .14 * B.foot);
  add((x, y, z) => Math.max(ellip(x, y, z, fc, .17 * B.foot, .12 * B.foot, .27 * B.foot), ySole - y), bs(fc, .3 * B.foot), .05);
  // braço: sai do lado do vegetal na altura armY
  let rr = 0, yA = B.armY; for (let i = 0; i < L.y.length - 1; i++) if (yA >= L.y[i] && yA <= L.y[i + 1]) { const t = (yA - L.y[i]) / (L.y[i + 1] - L.y[i]); rr = L.r[i] + (L.r[i + 1] - L.r[i]) * t }
  const sh = V(rr * .9, yA, zc), ang = 48 * DEG, d1 = V(Math.cos(ang), -Math.sin(ang), .05).normalize(), el = sh.clone().addScaledVector(d1, B.armLen * .5);
  const d2 = V(Math.cos(ang + 18 * DEG), -Math.sin(ang + 18 * DEG), .2).normalize(), wr = el.clone().addScaledVector(d2, B.armLen * .5);
  add(coneField(sh, r * .95, el, r * .85), bs(sh.clone().lerp(el, .5), B.armLen * .3), .03);
  add(coneField(el, r * .85, wr, r * .75), bs(el.clone().lerp(wr, .5), B.armLen * .3), .03);
  { // mão em luva: palma + 3 dedos + polegar
    const Lh = .42, u = d2.clone(), v = u.clone().cross(V(0, 0, 1)).normalize(); if (v.x > 0) v.negate(); const w = v.clone().cross(u).normalize(); if (w.z < 0) w.negate();
    const at = (a, b, c) => wr.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(w, c), pc = at(Lh * .3, 0, 0);
    add((x, y, z) => ellipO(x, y, z, pc, u, v, w, Lh * .32, Lh * .17, Lh * .3), bs(pc, Lh * .4), .04);
    for (const wo of [.17, 0, -.17]) { const a0 = at(Lh * .5, 0, Lh * wo), q = a0.clone().addScaledVector(u.clone().addScaledVector(v, .35).addScaledVector(w, wo * .6).normalize(), Lh * .36); add(coneField(a0, Lh * .09, q, Lh * .08), bs(a0.clone().lerp(q, .5), Lh * .3), .02) }
    { const a0 = at(Lh * .15, 0, Lh * .22), q = a0.clone().addScaledVector(w.clone().addScaledVector(u, .8).normalize(), Lh * .3); add(coneField(a0, Lh * .095, q, Lh * .08), bs(a0.clone().lerp(q, .5), Lh * .3), .02) }
  }
  joints.ySole = ySole; joints.Lb = yBot - ySole; joints.limb = true;
  Object.assign(joints,{hip,knee,ankle,shoulder:sh,elbow:el,wrist:wr,zCenter:zc,W:rBot});
  joints.bounds = { x: wr.x + .7, y0: ySole - .1, y1: yA + .3, z0: zc - .8, z1: zc + .8 };
  return finish(prims, joints, B);
}

function finish(prims, joints, B) {
  // Blocos consecutivos mantêm a ordem das uniões suaves. A caixa elimina de uma vez dedos/pernas
  // distantes, sem aproximar o campo nem mudar a superfície ou a margem consultada pelas roupas.
  const pair=!!prims[0]?.lower,neck=pair?prims[0]:null,torso=pair?prims[1]:null,start=pair?2:0,blocks=[];
  for(let i=start;i<prims.length;i+=8){
    const items=prims.slice(i,i+8),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    for(const p of items)for(const [axis,key]of ['x','y','z'].entries()){
      lo[axis]=Math.min(lo[axis],p.b[key]-p.b.r-p.k);hi[axis]=Math.max(hi[axis],p.b[key]+p.b.r+p.k);
    }
    blocks.push({items,lo,hi});
  }
  let lastX=NaN,lastY,lastZ,lastDistance;
  const f = (x, y, z) => {
    const ax = Math.abs(x);
    // Camadas (calça sob túnica, colete sob jaleco) consultam o mesmo ponto consecutivamente.
    if(ax===lastX&&y===lastY&&z===lastZ)return lastDistance;
    let d = 1e9;
    if(pair){
      // O tronco costuma estar mais perto. Um limite analítico elimina o pescoço distante, mantendo
      // a mesma ordem da união e o mesmo descarte por esfera da avaliação original.
      const td=torso.f(ax,y,z),lower=neck.lower(ax,y,z),b=torso.b;
      const dx=ax-b.x,dy=y-b.y,dz=z-b.z,distance2=dx*dx+dy*dy+dz*dz,limit=lower+torso.k+b.r;
      if(lower>td+torso.k&&limit>=0&&distance2<=limit*limit)d=td;
      else{const nd=neck.f(ax,y,z),radius=nd+torso.k+b.r;d=radius>=0&&distance2>radius*radius?nd:smin(nd,td,torso.k)}
    }
    for(const block of blocks){
      const {lo,hi,items}=block;
      if(ax<lo[0]-d||ax>hi[0]+d||y<lo[1]-d||y>hi[1]+d||z<lo[2]-d||z>hi[2]+d)continue;
      for (let i = 0; i < items.length; i++) {
        const p = items[i], b = p.b, dx = ax - b.x, dy = y - b.y, dz = z - b.z, limit = d + p.k + b.r;
        if (limit >= 0 && dx * dx + dy * dy + dz * dz > limit * limit) continue;
        d = smin(d, p.f(ax, y, z), p.k);
      }
    }
    lastX=ax;lastY=y;lastZ=z;lastDistance=d;return d;
  };
  return { f, joints, B };
}

// ---------- malha: surface nets esparso ----------
function mesh(sdf, bounds, cell) {
  const BS = 4, S = BS * cell;
  const x0 = -bounds.x, y0 = bounds.y0, z0 = bounds.z0;
  const NBx = Math.ceil(2 * bounds.x / S), NBy = Math.ceil((bounds.y1 - bounds.y0) / S), NBz = Math.ceil((bounds.z1 - bounds.z0) / S);
  const NCx = NBx * BS, NCy = NBy * BS, NCz = NBz * BS;
  // passe grosso: valor nos cantos dos blocos
  const cx = NBx + 1, cy = NBy + 1, cz = NBz + 1, coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) coarse[(k * cy + j) * cx + i] = sdf(x0 + i * S, y0 + j * S, z0 + k * S);
  const blocks = new Map(), thr = S * 1.8; // ≥ meia-diagonal·2: um membro fino que atravessa o bloco sem tocar os cantos não é perdido
  for (let k = 0; k < NBz; k++) for (let j = 0; j < NBy; j++) for (let i = 0; i < NBx; i++) {
    let mn = 1e9, pos = false, neg = false;
    for (let c = 0; c < 8; c++) { const v = coarse[((k + (c >> 2 & 1)) * cy + (j + (c >> 1 & 1))) * cx + i + (c & 1)]; mn = Math.min(mn, Math.abs(v)); if (v > 0) pos = true; else neg = true }
    if (mn > thr && !(pos && neg)) continue;
    const P1 = BS + 1, arr = new Float32Array(P1 * P1 * P1), bx = x0 + i * S, by = y0 + j * S, bz = z0 + k * S;
    const key=(k*NBy+j)*NBx+i,left=i>0?blocks.get(key-1):null,below=j>0?blocks.get(key-NBx):null,behind=k>0?blocks.get(key-NBx*NBy):null;
    // As faces entre blocos são a mesma grade: reutiliza as amostras, em vez de consultar o campo duas vezes.
    for (let c = 0; c < P1; c++) for (let b = 0; b < P1; b++) for (let a = 0; a < P1; a++) {
      const offset=(c*P1+b)*P1+a;
      if(a===0&&left)arr[offset]=left[(c*P1+b)*P1+BS];
      else if(b===0&&below)arr[offset]=below[(c*P1+BS)*P1+a];
      else if(c===0&&behind)arr[offset]=behind[(BS*P1+b)*P1+a];
      else arr[offset]=sdf(bx+a*cell,by+b*cell,bz+c*cell);
    }
    blocks.set(key, arr);
  }
  const P1 = BS + 1, val = (ix, iy, iz) => { // valor num ponto fino (pode estar em qualquer bloco ativo)
    let bi = Math.min(Math.floor(ix / BS), NBx - 1), bj = Math.min(Math.floor(iy / BS), NBy - 1), bk = Math.min(Math.floor(iz / BS), NBz - 1);
    const arr = blocks.get((bk * NBy + bj) * NBx + bi); if (!arr) return NaN;
    return arr[((iz - bk * BS) * P1 + (iy - bj * BS)) * P1 + (ix - bi * BS)];
  };
  // vértices: um por célula cruzada (média dos cruzamentos nas arestas)
  const vmap = new Map(), pos = [], cellKey = (i, j, k) => (k * NCy + j) * NCx + i;
  const EF = Int8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]), cv = new Float32Array(8);
  for (const [key, arr] of blocks) {
    const bi = key % NBx, bj = Math.floor(key / NBx) % NBy, bk = Math.floor(key / (NBx * NBy));
    for (let c = 0; c < BS; c++) for (let b = 0; b < BS; b++) for (let a = 0; a < BS; a++) {
      let m = 0;
      for (let q = 0; q < 8; q++) { const v = arr[((c + (q >> 2 & 1)) * P1 + (b + (q >> 1 & 1))) * P1 + a + (q & 1)]; cv[q] = v; if (v < 0) m |= 1 << q }
      if (m === 0 || m === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (let e = 0; e < 24; e += 2) {
        const p = EF[e], q = EF[e + 1], vp = cv[p], vq = cv[q]; if ((vp < 0) === (vq < 0)) continue;
        const t = vp / (vp - vq), px = p & 1, py = p >> 1 & 1, pz = p >> 2 & 1;
        sx += px + ((q & 1) - px) * t; sy += py + ((q >> 1 & 1) - py) * t; sz += pz + ((q >> 2 & 1) - pz) * t; n++;
      }
      const gi = bi * BS + a, gj = bj * BS + b, gk = bk * BS + c;
      vmap.set(cellKey(gi, gj, gk), pos.length / 3);
      pos.push(x0 + (gi + sx / n) * cell, y0 + (gj + sy / n) * cell, z0 + (gk + sz / n) * cell);
    }
  }
  // faces: para cada aresta com troca de sinal, um quad com as 4 células em volta
  const idx = [];
  for (const [key, arr] of blocks) {
    const bi = key % NBx, bj = Math.floor(key / NBx) % NBy, bk = Math.floor(key / (NBx * NBy));
    for (let c = 0; c < BS; c++) for (let b = 0; b < BS; b++) for (let a = 0; a < BS; a++) {
      const gi = bi * BS + a, gj = bj * BS + b, gk = bk * BS + c, v0 = arr[(c * P1 + b) * P1 + a];
      for (let ax = 0; ax < 3; ax++) {
        const v1 = ax === 0 ? arr[(c * P1 + b) * P1 + a + 1] : ax === 1 ? arr[(c * P1 + b + 1) * P1 + a] : arr[((c + 1) * P1 + b) * P1 + a];
        if ((v0 < 0) === (v1 < 0)) continue;
        // as 4 células que compartilham a aresta
        let i1, i2, i3;
        if (ax === 0) { if (gj < 1 || gk < 1) continue; i1 = vmap.get(cellKey(gi, gj - 1, gk)); i2 = vmap.get(cellKey(gi, gj - 1, gk - 1)); i3 = vmap.get(cellKey(gi, gj, gk - 1)) }
        else if (ax === 1) { if (gi < 1 || gk < 1) continue; i1 = vmap.get(cellKey(gi, gj, gk - 1)); i2 = vmap.get(cellKey(gi - 1, gj, gk - 1)); i3 = vmap.get(cellKey(gi - 1, gj, gk)) }
        else { if (gi < 1 || gj < 1) continue; i1 = vmap.get(cellKey(gi - 1, gj, gk)); i2 = vmap.get(cellKey(gi - 1, gj - 1, gk)); i3 = vmap.get(cellKey(gi, gj - 1, gk)) }
        const i0 = vmap.get(cellKey(gi, gj, gk));
        if (i0 === undefined || i1 === undefined || i2 === undefined || i3 === undefined) continue;
        const ids = [i0, i1, i2, i3];
        if (v0 < 0) idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]); else idx.push(ids[0], ids[2], ids[1], ids[0], ids[3], ids[2]);
      }
    }
  }
  return { pos: new Float32Array(pos), idx, val, cell, origin: [x0, y0, z0] };
}

// malha de qualquer campo de distância (usada pelo corpo e pelos figurinos): surface nets + 1 passo de Newton + normais
export function sdfMesh(f, bounds, cell, normals = true) {
  const m = mesh(f, bounds, cell), p = m.pos, e = cell * .5;
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    const a1 = f(x + e, y - e, z - e), a2 = f(x - e, y - e, z + e), a3 = f(x - e, y + e, z - e), a4 = f(x + e, y + e, z + e);
    const d = (a1 + a2 + a3 + a4) / 4, gx = a1 - a2 - a3 + a4, gy = -a1 - a2 + a3 + a4, gz = -a1 + a2 - a3 + a4, gl = sqrt(gx * gx + gy * gy + gz * gz) || 1;
    const st = clamp(d, -cell, cell); p[i] -= gx / gl * st; p[i + 1] -= gy / gl * st; p[i + 2] -= gz / gl * st;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setIndex(m.idx); if(normals)geo.computeVertexNormals();
  return geo;
}
// Tecido largo: encontra a topologia numa grade maior e refina só a superfície. A densidade final
// continua próxima de cell, mas o espaço vazio e o interior não precisam de uma grade fina inteira.
export function refinedSdfMesh(f,bounds,cell,computeNormals=true) {
  const coarse=sdfMesh(f,bounds,cell*2),original=coarse.attributes.position.array,count=original.length/3;
  const normals=Array.from(coarse.attributes.normal.array),p=Array.from(original),indices=[],edges=new Map(),ix=coarse.index.array;
  const middle=(a,b)=>{const key=Math.min(a,b)*count+Math.max(a,b);if(edges.has(key))return edges.get(key);
    const n=p.length/3;let length=0;for(let k=0;k<3;k++){p.push((original[a*3+k]+original[b*3+k])*.5);const v=normals[a*3+k]+normals[b*3+k];normals.push(v);length+=v*v}
    length=Math.sqrt(length)||1;for(let k=0;k<3;k++)normals[n*3+k]/=length;edges.set(key,n);return n};
  for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2],ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);indices.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca)}
  const positions=new Float32Array(p),e=cell*.25;
  for(let i=count*3;i<positions.length;i+=3){let x=positions[i],y=positions[i+1],z=positions[i+2];
    // A normal interpolada já fornece a direção de projeção nas áreas lisas. Só a quina pede gradiente novo.
    const step=clamp(f(x,y,z),-cell*2,cell*2)/.95;x-=normals[i]*step;y-=normals[i+1]*step;z-=normals[i+2]*step;
    if(Math.abs(f(x,y,z))>cell*.04){
      const a=f(x+e,y-e,z-e),b=f(x-e,y-e,z+e),c=f(x-e,y+e,z-e),d=f(x+e,y+e,z+e);
      const gx=a-b-c+d,gy=-a-b+c+d,gz=-a+b-c+d,gl=Math.hypot(gx,gy,gz);
      if(gl>1e-9){const distance=clamp((a+b+c+d)*e/gl,-cell*2,cell*2);x-=gx/gl*distance;y-=gy/gl*distance;z-=gz/gl*distance}
    }
    positions[i]=x;positions[i+1]=y;positions[i+2]=z;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(indices);if(computeNormals)g.computeVertexNormals();coarse.dispose();return g;
}

export { roundCone, ellip, ellipO };

// ---------- montagem ----------
const cache = new Map();
export function buildBody(fit, presetId, opts = {}) {
  if (!fit || !fit.P || fit.P.kind === 'robot' || !BODIES[presetId]) return null;
  const T0 = performance.now(), P = fit.P;
  const hs = opts.headScale ?? 1, mer = !!opts.mermaid, build = normalizeBuild(opts.build);
  const key = [presetId, opts.cell || 0, hs, mer, build.weight, build.muscle].join('|');
  let geo, S;
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); geo = hit.geo.clone(); S = hit.S }
  else {
    S = makeBodySDF(fit, presetId, hs, mer, build);
    const B = S.joints.bounds, cell = opts.cell || (S.joints.limb ? .014 : .028 * clamp(S.B.W, 1, 1.3));
    const m = mesh(S.f, B, cell);
    // projeta cada vértice na superfície (2 passos de Newton com gradiente numérico)
    const p = m.pos, e = cell * .5;
    for (let i = 0; i < p.length; i += 3) { // 1 passo de Newton, gradiente por tetraedro (4 avaliações)
      const x = p[i], y = p[i + 1], z = p[i + 2];
      const a1 = S.f(x + e, y - e, z - e), a2 = S.f(x - e, y - e, z + e), a3 = S.f(x - e, y + e, z - e), a4 = S.f(x + e, y + e, z + e);
      const d = (a1 + a2 + a3 + a4) / 4, gx = a1 - a2 - a3 + a4, gy = -a1 - a2 + a3 + a4, gz = -a1 + a2 - a3 + a4, gl = sqrt(gx * gx + gy * gy + gz * gz) || 1;
      const st = clamp(d, -cell, cell); p[i] -= gx / gl * st; p[i + 1] -= gy / gl * st; p[i + 2] -= gz / gl * st;
    }
    geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setIndex(m.idx); geo.computeVertexNormals();
    // remove partes escondidas dentro da cabeça/pescoço (economiza vértices; o pescoço do corpo cruza o da cabeça por dentro)
    cache.set(key, { geo: geo.clone(), S });
    if (cache.size > 64) { const oldest = cache.keys().next().value; cache.get(oldest).geo.dispose(); cache.delete(oldest) }
  }
  // cores: pele (ou cor dos membros nos vegetais) com variação suave, oclusão nas dobras, joelhos/cotovelos/mãos rosados
  const pa = geo.attributes.position, na = geo.attributes.normal, n = pa.count, colors = new Float32Array(n * 3), gloss = new Float32Array(n);
  const veg = S.joints.limb, base = new THREE.Color(veg ? (P.stem && P.stem.color) || '#4f7d22' : P.skin), hsl = {}; base.getHSL(hsl);
  const blush = new THREE.Color(P.blush || '#d66f72'), shade = new THREE.Color().setHSL(hsl.h - .02, Math.min(1, hsl.s * 1.05), hsl.l * .62), hi = new THREE.Color().setHSL(hsl.h + .01, hsl.s * .92, Math.min(.92, hsl.l * 1.1));
  const groove = P.patternColor ? new THREE.Color(P.patternColor[0]) : null, ridge = P.patternColor ? new THREE.Color(P.patternColor[1]) : null;
  const J = S.joints, c = new THREE.Color(), q = V();
  for (let i = 0; i < n; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), ax = Math.abs(x);
    c.copy(base);
    const ns = Math.sin(x * 7.1 + y * 3.3) * Math.sin(z * 6.7 - y * 2.1) * .5 + Math.sin(x * 19 + z * 17 + y * 11) * .25;
    c.lerp(ns > 0 ? hi : shade, Math.abs(ns) * .12);
    // oclusão: o quanto o espaço logo fora da superfície está "fechado" (axilas, entre dedos, virilha)
    q.set(x + na.getX(i) * .07, y + na.getY(i) * .07, z + na.getZ(i) * .07); const ao = clamp(S.f(q.x, q.y, q.z) / .07, 0, 1);
    c.lerp(shade, (1 - ao) * .45);
    if (!veg) {
      let rosy = 0; for (const jn of ['knee', 'elbow']) { const jp = J[jn]; if (jp) rosy = Math.max(rosy, Math.exp(-((ax - jp.x) ** 2 + (y - jp.y) ** 2 + (z - jp.z) ** 2) / .03)) }
      if (J.wrist) rosy = Math.max(rosy, .6 * sstep(.25, -.1, (ax - J.wrist.x) * .7 - (y - J.wrist.y) * .7 + .0) * sstep(J.wrist.y + .1, J.wrist.y - .2, y));
      if (J.ankle) rosy = Math.max(rosy, .35 * sstep(J.ankle.y + .05, J.ankle.y - .15, y));
      c.lerp(blush, rosy * .22 * (P.blushK ?? .5) * 1.4);
    }
    if (J.ribs && groove && !veg) { const zc = (fit.cz || 0), phi = Math.atan2(ax < .9 ? x : x - Math.sign(x) * .4, z - zc), cc = .5 + .5 * Math.cos(J.ribs.n * phi); c.lerp(groove, (1 - Math.pow(cc, .35)) * .5).lerp(ridge, Math.pow(cc, 6) * .25) }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; gloss[i] = Math.min(P.skinGloss || 0, .35);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.setAttribute('gloss', new THREE.BufferAttribute(gloss, 1));
  const pv = new THREE.Vector3(0, P.neck[3], P.neck[4]); // pivô da escala da cabeça (base do pescoço)
  const out = { build, cacheKey: key, proportions: { ...S.B }, vegSkin: !!S.B.vegSkin, geo, sdf: S.f, ySole: S.joints.ySole, timing: Math.round(performance.now() - T0), joints: S.joints, hs, pivot: pv,
    sdfHead: (x, y, z) => S.f(pv.x + hs * (x - pv.x), pv.y + hs * (y - pv.y), pv.z + hs * (z - pv.z)) / hs }; // corpo visto do espaço da cabeça (colisão do cabelo)
  return out;
}
