// Figurinos esculpidos (referências): palhaço de circo, orc guerreiro, anão aventureiro, falcoeiro do deserto,
// sereia pérola e sereia rubi.
//
// Volumes contínuos recuperados do caa45f5; saias e abas por contornos cúbicos medidos.
// Suavização só no tecido, com pregas, avesso e barras próprias.
// Luvas usam recortes com folga nas normais; o corpo é somente consultado, nunca alterado.
import * as THREE from 'three';
import { crescent } from './lunar.js';
import { sdfMesh, refinedSdfMesh } from './body.js';
import { smoothCloth, shellCloth } from './fabric.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clothSurface, handPatch } from './fabric.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const { clamp, lerp } = THREE.MathUtils;
const sqrt = Math.sqrt, PI = Math.PI;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const smax = (a, b, k) => -smin(-a, -b, k);
// Cada tipo físico tem seu próprio campo (e portanto seu próprio contorno), inclusive nos acertos de cache.
const contourCache = new WeakMap();
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// Os campos de camadas são imutáveis; várias paredes consultam a mesma amostra durante a malhagem.
const memoField = fn => { let px=NaN,py,pz,value;return (x,y,z)=>{if(x===px&&y===py&&z===pz)return value;value=fn(x,y,z);px=x;py=y;pz=z;return value} };

// ---------- catálogo ----------
export const SDF_OUTFITS = {
  lunar_explorer: { label: 'Exploradora lunar', sub: 'Jaqueta curta, calça cargo, tênis e mochila', channels: ['fabric','secondary','pants','accent','leather','trim'] },
  lunar_guardian: { label: 'Guardiã da Lua', sub: 'Vestido escuro, manto azul e símbolos lunares', channels: ['fabric','secondary','accent','leather','trim'] },
  lunar_inventor: { label: 'Jovem inventor', sub: 'Camisa, jardineira azul, tênis e mochila de ferramentas', channels: ['fabric','secondary','pants','accent','leather','trim'] },
  lunar_ruby: { label: 'Feiticeira rubi', sub: 'Vestido escuro, manto rubi e joias douradas', channels: ['fabric','secondary','accent','leather','trim'] },
  circus: { label: 'Palhaço de circo', sub: 'Macacão listrado, gola franzida, casaca de estrelas, sapatões', channels: ['fabric', 'secondary', 'accent', 'leather', 'trim'] },
  orc: { label: 'Guerreiro orc', sub: 'Ombreira de espinhos, caveira no cinto, tanga e braçadeiras', channels: ['fabric', 'leather', 'trim', 'secondary'] },
  adventurer: { label: 'Aventureiro', sub: 'Camisa, gibão, capa, bolsas, bússola e botas', channels: ['fabric', 'secondary', 'accent', 'pants', 'leather', 'trim'] },
  desert: { label: 'Falcoeiro do deserto', sub: 'Túnica, faixa e capa azuis, bombacha, botas trançadas', channels: ['fabric', 'secondary', 'pants', 'leather', 'trim'] },
  mermaid_pearl: { label: 'Sereia pérola', sub: 'Cauda de escamas, top de pérolas, véus nos braços', channels: ['fabric', 'accent', 'secondary', 'trim'], mermaid: true },
  mermaid_ruby: { label: 'Sereia rubi', sub: 'Cauda negra e vermelha, joias, frascos, véus rubi', channels: ['fabric', 'accent', 'secondary', 'trim'], mermaid: true },
  casual: { label: 'Aventureiro', sub: 'Túnica com caimento, cinto, calça reta e botas', channels: ['fabric', 'secondary', 'leather', 'trim'] },
  dress: { label: 'Vestido', sub: 'Corpete, mangas bufantes e saia rodada', channels: ['fabric', 'secondary', 'leather', 'trim'] },
  royal: { label: 'Realeza', sub: 'Manto longo, mangas em sino, arminho, capa e broche', channels: ['fabric', 'accent', 'secondary', 'leather', 'trim'] },
  inventor: { label: 'Inventor', sub: 'Jaleco longo aberto, colete, gravata e calça', channels: ['fabric', 'secondary', 'accent', 'leather', 'trim'] },
  cowboy: { label: 'Faroeste', sub: 'Camisa, colete de couro, lenço, cinturão e botas', channels: ['fabric', 'leather', 'secondary', 'pants', 'trim'] }
};
export const SDF_DEFAULT_COLORS = {
  lunar_explorer: {fabric:'#242133',secondary:'#4d3c64',pants:'#282737',accent:'#4ea9e8',leather:'#393346',trim:'#c89d52'},
  lunar_guardian: {fabric:'#191d30',secondary:'#252e56',accent:'#254982',leather:'#252233',trim:'#d7b15c'},
  lunar_inventor: {fabric:'#486b9b',secondary:'#e5dac4',pants:'#486b9b',accent:'#64b8e7',leather:'#71513b',trim:'#c5a158'},
  lunar_ruby: {fabric:'#231827',secondary:'#401d30',accent:'#93283e',leather:'#2b1b27',trim:'#c9a251'},
  circus: { fabric: '#9e2a2b', secondary: '#eadcbf', accent: '#3d4f8a', leather: '#8e2a26', trim: '#d4a640' },
  orc: { fabric: '#a3302a', leather: '#4a3326', trim: '#8c8a86', secondary: '#e8dcc0' },
  adventurer: { fabric: '#34507e', secondary: '#ece4d4', accent: '#8e3326', pants: '#3a3836', leather: '#6b4228', trim: '#c99a3e' },
  desert: { fabric: '#2f4fb5', secondary: '#f1e9d8', pants: '#ece2cc', leather: '#5a3a24', trim: '#d4a640' },
  mermaid_pearl: { fabric: '#f3f1ee', accent: '#4f8fd8', secondary: '#f5efe6', trim: '#d4a640' },
  mermaid_ruby: { fabric: '#17111a', accent: '#c4161f', secondary: '#1c1418', trim: '#d4a640' },
  casual: { fabric: '#34507e', secondary: '#e8dcbf', leather: '#5a3a24', trim: '#c99a3e' },
  dress: { fabric: '#7a3b5e', secondary: '#e8d9b6', leather: '#493028', trim: '#c99a3e' },
  royal: { fabric: '#8a2a3c', accent: '#5e1626', secondary: '#f4efe6', leather: '#3a2418', trim: '#d4a640' },
  inventor: { fabric: '#ece9e2', secondary: '#2f3f63', accent: '#7a2030', leather: '#3a2a22', trim: '#b8913f' },
  cowboy: { fabric: '#c9873e', leather: '#5a3826', secondary: '#a8282a', pants: '#2c3446', trim: '#c9a24a' }
};
export const SDF_DEFAULT_OUTFIT = { nana_explorer:'lunar_explorer', moon_guardian:'lunar_guardian', nico_inventor:'lunar_inventor', ruby_sorceress:'lunar_ruby', sad_clown: 'circus', orc_warrior: 'orc', dwarf_bard: 'adventurer', masculine_soft: 'desert', feminine_soft: 'mermaid_pearl', feminine_bold: 'mermaid_ruby' };

export function buildSdfOutfit(body, style, colors, mats, add, addGeo, onlySlot = null) {
  const J = body.joints, B = body.proportions, W = J.W, Y = J.Y, z0 = J.zCenter, Lb = J.Lb, bf = body.sdf, yN = J.yNeck;
  const S = J.shoulder, E = J.elbow, Wr = J.wrist, H = J.hip, K = J.knee, A = J.ankle, ySole = J.ySole;
  const dU = E.clone().sub(S).normalize(), dF = Wr.clone().sub(E).normalize();
  const cellBase = .03 * clamp(W, 1, 1.25);
  const bx = J.bounds.x, zA = J.bounds.z0, zB = J.bounds.z1;
  // lado do braço: plano bissetor entre a lateral do tronco e o braço (axila)
  const aDir = V(dU.x, dU.y, 0).normalize(), bis = V(aDir.x, aDir.y - 1, 0).normalize(), nArm = V(-bis.y, bis.x, 0); if (nArm.x < 0) nArm.negate();
  const armSide = (ax, y) => (ax - S.x) * nArm.x + (y - S.y) * nArm.y;
  const along = (ax, y, z, P0, d) => (ax - P0.x) * d.x + (y - P0.y) * d.y + (z - P0.z) * d.z;
  const segD = (ax, y, z, a, b) => { const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, t = clamp(((ax - a.x) * abx + (y - a.y) * aby + (z - a.z) * abz) / (abx * abx + aby * aby + abz * abz), 0, 1); return Math.hypot(ax - a.x - abx * t, y - a.y - aby * t, z - a.z - abz * t) };
  const phiOf = (x, z) => Math.atan2(x, z - z0); // 0 = frente
  // superfície do corpo: z da frente/de trás numa coluna (x, y); raio horizontal numa direção
  const bT = (x, y, z) => armSide(Math.abs(x), y) > .02 ? Math.max(bf(x, y, z), .05) : bf(x, y, z); // só tronco/pernas (ignora braços e mãos)
  const frontZ = (x, y) => { let z = zB + .5; for (let k = 0; k < 120; k++) { const d = bT(x, y, z); if (d < 1e-3) break; z -= Math.max(d * .9, .004); if (z < zA - .5) return z0 } return z };
  const backZ = (x, y) => { let z = zA - .5; for (let k = 0; k < 120; k++) { const d = bT(x, y, z); if (d < 1e-3) break; z += Math.max(d * .9, .004); if (z > zB + .5) return z0 } return z };
  // Medições compartilhadas pelos slots; as roupas consultam sempre o mesmo corpo imutável.
  if(!contourCache.has(bf))contourCache.set(bf,new Map());
  const measured=contourCache.get(bf);
  const radAt=(y,ph,cz=z0,cx=0)=>{
    const key=[y,Math.atan2(Math.sin(ph),Math.cos(ph)),cz,cx].map(v=>v.toFixed(6)).join(':');
    if(measured.has(key))return measured.get(key);
    const dx=Math.sin(ph),dz=Math.cos(ph);let r=2.5*W+1;
    for(let k=0;k<120;k++){const d=bT(cx+dx*r,y,cz+dz*r);if(d<1e-3)break;r-=Math.max(d*.9,.004);if(r<.01){r=.01;break}}
    if(measured.size>16000)measured.delete(measured.keys().next().value);measured.set(key,r);return r;
  };

  const onFront = (x,y,off=0) => V(x,y,frontZ(x,y)+off);
  const limbR = (P0, dir, side = 1) => { const up = Math.abs(dir.y) > .9 ? V(1, 0, 0) : V(0, 1, 0), n = up.clone().cross(dir).normalize(); let r = .02; while (r < 1.5 && bf(P0.x * side + n.x * r, P0.y + n.y * r, P0.z + n.z * r) < 0) r += .01; return r };
  const bodyBounds = (y0, y1, extra = .3) => ({ x: bx + extra, y0, y1, z0: zA - extra, z1: zB + extra });

  const tubeG = (pts, r, seg = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 4), r, seg, false);
  const sph = (p, r, sx = 1, sy = 1, sz = 1, w = 14, h = 10) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); g.translate(p.x, p.y, p.z); return g };
  const orient = (g, p, dir, up = V(0, 1, 0)) => { const zz = dir.clone().normalize(), xx = up.clone().cross(zz); if (xx.lengthSq() < 1e-6) xx.set(1, 0, 0); xx.normalize(); const yy = zz.clone().cross(xx); g.applyMatrix4(new THREE.Matrix4().makeBasis(xx, yy, zz).setPosition(p)); return g };
  const chainG = (points, r = .022 * W) => {
    const curve = new THREE.CatmullRomCurve3(points), n = Math.max(4, Math.min(48, Math.ceil(curve.getLength() / (r * 1.5)))), parts = [];
    for(let i=0;i<=n;i++){
      const p=curve.getPoint(i/n), tangent=curve.getTangent(i/n), normal=i%2?V(0,0,1).cross(tangent).normalize():V(0,0,1),g=new THREE.TorusGeometry(r,r*.19,6,12);g.scale(.78,1,1);parts.push(orient(g,p,normal.lengthSq()>.01?normal:V(1,0,0)));
    }
    const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
  };
  const mirror = (fn) => { fn(1); fn(-1) };
  const starShape = (r0, r1, n = 5) => { const s = new THREE.Shape(); for (let k = 0; k <= n * 2; k++) { const a = k / (n * 2) * PI * 2, r = k % 2 ? r1 : r0; k ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r) } return s };
  const flatOnBody = (shape, x, y, depth, rot = 0, lift = .012) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * .4, bevelSize: depth * .4, bevelSegments: 1, curveSegments: 8 }); g.rotateZ(rot); const p = onFront(x, y, lift); const e = .03, n = V(bf(x + e, y, p.z) - bf(x - e, y, p.z), bf(x, y + e, p.z) - bf(x, y - e, p.z), bf(x, y, p.z + e) - bf(x, y, p.z - e)).normalize(); return orient(g, p, n) };
  // ---- volumes da referência e contornos de tecido medidos ----
  const emit = add, detail = addGeo;
  let detailSlot = 'extras';
  add = (name, g, ch, slot = 'extras') => { if(onlySlot&&onlySlot!==slot){g.dispose();return} g.userData.slot = slot; return emit(name, g, ch) };
  addGeo = (ch, g) => { if(onlySlot&&onlySlot!==detailSlot){g.dispose();return} g.userData.slot = detailSlot; detail(ch, g) };
  let activeSlot='extras';
  const piece=(name,ch,field,bounds,cell=cellBase,shell=null)=>{
    const slot=activeSlot;if(onlySlot&&onlySlot!==slot)return;
    const narrow=/Cinto|Faixa|Aro|Tira|Polaina|Bracadeira/.test(name);
    const base=(narrow?sdfMesh:refinedSdfMesh)(shell?shell.solid:field,bounds,cell,false);
    const g=shell?shellCloth(base,shell.clip,shell.thickness,3):smoothCloth(base,3);
    if(g.attributes.position.count){add(name,g,ch,slot);return g}g.dispose();return null;
  };
  function fabric(name, ch, g, slot) {
    add(name, g, ch, slot);
    const grid = g.userData.surface;
    if (!grid || name==='Macacao' || /Quadril/.test(name)) return;
    const p = g.attributes.position;
    for (const row of [0, grid.nr]) {
      const pts = []; for (let j = 0; j < grid.cols; j++) pts.push(V().fromBufferAttribute(p, row * grid.cols + j));
      if (grid.closed) pts.push(pts[0].clone());
      add(name + '_Dobra', tubeG(pts, .016 * W, 8), ch, slot);
    }
  }
  // parte de cima com caimento (usa a envoltória das roupas; ver garment)
  function top(name, ch, o) {
    if (onlySlot && onlySlot !== 'upper') return;
    return garment(name, ch, 'upper', { top: yN + (o.collar ?? .02), bottom: Y(o.bottom), t: o.t, sleeve: o.sleeve, short: o.short, puff: o.puff, vneck: o.vneck, open: o.open, hollow: (o.open || 0) > .25, shoulderPad: o.shoulderPad, sleeveEase: o.t * .7, cell: o.cell, env: { ease: o.t * .55 + (o.loose || 0), hang: .3, folds: o.folds || 0, foldN: 14, flareFrom: Y(.36), flare: o.flare || 0 } });
  }
  // calça: pernas + espessura; bombacha (volume no meio, franzida no tornozelo); termina acima do tornozelo
  function pants(name, ch, o) {
    if(onlySlot&&onlySlot!=='lower')return;
    activeSlot='lower';
    const yTop = Y(o.top), yBot = A.y + (o.cuff ?? .05) * Lb;
    const f = (x, y, z) => {
      const ax = Math.abs(x); if (armSide(ax, y) > 0) return 1;
      const u = clamp((yTop - y) / (yTop - yBot), 0, 1);
      let t = o.t + (o.puff || 0) * Math.pow(Math.sin(PI * clamp((u - .05) / .95, 0, 1)), .8) * (1 - .6 * sstep(.85, 1, u));
      if (o.folds) t += o.folds * (.5 + .5 * Math.sin(Math.atan2(ax - K.x, z - z0) * 9 + y * 4));
      let d = bf(x, y, z) - t; d = Math.max(d, y - yTop, yBot - y);
      if (o.under && y > o.under.y) d = Math.max(d, o.under.fn(x, y, z) + .02 * W); // por dentro da peça de cima
      if (o.stripes) d = Math.max(d, o.stripes(x, y, z));
      return d;
    };
    piece(name, ch, f, { x: Math.max(W * Math.max(B.hip, B.waist) * 1.2 + .4 * W, Math.max(H.x, K.x) + .6 * W + (o.puff || 0) * 1.5), y0: yBot - .2, y1: yTop + .2, z0: zA - .3, z1: zB + .3 + (o.puff || 0) }, o.cell);
  }
  // bota/meia: pé + perna até a altura h (acima do tornozelo), cano largo no topo, sola
  function boots(name, ch, o) {
    if(onlySlot&&onlySlot!=='feet')return;
    activeSlot='feet';
    const yTop = A.y + o.h * Lb;
    const f = (x, y, z) => {
      let t = o.t + (o.cuffT || 0) * sstep(yTop - .25 * Lb * .1 - .08, yTop, y) + (o.toe || 0) * sstep(A.z + .1, A.z + .5, z) * sstep(A.y, ySole, y);
      let d = bf(x, y, z) - t; d = Math.max(d, y - yTop);
      if (o.stripes) d = Math.max(d, o.stripes(x, y, z));
      return d;
    };
    piece(name, ch, f, { x: A.x + .9 * W, y0: ySole - .15, y1: yTop + .1, z0: A.z - .7 * W, z1: Math.max(A.z + 1.3 * W, zB) + .3 + (o.toe || 0) }, o.cell);
  }
  // faixa em volta do corpo (cinto, faixa, gola baixa)
  function band(name, ch, yc, h, t, o = {}) {
    if(onlySlot&&onlySlot!=='belt')return;
    activeSlot='belt';
    const f = (x, y, z) => { let d = Math.max(bf(x, y, z) - t, Math.abs(y - yc - (o.tilt || 0) * x) - h / 2); if (armSide(Math.abs(x), y) > -.05) d = Math.max(d, .05); return d };
    piece(name, ch, f, bodyBounds(yc - h - .3, yc + h + .3), o.cell ?? cellBase * .8);
  }
  // trecho de membro (braçadeira, polaina): segmento a→b do braço/perna, entre t0 e t1
  function limbWrap(name, ch, a, b, t0, t1, t, o = {}) {
    activeSlot=/Bota|Polaina/.test(name)?'feet':'extras';if(onlySlot&&onlySlot!==activeSlot)return;
    const d0 = b.clone().sub(a), Lseg = d0.length(), dir = d0.clone().normalize(), p0 = a.clone().addScaledVector(dir, Lseg * t0), p1 = a.clone().addScaledVector(dir, Lseg * t1);
    const R = limbR(a.clone().lerp(b, (t0 + t1) / 2), dir) + t + .35;
    const f = (x, y, z) => { const ax = Math.abs(x); let tt = t + (o.flare || 0) * sstep(.6, 1, along(ax, y, z, p0, dir) / (Lseg * (t1 - t0))); if (o.rings) tt += o.rings * (Math.cos(along(ax, y, z, p0, dir) / (Lseg * (t1 - t0)) * PI * 2 * o.ringsN) > .6 ? 1 : 0); return Math.max(bf(x, y, z) - tt, -along(ax, y, z, p0, dir), along(ax, y, z, p1, dir), segD(ax, y, z, p0, p1) - R) };
    // O corte por planos limita a peça ao cilindro entre p0 e p1. A projeção radial evita malhar
    // caixas enormes em volta de tiras finas, sem mudar o campo nem a resolução do acabamento.
    const rx=R*Math.sqrt(Math.max(0,1-dir.x**2)),ry=R*Math.sqrt(Math.max(0,1-dir.y**2)),rz=R*Math.sqrt(Math.max(0,1-dir.z**2));
    const lo = V(Math.min(p0.x, p1.x) - rx, Math.min(p0.y, p1.y) - ry, Math.min(p0.z, p1.z) - rz), hi = V(Math.max(p0.x, p1.x) + rx, Math.max(p0.y, p1.y) + ry, Math.max(p0.z, p1.z) + rz);
    piece(name, ch, f, { x: hi.x + .1, y0: lo.y - .1, y1: hi.y + .1, z0: lo.z - .1, z1: hi.z + .1 }, o.cell ?? cellBase * .8);
  }
  // casca cônica (saia, abas de casaco, tanga em volta): raio = contorno do corpo + folga + abertura com a altura
  function cone(name,ch,o){
    const slot=/Casaca|Gibao|Tunica/.test(name)?'upper':name==='Echarpe'?'extras':'lower';
    if(onlySlot&&onlySlot!==slot)return;
    const yt=Y(o.top),yb=Y(o.bottom),N=144,base=Array.from({length:N},(_,i)=>radAt(yt,2*PI*i/N)+(o.pad??.06));
    const radius=a=>{const f=((a/(2*PI))%1+1)%1*N,i=Math.floor(f),t=f-i,at=k=>base[(k+N)%N];return ((2*at(i))+(-at(i-1)+at(i+1))*t+(2*at(i-1)-5*at(i)+4*at(i+1)-at(i+2))*t*t+(-at(i-1)+3*at(i)-3*at(i+1)+at(i+2))*t*t*t)*.5};
    // A cintura magra pode ser mais estreita que a coxa. As tiras mantêm o desenho, mas caem
    // sobre a envoltória de toda a região coberta, em vez de copiar só o anel da cintura.
    const support=slot==='lower'?envelope(yt,yb,{ease:o.pad??.06,hang:.12,flareFrom:yt,flare:o.flare||0}):null;
    const point=(t,u,a0=o.open||0,a1=2*PI-(o.open||0))=>{
      const a=lerp(a0,a1,u),r=Math.max(radius(a)+(o.flare||0)*t*(yt-yb),support?.radius(lerp(yt,yb,t),a)||0)+(o.pleat||0)*Math.sin(a*(o.pleatN||16))*t;
      const rag=o.ragged?o.ragged*(.5+.5*Math.sin(a*23)*Math.sin(a*7)):0;
      return V(Math.sin(a)*r,lerp(yt,yb,t)+(rag+(o.tails?o.tails(a):0))*t**6,z0+Math.cos(a)*r);
    };
    if(o.only){for(let i=0;i<13;i++){const a=i*2*PI/13+.035,b=(i+1)*2*PI/13-.035;fabric(name,ch,clothSurface(64,20,(t,u)=>point(t,u,a,b),{thickness:.04*W}),slot)}}
    else fabric(name,ch,clothSurface(80,192,(t,u)=>point(t,u),{closed:!o.open,thickness:.035*W}),slot);
  }
  // superfície fina de dupla face a partir de uma grade de pontos (babado, véu, nadadeira, capa leve)
  function sheet(name, ch, rows, mixFn, shadeFn) {
    const nr = rows.length - 1, nc = rows[0].length - 1;
    const g = clothSurface(nr, nc, (t, u) => rows[Math.round(t * nr)][Math.round(u * nc)], { thickness: .012 * W });
    const count = (nr + 1) * (nc + 1), mix = g.attributes.mixc, shade = g.attributes.shade;
    for (let k = 0; k < count; k++) { const t = Math.floor(k / (nc + 1)) / nr, u = (k % (nc + 1)) / nc; for (const off of [0, count]) { mix.setX(k + off, mixFn ? mixFn(t, u) : 0); shade.setX(k + off, (shadeFn ? shadeFn(t, u) : 1) * (off ? .88 : 1)) } }
    const slot = /Nadadeira|Cauda|Estandarte/.test(name) ? 'lower' : /Veu|Capa/.test(name) ? 'cape' : /Tabardo/.test(name) ? 'upper' : 'extras';
    fabric(name, ch, g, slot);
  }

  // babado franzido em anel (gola, punho)
  function ruffle(name, ch, center, axis, r0, r1, n, amp, drop = 0) {
    if(onlySlot&&onlySlot!=='extras')return;
    const ax = axis.clone().normalize(), u = (Math.abs(ax.y) > .9 ? V(1, 0, 0) : V(0, 1, 0)).cross(ax).normalize(), v = ax.clone().cross(u), rows = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, row = []; for (let j = 0; j <= 384; j++) { const a = j / 384 * PI * 2, r = r0 + (r1 - r0) * t, w = Math.sin(a * n) * amp * t; row.push(center.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).addScaledVector(ax, w - drop * t * t)) } rows.push(row) }
    sheet(name, ch, rows, null, (t, s) => .82 + .18 * Math.abs(Math.sin(s * PI * 2 * n)) * (.5 + t * .5));
  }
  // capa/manto: pano que sai dos ombros e cai atrás, com pregas
  function cape(name, ch, o) {
    if(onlySlot&&onlySlot!=='cape')return;
    const rows = [], NC = 96, NR = 64, yT = Y(o.top), yB = o.yBottom ?? Y(o.bottom);
    for (let i = 0; i <= NR; i++) {
      const t = i / NR, y = yT + (yB - yT) * t, row = [];
      for (let j = 0; j <= NC; j++) {
        const s = j / NC, ph = PI - (o.span ?? 1.9) / 2 + (o.span ?? 1.9) * s + (o.turn || 0);
        let rr = radAt(Math.max(y, Y(.42)), ph) + .07 + (o.flare ?? .25) * t + .05 * Math.sin(s * PI * (o.pleats ?? 9) + t * 2) * t;
        if (o.over) { const q = surfAt(o.over, y, ph); rr = Math.max(rr, Math.hypot(q.x, q.z - z0) + .05 * W + .04 * (.5 + .5 * Math.sin(s * PI * (o.pleats ?? 9) + t * 2)) * t) }
        const sw = (o.sway || 0) * t * t;
        row.push(V(Math.sin(ph) * rr + sw, y - (o.ragged ? o.ragged * t * (.5 + .5 * Math.sin(s * 40)) * sstep(.9, 1, t) : 0), z0 + Math.cos(ph) * rr));
      }
      rows.push(row);
    }
    sheet(name, ch, rows, null, (t, s) => .75 + .25 * (.5 + .5 * Math.sin(s * PI * (o.pleats ?? 9) + t * 2)));
    if (o.trim) { const hem = rows[NR], side = rows.map(r => r[0]), side2 = rows.map(r => r[NC]); for (const line of [hem, side, side2]) addGeoS('cape', o.trim, tubeG(line, .022 * W, 6)) }
  }

  // ================= roupas com caimento (envoltória) =================
  // O pano não copia o corpo: cada seção do tronco vira o contorno CONVEXO (passa por cima do vão entre
  // seios, sulcos do cacto, coluna e entre as pernas), cai do ponto mais largo com inclinação limitada
  // (não "gruda" na cintura) e só é puxado para dentro onde há cinto. Mangas são cones pelo eixo do braço
  // unidos ao tronco com transição suave. O corpo + folga entra só como piso: a pele nunca atravessa.
  const hull2 = pts => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) } for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) } up.pop(); lo.pop(); return lo.concat(up) };
  const rayHull = (h, dx, dz) => { let best = 0; for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue; const t = (a[0] * ez - a[1] * ex) / den, s = (a[0] * dz - a[1] * dx) / den; if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6) best = Math.max(best, t) } return best };
  function envelope(yTop, yBot, o = {}) {
    const NA = 96, NY = Math.max(4, Math.ceil((yTop - yBot) / (.025 * clamp(W, 1, 1.3)))), dy = (yTop - yBot) / NY, R = new Float32Array((NY + 1) * NA);
    const hang = o.hang ?? .3, ease = o.ease ?? .08 * W;
    // A folga acompanha a espessura real da seção, inclusive no corpo magro.
    // A queda tem limite: a largura do ombro não pode virar uma caixa até a cintura.
    const fitScale = clamp(1 + .22 * (body.build?.weight || 0), .75, 1.22);
    const bridge = (o.drape ?? .025 * W) * fitScale;
    let prev = null;
    for (let i = 0; i <= NY; i++) {
      const y = yTop - i * dy, raw = [], pts = [];
      for (let k = 0; k < NA; k++) { const a = -PI + 2 * PI * k / NA, r = radAt(y, a); raw.push(r); pts.push([Math.sin(a) * r, Math.cos(a) * r]) }
      const h = hull2(pts), row = new Float32Array(NA);
      for (let k = 0; k < NA; k++) { const a = -PI + 2 * PI * k / NA, rh = h.length > 2 ? rayHull(h, Math.sin(a), Math.cos(a)) || raw[k] : raw[k]; let r = prev ? Math.max(rh, Math.min(prev[k] - hang * dy, rh + bridge)) : rh; if (o.cinch) r = lerp(r, rh, (o.cinchK ?? .8) * Math.exp(-(((y - o.cinch) / (o.cinchW ?? .12)) ** 2))); row[k] = r }
      prev = row;
      const below = o.flareFrom != null ? Math.max(0, o.flareFrom - y) : 0;
      for (let k = 0; k < NA; k++) { const a = -PI + 2 * PI * k / NA; R[i * NA + k] = row[k] + ease * fitScale * clamp(row[k] / (.8 * W), .55, 1) + (o.flare || 0) * below + (o.folds || 0) * Math.sin(a * (o.foldN || 14) + (o.foldTwist || 0) * y) * Math.min(1, below * 2) + (o.back || 0) * Math.max(0, -Math.cos(a)) * below }
    }
    // alisa a tabela (ângulo e altura) para não sobrar degrau de medida
    const tmp = new Float32Array(R.length);
    for (let pass = 0; pass < (o.smooth ?? 10); pass++) {
      if (pass < 5) for (let i = 0; i <= NY; i++) for (let k = 0; k < NA; k++) R[i * NA + k] = Math.max(R[i * NA + k], 0);
      for (let i = 0; i <= NY; i++) for (let k = 0; k < NA; k++) tmp[i * NA + k] = (R[i * NA + (k + NA - 1) % NA] + 2 * R[i * NA + k] + R[i * NA + (k + 1) % NA]) / 4;
      for (let i = 0; i <= NY; i++) for (let k = 0; k < NA; k++) { const a = Math.max(0, i - 1), b = Math.min(NY, i + 1); R[i * NA + k] = (tmp[a * NA + k] + 2 * tmp[i * NA + k] + tmp[b * NA + k]) / 4 }
    }
    const fn = (x, y, z) => {
      const ph = Math.atan2(x, z - z0), rho = sqrt(x*x+(z-z0)*(z-z0));
      const fy = clamp((yTop - y) / dy, 0, NY), i0 = Math.min(NY - 1, Math.floor(fy)), ty = fy - i0;
      const fa = (ph + PI) / (2 * PI) * NA, k0 = Math.floor(fa), ta = fa - k0, ka = ((k0 % NA) + NA) % NA, kb = (ka + 1) % NA;
      const r = lerp(lerp(R[i0 * NA + ka], R[i0 * NA + kb], ta), lerp(R[(i0 + 1) * NA + ka], R[(i0 + 1) * NA + kb], ta), ty);
      return (rho - r) * .9;
    };
    fn.radius = (y, ph) => { const fy = clamp((yTop - y) / dy, 0, NY), i0 = Math.min(NY - 1, Math.floor(fy)), ty = fy - i0, fa = (ph + PI) / (2 * PI) * NA, k0 = Math.floor(fa), ta = fa - k0, ka = ((k0 % NA) + NA) % NA, kb = (ka + 1) % NA; return lerp(lerp(R[i0 * NA + ka], R[i0 * NA + kb], ta), lerp(R[(i0 + 1) * NA + ka], R[(i0 + 1) * NA + kb], ta), ty) };
    return fn;
  }
  const capR = (px, py, pz, a, b, ra, rb) => { const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, t = clamp(((px - a.x) * abx + (py - a.y) * aby + (pz - a.z) * abz) / (abx * abx + aby * aby + abz * abz), 0, 1); return { d: sqrt((px-a.x-abx*t)**2+(py-a.y-aby*t)**2+(pz-a.z-abz*t)**2) - lerp(ra, rb, t), t } };
  // Peça com caimento. Retorna o campo sólido (para cintos/detalhes assentarem por cima) e o campo final.
  function garment(name, ch, slot, o) {
    const yTop = o.top, yBot = o.bottom, env = envelope(yTop + .15, yBot - .05, o.env || {}), t = o.t ?? .05 * W;
    let sl = null;
    if (o.sleeve) {
      const s0 = S.clone().add(V(-.18 * W, .04, 0)), endT = o.sleeve === 'wrist' ? 1 : o.sleeve === 'forearm' ? .72 : o.sleeve === 'elbow' ? 0 : null;
      const end = endT != null ? E.clone().lerp(Wr, endT).addScaledVector(dF, endT === 1 ? -.04 : 0) : S.clone().lerp(E, o.short ?? .55);
      const se = o.sleeve === 'short' ? null : E, dirEnd = o.sleeve === 'short' ? dU : dF, ease = o.sleeveEase ?? .07 * W;
      const rS = limbR(S.clone().lerp(E, .2), dU) + ease + .04 * W, rE = limbR(E, dF) + ease, rEnd = limbR(end, dirEnd) + ease + (o.bell || 0);
      const rMid = o.sleeve === 'short' ? lerp(rS, rE, o.short ?? .55) + (o.bell || 0) : rE + (o.bell || 0) * .25;
      sl = { s0, se, end, dirEnd, rS, rE: rMid, rEnd, puff: o.puff || 0 };
      const r=Math.max(rS,rMid,rEnd)+(o.puff||0),pts=[s0,end,...(se?[se]:[])];
      sl.box={lo:V(...['x','y','z'].map(k=>Math.min(...pts.map(p=>p[k]))-r)),hi:V(...['x','y','z'].map(k=>Math.max(...pts.map(p=>p[k]))+r))};
    }
    const sleeveF = (ax, y, z) => {
      if (!sl) return 9;
      if (!sl.se) { const q = capR(ax, y, z, sl.s0, sl.end, sl.rS, sl.rEnd); return q.d - sl.puff * Math.sin(PI * q.t) }
      const a = capR(ax, y, z, sl.s0, sl.se, sl.rS, sl.rE), b = capR(ax, y, z, sl.se, sl.end, sl.rE, sl.rEnd);
      return Math.min(a.d - sl.puff * Math.sin(PI * a.t), b.d);
    };
    const over=o.over?memoField(o.over):null;
    const solid = memoField((x, y, z) => {
      const ax = Math.abs(x), as = armSide(ax, y);
      let d = env(x, y, z);
      if (as > -.1 * W) d = Math.max(d, as - (o.shoulderPad ?? .1) * W); // o tronco não engole o braço
      if (sl) { const {lo,hi}=sl.box,k=o.blend??.14*W;
        if(Math.max(lo.x-ax,ax-hi.x,lo.y-y,y-hi.y,lo.z-z,z-hi.z)<=d+k)d=smin(d,sleeveF(ax,y,z),k);
      }
      d = Math.min(d, bf(x, y, z) - t);
      if (o.over && as < -.05 * W) d = Math.min(d, over(x, y, z) - (o.overGap ?? .09 * W)); // camada de fora: sempre acima da de dentro
      return d;
    });
    const cut = (x, y, z, d) => {
      const ax = Math.abs(x), as = armSide(ax, y), ph = o.open||o.hemCurve ? Math.abs(phiOf(x, z)) : 0;
      const neck = y - yTop + (o.vneck ? o.vneck * Math.max(0, 1 - ax / (.28 * W)) * sstep(z0, z0 + .2, z) : 0) + (o.backNeck || 0) * sstep(z0, z0 - .3, z);
      d = smax(d, neck - (o.edge ? o.edge(ax, y, z) : 0), .02);
      d = Math.max(d, sl ? Math.min(yBot - y - (o.hemCurve || 0) * (1 - Math.cos(ph)) * .5, -as - .02 * W) : yBot - y - (o.hemCurve || 0) * (1 - Math.cos(ph)) * .5); // barra (as mangas continuam abaixo dela)
      if (sl) d = Math.max(d, Math.min(along(ax, y, z, sl.end, sl.dirEnd), as + .1 * W)); else d = Math.max(d, as - (o.shoulderPad ?? .1) * W);
      if (o.open) d = Math.max(d, (o.open * (o.openTaper ? lerp(1, o.openTaper, clamp((yTop - y) / (yTop - yBot), 0, 1)) : 1) - ph) * .5 * Math.hypot(x, z - z0));
      return d;
    };
    const th = o.thick ?? .09 * W, hollow = !!o.hollow; // oco: só o vão entre (corpo + folga) e a parede interna do pano
    const field = (x, y, z) => { const s = solid(x, y, z); let d = cut(x, y, z, s); if (hollow) d = Math.max(d, Math.min(-(s + th), bf(x, y, z) - t - .01)); if (o.over && armSide(Math.abs(x), y) < -.05 * W) d = Math.max(d, .012 - over(x, y, z)); return d };
    let geo = null;
    const pad = (o.env?.flare || 0) * (yTop - yBot) + (o.bell || 0) + .5;
    const bounds = { x: bx + pad, y0: yBot - .1 - (o.hemCurve || 0), y1: yTop + .25, z0: zA - pad, z1: zB + pad };
    if (o.split != null) { const sp = o.split; for (const part of ['upper', 'lower']) { const oo = o; activeSlot = part; const f2 = (x, y, z) => { const s = solid(x, y, z); let d = cut(x, y, z, s); d = Math.max(d, part === 'upper' ? sp - .012 - y : y - sp - .012); if (hollow) d = Math.max(d, Math.min(-(s + th), bf(x, y, z) - t - .01)); if (o.over && armSide(Math.abs(x), y) < -.05 * W) d = Math.max(d, .012 - over(x, y, z)); return d }; piece(name + (part === 'upper' ? '' : '_Saia'), ch, f2, part === 'upper' ? { ...bounds, y0: sp - .1 } : { ...bounds, y1: sp + .1 }, o.cell) } }
    else { activeSlot = slot; geo = piece(name, ch, field, bounds, o.cell, hollow?{solid,clip:(x,y,z)=>cut(x,y,z,-1e9),thickness:Math.min(.04*W,t*.6)}:null) }
    const outer = memoField((x, y, z) => cut(x, y, z, solid(x, y, z)));
    return { solid, outer, env, sl, geo, o };
  }
  // ponto na superfície de um campo, vindo pela frente (ou pela direção ph)
  const surfAt = (fn, y, ph = 0, off = 0, cx = 0) => { const dx = Math.sin(ph), dz = Math.cos(ph); let r = 2.5 * W + 1.2; for (let k = 0; k < 160; k++) { const d = fn(cx + dx * r, y, z0 + dz * r); if (d < 1e-3) break; r -= Math.max(d * .9, .004); if (r < .01) break } r += off; return V(cx + dx * r, y, z0 + dz * r) };
  const gradN = (fn, p) => { const e = .02; return V(fn(p.x + e, p.y, p.z) - fn(p.x - e, p.y, p.z), fn(p.x, p.y + e, p.z) - fn(p.x, p.y - e, p.z), fn(p.x, p.y, p.z + e) - fn(p.x, p.y, p.z - e)).normalize() };
  // cinto/faixa assentado sobre uma peça (não sobre a pele)
  function beltOn(name, ch, base, yc, h, t, o = {}) {
    if (onlySlot && onlySlot !== 'belt') return; activeSlot = 'belt';
    t = Math.max(t, .045 * W);
    const f = (x, y, z) => { const b0 = base(x, y, z); let d = Math.max(b0 - t, .003 - b0, Math.abs(y - yc - (o.tilt || 0) * Math.abs(x)) - h / 2); if (armSide(Math.abs(x), y) > -.03 * W) d = Math.max(d, .05); return d };
    piece(name, ch, f, bodyBounds(yc - h - .4, yc + h + .4, .8), o.cell ?? cellBase * .6);
  }
  const addGeoS = (slot, ch, g) => { const prev = detailSlot; detailSlot = slot; addGeo(ch, g); detailSlot = prev };
  function sleeveCuffs(gm, slot, ch, w = .06 * W) {
    if (!gm.sl || (onlySlot && onlySlot !== slot)) return;
    mirror(s => { const c = gm.sl.end, d = gm.sl.dirEnd, g = new THREE.TorusGeometry(gm.sl.rEnd + .005, w * .5, 10, 40); addGeoS(slot, ch, orient(g, V(s * c.x, c.y, c.z).addScaledVector(V(s * d.x, d.y, d.z), -w * .4), V(s * d.x, d.y, d.z))) });
  }
  // borda (gola, barra) seguindo o contorno da peça numa altura
  function rim(slot, ch, fn, y, r = .03 * W, o = {}) {
    if (onlySlot && onlySlot !== slot) return;
    const pts = [], a0 = o.a0 ?? -PI, a1 = o.a1 ?? PI, n = 96;
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); const yy = typeof y === 'function' ? y(a) : y; pts.push(surfAt(fn, yy, a, o.off ?? r * .3)) }
    addGeoS(slot, ch, tubeG(pts, r, 8));
  }
  const button = (slot, ch, fn, x, y, r = .05 * W) => { if (onlySlot && onlySlot !== slot) return; const p = surfAt(fn, y, Math.atan2(x, .5), .005); const n = gradN(fn, p); const g = new THREE.SphereGeometry(r, 16, 10); g.scale(1, 1, .45); addGeoS(slot, ch, orient(g, p, n)) };
  const buckle = (slot, ch, fn, y, w = .2 * W, h = .15 * W) => { if (onlySlot && onlySlot !== slot) return; const p = surfAt(fn, y, 0, .01); const g = new RoundedBoxGeometry(w, h, .035, 3, .015); addGeoS(slot, ch, orient(g, p, V(0, 0, 1))); const g2 = new RoundedBoxGeometry(w * .6, h * .45, .04, 2, .01); addGeoS(slot, 'leather', orient(g2, p.clone().add(V(0, 0, .012)), V(0, 0, 1))) };
  // Debrum: lê a borda cortada da própria malha (cava ou abertura da frente) e cobre com um tubo liso.
  // O corte do campo deixa a aresta em degraus de célula; o debrum esconde e dá acabamento de costura.
  function edgeTube(gm, kind, ch, slot, r = .03 * W) {
    const g = gm && gm.geo; if (!g || (onlySlot && onlySlot !== slot)) return;
    const o = gm.o, p = g.attributes.position, tol = (o.cell || cellBase) * .9, lines = [];
    if (kind === 'arm') {
      const pad = (o.shoulderPad ?? .1) * W, C = V(S.x, S.y, S.z).add(V(nArm.x, nArm.y, 0).multiplyScalar(pad - armSide(S.x, S.y))), t1 = V(-nArm.y, nArm.x, 0), NB = 72, best = new Array(NB).fill(null);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (x <= 0 || Math.abs(armSide(x, y) - pad) > tol) continue; const q = V(x, y, z).sub(C), th = Math.atan2(q.z, q.dot(t1)), k = Math.floor((th + PI) / (2 * PI) * NB) % NB, dd = q.length(); if (!best[k] || dd > best[k].d) best[k] = { d: dd, v: V(x, y, z) } }
      let run = []; const start = best.findIndex(b => !b);
      for (let n = 0; n < NB; n++) { const b = best[((start < 0 ? 0 : start) + n) % NB]; if (b) run.push(b.v.clone().add(b.v.clone().sub(C).normalize().multiplyScalar(r * .3))); else { if (run.length > 3) lines.push(run); run = [] } }
      if (run.length > 3) { if (start < 0) run.push(run[0].clone()); lines.push(run) }
    } else {
      const yTop = o.top, yBot = o.bottom, NB = 60, best = new Array(NB).fill(null), openAt = y => o.open * (o.openTaper ? lerp(1, o.openTaper, clamp((yTop - y) / (yTop - yBot), 0, 1)) : 1);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (x <= 0 || z < z0) continue; const rho = sqrt(x*x+(z-z0)*(z-z0)); if (Math.abs(Math.abs(phiOf(x, z)) - openAt(y)) * rho > tol) continue; const k = Math.floor(clamp((yTop - y) / (yTop - yBot), 0, .9999) * NB); if (!best[k] || rho > best[k].d) best[k] = { d: rho, v: V(x, y, z) } }
      let run = []; for (const b of best) { if (b) run.push(b.v.clone().add(V(b.v.x, 0, b.v.z - z0).normalize().multiplyScalar(r * .3))); else { if (run.length > 3) lines.push(run); run = [] } } if (run.length > 3) lines.push(run);
    }
    for (const line of lines) {
      for (let pass = 0; pass < 3; pass++) for (let i = 1; i + 1 < line.length; i++) line[i] = line[i - 1].clone().add(line[i + 1]).multiplyScalar(.25).add(line[i].clone().multiplyScalar(.5));
      mirror(sg => addGeoS(slot, ch, tubeG(line.map(v => V(sg * v.x, v.y, v.z)), r, 8)));
    }
  }
  // calça: perna = cone pelo eixo do quadril ao tornozelo, unida ao corpo com folga (cai reta, sem marcar a coxa)
  function trousers(name, ch, o) {
    activeSlot = 'lower'; // o campo sai sempre (camadas de fora consultam a calça); a malha só no slot certo
    const yTop = Y(o.top), yBot = A.y + (o.cuff ?? .06) * Lb, ease = o.ease ?? .06 * W;
    const rH = limbR(H.clone().lerp(K, .25), K.clone().sub(H).normalize()) + ease, rK = limbR(K, A.clone().sub(K).normalize()) + ease + (o.knee || 0), rA2 = limbR(A.clone().lerp(K, .15), A.clone().sub(K).normalize()) + ease + (o.flareLeg || 0);
    const H2 = H.clone().add(V(0, .05, 0)), A2 = A.clone().add(V(0, -.1, 0));
    const f = (x, y, z) => {
      const ax = Math.abs(x); if (armSide(ax, y) > 0) return .5;
      const a = capR(ax, y, z, H2, K, rH, rK), b = capR(ax, y, z, K, A2, rK, rA2);
      let d = Math.min(a.d - (o.puff || 0) * Math.sin(PI * a.t), b.d - (o.puff || 0) * Math.sin(PI * b.t) * .6);
      d = smin(d, bf(x, y, z) - (o.t ?? .045 * W), .12 * W);
      if (o.under && y > o.under.y) d = Math.max(d, o.under.fn(x, y, z) + .02 * W); // por dentro da túnica: não atravessa
      return Math.max(d, y - yTop, yBot - y);
    };
    piece(name, ch, f, { x: Math.max(W*Math.max(B.hip,B.waist)*1.2+.4*W,H.x+rH+(o.puff||0)+.3*W), y0: yBot - .2, y1: yTop + .2, z0: zA - .3, z1: zB + .3 }, o.cell);
    return memoField(f);
  }

  // Reino da Lua: quatro conjuntos novos, com as mesmas envoltórias e caches do catálogo.
  if(['lunar_explorer','lunar_guardian','lunar_inventor','lunar_ruby'].includes(style)){
    const magic=style==='lunar_guardian'||style==='lunar_ruby',nico=style==='lunar_inventor';
    const g=garment(magic?'Vestido_lunar':nico?'Camisa_inventor':'Jaqueta_lunar',nico?'secondary':'fabric','upper',{
      top:yN+.08,bottom:Y(magic?.97:nico?.38:.37),split:magic?Y(.345):null,t:.045*W,cell:.035*clamp(W,1,1.3),
      sleeve:magic?'short':'forearm',short:.8,sleeveEase:.045*W,puff:(magic?.025:.06)*W,vneck:magic?.14:.035,
      env:{ease:.045*W,hang:.5,cinch:Y(.33),cinchK:.8,flareFrom:Y(.36),flare:magic?.18:.06,folds:(magic?.028:.012)*W,foldN:14}
    });
    sleeveCuffs(g,'upper',magic?'trim':'leather',.035*W);
    rim('upper','trim',g.outer,a=>yN+.075-(magic?.14:.035)*Math.max(0,Math.cos(a))**6,.017*W);
    const sew=(slot,y,ph=0,r=.15*W,ch='trim',fn=g.solid)=>{
      const p=surfAt(fn,y,ph,.024*W),geo=crescent(r,.018*W);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,0,1),V(Math.sin(ph),0,Math.cos(ph))));geo.translate(...p.toArray());addGeoS(slot,ch,geo);
    };
    beltOn('Cinto_lunar','leather',g.solid,Y(.34),.09*W,.025*W);
    sew('belt',Y(.34),0,.12*W);
    if(magic){
      rim('lower','trim',g.outer,Y(.97)+.015,.02*W);
      cape('Capa_lunar','accent',{top:.025,yBottom:Y(.975),span:4.6,flare:.45,pleats:10,over:g.env,trim:'trim'});
      // Símbolos do manto assentados na superfície de trás, sem texturas e sem shaders exclusivos.
      for(const [f,r] of [[.13,.13],[.55,.18],[.8,.12]]){
        const y=Y(f),p=surfAt(g.env,y,PI,.10*W+.45*(f/.975)),geo=crescent(r*W,.018*W);geo.rotateY(PI);geo.translate(...p.toArray());addGeoS('cape','trim',geo);
      }
      for(const side of [-1,1])button('upper','trim',g.outer,side*.42*W,Y(.07),.09*W);
      boots('Sapatos_lunares','leather',{t:.04*W,h:.06,toe:.025});
      // Um cajado de formas simples mantém a leitura da referência sem efeitos pesados.
      const x=Wr.x+.24*W,y0=ySole+.08,y1=yN+.25;
      addGeoS('extras','leather',tubeG([V(x,y0,.18),V(x,(y0+y1)/2,.18),V(x,y1,.18)],.035*W));
      const moon=crescent(.24*W,.045*W);moon.translate(x,y1+.19,.18);addGeoS('extras','trim',moon);
      addGeoS('extras','gem',sph(V(x+.055*W,y1+.18,.2),.1*W));
    }else{
      trousers(nico?'Calca_jardineira':'Calca_cargo','pants',{top:.35,ease:.055*W,cuff:.07,puff:.045*W,under:{fn:g.solid,y:Y(.38)+.03}});
      boots('Tenis','leather',{t:.085*W,h:.1,cuffT:.035*W,toe:.07});
      if(nico){
        // Peitoral e alças usam a frente medida da camisa, sem painéis flutuantes.
        if(g.geo){
          // Recorta a própria malha da camisa: o peitoral acompanha exatamente sua superfície.
          // Não se malha uma parede SDF muito fina, que gerava furos e degraus no painel azul.
          const source=g.geo.clone(),p=source.attributes.position,n=source.attributes.normal;
          for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.035*W,p.getY(i)+n.getY(i)*.035*W,p.getZ(i)+n.getZ(i)*.035*W);
          addGeoS('upper','fabric',shellCloth(source,(x,y,z)=>Math.max(y-Y(.13),Y(.35)-y,Math.abs(x)-.38*W,z0+.02-z),.018*W));
        }
        for(const side of [-1,1]){const pts=[];for(let i=0;i<=22;i++)pts.push(surfAt(g.solid,Y(.04+i/22*.145),side*.43,.035*W));addGeoS('upper','fabric',tubeG(pts,.045*W));button('upper','trim',g.outer,side*.26*W,Y(.16),.036*W)}
      }else{
        sew('upper',Y(.16),0,.15*W);
        for(const side of [-1,1]){const pts=[];for(let i=0;i<=24;i++)pts.push(surfAt(g.solid,Y(.065+i/24*.26),side*.55,.024*W));addGeoS('upper','trim',tubeG(pts,.009*W))}
      }
      // Mochila, bolso e rolo: poucas peças arredondadas, exportáveis e opcionais no slot Extras.
      const p=V(0,Y(.17),backZ(0,Y(.17))-.22*W),pack=new RoundedBoxGeometry(.72*W,.82*W,.31*W,4,.09*W);pack.translate(...p.toArray());addGeoS('extras','leather',pack);
      const flap=new RoundedBoxGeometry(.58*W,.34*W,.09*W,3,.04*W);flap.translate(p.x,p.y+.17*W,p.z-.19*W);addGeoS('extras','fabric',flap);
      const moon=crescent(.13*W,.022*W);moon.rotateY(PI);moon.translate(p.x,p.y+.17*W,p.z-.25*W);addGeoS('extras','trim',moon);
      for(const side of [-1,1]){const points=[];for(let i=0;i<=22;i++)points.push(surfAt(g.solid,Y(.035+i/22*.25),side*.48,.055*W));addGeoS('extras','leather',tubeG(points,.034*W))}
      if(nico){const roll=new THREE.CylinderGeometry(.07*W,.07*W,.63*W,24);roll.translate(p.x+.43*W,p.y+.25*W,p.z);addGeoS('extras','secondary',roll)}
      // Bolsos cargo presos nas laterais da calça.
      for(const side of [-1,1]){const cp=V(side*(H.x+.16*W),Y(.48),frontZ(side*H.x,Y(.48))+.09*W),pocket=new RoundedBoxGeometry(.24*W,.3*W,.09*W,3,.03*W);pocket.translate(...cp.toArray());addGeoS('lower','leather',pocket)}
    }
    return;
  }

  // ================= figurinos =================
  if (style === 'casual') { // túnica com caimento, cinto, calça reta e botas (Cute)
    const g = garment('Tunica', 'fabric', 'upper', { top: yN + .03, bottom: Y(.5), t: .05 * W, sleeve: 'forearm', sleeveEase: .06 * W, puff: .03 * W, bell: .04 * W, vneck: .1, env: { ease: .08 * W, hang: .25, cinch: Y(.36), cinchK: .55, flareFrom: Y(.38), flare: .18, folds: .012 * W, foldN: 12 }, hemCurve: .03 });
    sleeveCuffs(g, 'upper', 'trim', .05 * W);
    rim('upper', 'trim', g.outer, a => yN + .03 - .1 * Math.max(0, Math.cos(a)) ** 6 - .01, .022 * W);
    rim('upper', 'trim', g.outer, a => Y(.5) + .005 + .03 * (1 - Math.cos(a)) * .5, .022 * W);
    for (const f of [.11, .17, .23]) button('upper', 'trim', g.outer, 0, Y(f), .045 * W);
    trousers('Calca', 'secondary', { top: .36, ease: .05 * W, cuff: .18, under: { fn: g.solid, y: Y(.5) + .03 } });
    boots('Botas', 'leather', { t: .07 * W, h: .2, cuffT: .07 * W, toe: .02 });
    beltOn('Cinto', 'leather', g.solid, Y(.36), .1 * W, .03 * W);
    buckle('belt', 'trim', (x, y, z) => g.solid(x, y, z) - .05 * W, Y(.36), .2 * W, .14 * W);
  }

  if (style === 'royal') { // manto real: túnica longa em A, mangas em sino, gola de arminho, capa e broche
    const sp = Y(.37);
    const g = garment('Manto', 'fabric', 'upper', { top: yN + .03, bottom: A.y + .1 * Lb, split: sp, t: .06 * W, sleeve: 'wrist', sleeveEase: .08 * W, bell: .22 * W, vneck: .04, env: { ease: .1 * W, hang: .22, cinch: Y(.36), cinchK: .5, flareFrom: Y(.4), flare: .3, folds: .025 * W, foldN: 11, back: .08, smooth: 18 }, hemCurve: .02 });
    sleeveCuffs(g, 'upper', 'secondary', .1 * W);
    rim('lower', 'trim', g.outer, A.y + .1 * Lb + .02, .03 * W);
    if (!onlySlot || onlySlot === 'upper') { // arminho: murça (capinha) sobre os ombros, borda em gomos, rolo na gola e caudas pretas
      activeSlot = 'upper';
      const yHem = (x, z) => { const ph = phiOf(x, z); return yN - .55 * W - .06 * W * Math.cos(ph) + .035 * W * Math.abs(Math.sin(ph * 9)) };
      const cap = (x, y, z) => Math.max(g.solid(x, y, z) - .09 * W, .01 - g.solid(x, y, z), y - yN - .05, yHem(x, z) - y);
      piece('Arminho', 'secondary', cap, { x: bx + .6, y0: yN - .8 * W - .2, y1: yN + .3, z0: zA - .5, z1: zB + .5 }, cellBase * .75);
      const pts = []; for (let i = 0; i <= 96; i++) { const a = -PI + 2 * PI * i / 96; pts.push(surfAt(g.solid, yN - .02, a, .06 * W)) }
      addGeoS('upper', 'secondary', tubeG(pts, .1 * W, 12));
      for (let i = 0; i < 22; i++) { const a = -PI + 2 * PI * (i + .5) / 22, y = yN - .2 * W - (i % 2) * .17 * W, q = surfAt(cap, y, a, -.004), n = gradN(cap, q); const t = new THREE.ConeGeometry(.03 * W, .11 * W, 8); t.rotateX(PI); addGeoS('upper', 'leather', orient(t, q, n)) }
    }
    beltOn('Cinto', 'leather', g.solid, Y(.36), .1 * W, .035 * W);
    buckle('belt', 'trim', (x, y, z) => g.solid(x, y, z) - .055 * W, Y(.36), .22 * W, .15 * W);
    if (!onlySlot || onlySlot === 'upper') { const p = surfAt(g.outer, Y(.1), 0, .01); addGeoS('upper', 'trim', orient(new THREE.CylinderGeometry(.11 * W, .11 * W, .04, 28).rotateX(PI / 2), p, V(0, 0, 1))); addGeoS('upper', 'gem', orient(new THREE.OctahedronGeometry(.07 * W, 0).scale(1, 1.25, .5), p.clone().add(V(0, 0, .03)), V(0, 0, 1))) }
    cape('Capa', 'accent', { top: .02, yBottom: A.y + .02 * Lb, span: 3.3, flare: .55, pleats: 8, over: g.env, trim: 'trim' });
    boots('Sapatos', 'leather', { t: .05 * W, h: .07, toe: .04 });
  }

  if (style === 'inventor') { // jaleco longo aberto sobre colete, gravata, calça e sapatos (alquimista)
    const vest = garment('Colete', 'secondary', 'upper', { top: yN + .02, bottom: Y(.42), t: .04 * W, vneck: .2, env: { ease: .05 * W, hang: .3 } });
    for (const f of [.17, .22, .27, .32]) button('upper', 'trim', vest.outer, 0, Y(f), .03 * W);
    const legs = trousers('Calca', 'secondary', { top: .4, ease: .05 * W, cuff: .1, under: { fn: vest.solid, y: Y(.42) + .03 } });
    // Fora dos recortes verticais uma camada interna já não pode apoiar a superfície do jaleco.
    const lining=(x,y,z)=>Math.min(y>=Y(.42)-.16*W?vest.outer(x,y,z):1000,y<=Y(.4)+.16*W?legs(x,y,z):1000);
    const coat = garment('Jaleco', 'fabric', 'upper', { over: lining, overGap: .07 * W, top: yN + .06, bottom: Y(.76), t: .1 * W, sleeve: 'wrist', sleeveEase: .07 * W, bell: .03 * W, open: .3, openTaper: 1.25, hollow: true, cell: cellBase, env: { ease: .14 * W, hang: .2, flareFrom: Y(.4), flare: .12, folds: .012 * W, foldN: 9, back: .03 }, backNeck: -.06 });
    sleeveCuffs(coat, 'upper', 'fabric', .07 * W);
    edgeTube(coat, 'open', 'fabric', 'upper', .03 * W);
    if (!onlySlot || onlySlot === 'upper') {
      mirror(s => { // lapelas largas dobradas e bolsos
        const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = lerp(yN + .02, Y(.3), t), a = s * (.3 * lerp(1, 1.25, (yN + .06 - y) / (yN + .06 - Y(.76))) + .03 + .22 * Math.sin(PI * Math.min(1, t * 1.3))); pts.push(surfAt(coat.solid, y, a, .015)) }
        addGeoS('upper', 'fabric', tubeG(pts, .045 * W, 8));
        const pk = surfAt(coat.solid, Y(.48), s * .75, .012); const gp = new RoundedBoxGeometry(.36 * W, .3 * W, .035, 3, .015); addGeoS('upper', 'fabric', orient(gp, pk, gradN(coat.solid, pk)));
        const pk2 = surfAt(coat.solid, Y(.48) + .15 * W, s * .75, .03); addGeoS('upper', 'trim', orient(new RoundedBoxGeometry(.36 * W, .025 * W, .02, 2, .008), pk2, gradN(coat.solid, pk2)));
      });
      const tie = []; for (let i = 0; i <= 10; i++) tie.push(surfAt(vest.outer, lerp(yN - .02, Y(.2), i / 10), 0, .015));
      addGeoS('upper', 'accent', tubeG(tie, .035 * W, 6));
    }
    boots('Sapatos', 'leather', { t: .07 * W, h: .1, toe: .05 });
    beltOn('Cinto', 'leather', vest.solid, Y(.405), .07 * W, .02 * W);
  }

  if (style === 'cowboy') { // camisa, colete aberto de couro, lenço no pescoço, cinturão de fivela grande, calça e botas
    const shirt = garment('Camisa', 'fabric', 'upper', { top: yN + .02, bottom: Y(.46), t: .045 * W, sleeve: 'wrist', sleeveEase: .06 * W, puff: .03 * W, vneck: .06, env: { ease: .06 * W, hang: .3, cinch: Y(.39), cinchK: .4 } });
    sleeveCuffs(shirt, 'upper', 'fabric', .07 * W);
    const vest = garment('Colete', 'leather', 'upper', { over: shirt.outer, top: yN - .02, bottom: Y(.41), t: .09 * W, open: .28, openTaper: 1.6, hollow: true, cell: cellBase * .7, env: { ease: .12 * W, hang: .25 }, shoulderPad: .02, hemCurve: .05 });
    edgeTube(vest, 'arm', 'leather', 'upper', .03 * W);
    edgeTube(vest, 'open', 'trim', 'upper', .022 * W);
    if (!onlySlot || onlySlot === 'upper') mirror(s => { const pk = surfAt(vest.outer, Y(.24), s * .62, .006); addGeoS('upper', 'trim', orient(new THREE.TorusGeometry(.06 * W, .012 * W, 6, 5), pk, V(Math.sin(s * .62), 0, Math.cos(s * .62)))); for (let i = 0; i < 3; i++) button('upper', 'trim', vest.outer, s * .3 * W, Y(.25 + i * .05), .03 * W) });
    rim('upper', 'trim', vest.outer, a => Y(.41) + .005 + .05 * (1 - Math.cos(a)) * .5, .02 * W, { a0: -PI + .1, a1: -.33 });
    rim('upper', 'trim', vest.outer, a => Y(.41) + .005 + .05 * (1 - Math.cos(a)) * .5, .02 * W, { a0: .33, a1: PI - .1 });
    if (!onlySlot || onlySlot === 'extras') { // lenço: rolo no pescoço + ponta triangular caindo no peito
      const pts = []; for (let i = 0; i <= 64; i++) { const a = -PI + 2 * PI * i / 64; pts.push(surfAt(shirt.solid, yN - .04 + .03 * Math.cos(a), a, .03)) } addGeoS('extras', 'secondary', tubeG(pts, .07 * W, 10));
      const rows = []; for (let i = 0; i <= 10; i++) { const t = i / 10, row = []; for (let j = 0; j <= 10; j++) { const s2 = (j / 10 - .5) * 2 * (1 - t) * .32 * W, y = yN - .06 - t * .3 * W * 1.4; row.push(surfAt(shirt.solid, y, Math.atan2(s2, .6), .05)) } rows.push(row) }
      sheet('Lenco', 'secondary', rows, null, (t, s2) => .85 + .15 * Math.cos((s2 - .5) * 4));
    }
    trousers('Calca', 'pants', { top: .38, ease: .06 * W, cuff: .245, flareLeg: .02 * W, under: { fn: shirt.solid, y: Y(.46) + .03 } });
    boots('Botas', 'leather', { t: .07 * W, h: .27, cuffT: .1 * W, toe: .05 });
    const beltBase = (x, y, z) => Math.min(shirt.solid(x, y, z), bf(x, y, z) - .1 * W);
    beltOn('Cinturao', 'leather', beltBase, Y(.43), .11 * W, .02 * W, { tilt: .06 });
    buckle('belt', 'trim', (x, y, z) => beltBase(x, y, z) - .035 * W, Y(.43), .3 * W, .22 * W);
  }

  if (style === 'dress') { // vestido: corpete justo com mangas bufantes curtas e saia rodada com pregas
    const sp = Y(.34);
    const g = garment('Vestido', 'fabric', 'upper', { top: yN - .06, bottom: Y(.78), split: sp, t: .035 * W, sleeve: 'short', short: .5, puff: .1 * W, sleeveEase: .06 * W, vneck: .12, env: { ease: .04 * W, hang: .5, cinch: Y(.32), cinchK: .9, flareFrom: Y(.34), flare: .55, folds: .05 * W, foldN: 14 }, hemCurve: .02 });
    sleeveCuffs(g, 'upper', 'trim', .035 * W);
    rim('lower', 'trim', g.outer, Y(.78) + .02, .025 * W);
    beltOn('Faixa', 'secondary', g.solid, Y(.33), .1 * W, .025 * W);
    boots('Sapatos', 'leather', { t: .04 * W, h: .06, toe: .03 });
  }

  if (style === 'circus') {
    // macacão listrado (creme / vermelho / azul em faixas verticais) em balão, franzido no tornozelo
    const sw = .3 * W, stripe = k => (x, y, z) => { const u = (x / sw + 30.5) % 3, c = k + .5; let dd = Math.abs(u - c); dd = Math.min(dd, 3 - dd); return (dd - .5) * sw };
    const suit = (x, y, z) => {
      const ax = Math.abs(x); if (armSide(ax, y) > .02 * W) return .5;
      const yTop = Y(.03), yBot = A.y + .085 * Lb, u = clamp((Y(.45) - y) / (Y(.45) - yBot), 0, 1);
      const t = .07 + .2 * W * sstep(Y(.12), Y(.32), y) * (1 - sstep(Y(.36), Y(.48), y)) + .18 * W * Math.pow(Math.sin(PI * u), .8) * (1 - .7 * sstep(.82, 1, u)) * sstep(Y(.4), Y(.5), y);
      return Math.max(bf(x, y, z) - t, y - yTop, yBot - y);
    };
    const bb = bodyBounds(A.y, Y(0) + .2, .7);
    for(const slot of ['upper','lower']){activeSlot=slot;piece('Macacao','stripesV',(x,y,z)=>Math.max(suit(x,y,z),slot==='upper'?Y(.405)-y:y-Y(.395)),bb)} // listras verticais creme/vermelho/azul pelo material (bordas nítidas)
    // casaca aberta com abas até o joelho, mangas com punho franzido
    top('Casaca', 'fabric', { t: .1 * W, sleeve: 'wrist', bottom: .3, collar: -.05, open: .75, cell: cellBase, puff: .04 * W, loose: .12 * W });
    cone('Casaca_Abas', 'fabric', { top: .29, bottom: .68, pad: .26 * W, flare: .1, open: 1.05, th: .035, ragged: .12, pleat: .035, pleatN: 9 });
    detailSlot = 'upper';
    mirror(s => { for (const [ff, aa] of [[.12, .95], [.2, 1.3], [.4, 1.25], [.55, 1.6], [.33, 2.1], [.6, 2.5], [.45, 2.9]]) { const ph = s * aa, y = Y(ff), r = ff > .29 ? radAt(Y(.29), ph) + .26 * W + .1 * (ff - .29) / .39 * (Y(.29) - Y(.68)) + .06 : radAt(y, ph) + .22 * W + .04; const p = V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r); const g = new THREE.ExtrudeGeometry(starShape(.13 * W, .055 * W), { depth: .02, bevelEnabled: false }); addGeo('trim', orient(g, p, V(Math.sin(ph), 0, Math.cos(ph)))) } });
    // gola franzida dupla (creme com borda dourada) e punhos
    ruffle('Gola', 'secondary', V(0, yN + .1, z0 - .02), V(0, 1, 0), .3 * W + .2, 1.0 * W + .35, 24, .16, .2);
    ruffle('Gola2', 'secondary', V(0, yN - .02, z0 - .02), V(0, 1, 0), .36 * W + .25, 1.15 * W + .45, 20, .18, .3);
    { const ring = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * PI * 2, r = 1.15 * W + .45; ring.push(V(Math.cos(a) * r, yN - .02 + Math.sin(a * 20) * .18 - .3, z0 - .02 + Math.sin(a) * r)) } addGeo('trim', tubeG(ring, .018 * W, 5)) }
    mirror(s => ruffle('Punho', 'secondary', V(s * Wr.x, Wr.y, Wr.z).addScaledVector(V(s * dF.x, dF.y, dF.z), -.06), V(s * dF.x, dF.y, dF.z), limbR(Wr, dF) + .03, limbR(Wr, dF) + .2, 12, .045, .08));
    // suspensórios com botões-estrela, pompons, remendos de coração e estrela
    mirror(s => { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14, x = s * (.36 * W - .06 * W * t), y = Y(.03) + (Y(.27) - Y(.03)) * t; pts.push(onFront(x, y, .08 + .2 * W * sstep(Y(.12), Y(.27), y))) } addGeo('accent', tubeG(pts, .035 * W, 6)); const b = pts[pts.length - 1].clone().add(V(0, 0, .03)); addGeo('trim', orient(new THREE.CylinderGeometry(.075 * W, .075 * W, .025, 20).rotateX(PI / 2), b, V(0, 0, 1))) });
    for (const ff of [.14, .23, .32]) { const y = Y(ff), p = onFront(0, y, .2 * W * sstep(Y(.12), Y(.32), y) + .02); addGeo('fabric', sph(p, .1 * W, 1, 1, .85, 16, 12)) }
    { const hs = new THREE.Shape(); hs.moveTo(0, -.12); hs.bezierCurveTo(.16, .0, .12, .14, 0, .06); hs.bezierCurveTo(-.12, .14, -.16, 0, 0, -.12); addGeo('fabric', flatOnBody(hs.clone(), .42 * W, Y(.33), .015, 0, .2 * W + .04)) }
    addGeo('trim', flatOnBody(starShape(.15 * W, .065 * W), -.45 * W, Y(.38), .015, .2, .2 * W + .04));
    detailSlot = 'feet';
    // meias listradas e sapatões de palhaço (bico enorme, duas cores) + luvas brancas
    boots('Meia', 'stripesH', { t: .035, h: .16 });
    mirror(s => { const toe = V(s * (A.x + .06 * W), ySole + .14 * W, A.z + .42 * W * 1.2 + .1), heel = V(s * A.x, ySole + .14 * W, A.z - .05); addGeo('leather', sph(heel.clone().lerp(toe, .35), .27 * W, 1.05, .75, 1.6, 22, 14)); addGeo('leather', sph(toe, .3 * W, 1.15, .78, 1.05, 22, 14)); addGeo('secondary', sph(toe.clone().add(V(s * .08 * W, .1 * W, .12 * W)), .17 * W, 1.1, .5, .9, 16, 10)); addGeo('secondary', sph(heel.clone().add(V(0, .08 * W, -.05)), .13 * W, 1, .5, .9, 14, 8)); addGeo('leather', sph(V(s * A.x, A.y + .02, A.z), .2 * W, 1, .7, 1, 16, 10)) });
    detailSlot = 'extras';
    if(!onlySlot||onlySlot==='extras')add('Luvas',handPatch(body),'secondary','extras');
  }

  if (style === 'orc') {
    // tanga: cinto grosso de couro com rebites, saiote de tiras de couro, estandarte vermelho na frente
    const yBelt = Y(.4);
    band('Cinto', 'leather', yBelt, .16 * W, .1 * W);
    cone('Saiote', 'leather', { top: .4, bottom: .62, pad: .035 * W, flare: .025, th: .04, ragged: .18, pleat: .018, pleatN: 13, only: ph => Math.abs(Math.sin(ph * 6.5)) < .2 ? .05 : -1 });
    { const zf = frontZ(0, yBelt) + .1 * W, rows = []; for (let i = 0; i <= 26; i++) { const t = i / 26, y = yBelt - .06 - t * .3 * Lb, row = []; for (let j = 0; j <= 16; j++) { const s = j / 16 - .5, w = (.42 - .08 * t) * W; row.push(V(s * 2 * w, y - (t > .85 ? (.5 + .5 * Math.sin(j * 2.3)) * .12 * W : 0), Math.max(frontZ(s * 2 * w * .8, Math.max(y, Y(.47))) + .06, zf - .05 * t) + .04 * Math.sin(s * 6 + t * 3) * t)) } rows.push(row) } sheet('Estandarte', 'fabric', rows, null, (t, s) => .78 + .22 * Math.cos((s - .5) * 3)) }
    detailSlot = 'belt';
    // caveira de fivela com chifres e presas penduradas
    { const p = onFront(0, yBelt + .02, .1 * W + .1); addGeo('secondary', sph(p.clone().add(V(0, .06, 0)), .3 * W, 1, .92, .85, 20, 14)); addGeo('secondary', sph(p.clone().add(V(0, -.2 * W, .06)), .19 * W, 1, .6, .7, 16, 10)); for (let k = -2; k <= 2; k++) { const c = new THREE.ConeGeometry(.03 * W, .12 * W, 6); c.rotateX(PI); c.translate(p.x + k * .06 * W, p.y - .28 * W, p.z + .12 * W); addGeo('secondary', c) }
      mirror(s => { addGeo('leather', sph(p.clone().add(V(s * .11 * W, .08 * W, .22 * W)), .08 * W, 1, 1, .5, 10, 8)); const horn = []; for (let i = 0; i <= 10; i++) { const t = i / 10; horn.push(p.clone().add(V(s * (.25 + .35 * t) * W, (.05 + .2 * t * t) * W, (.02 - .12 * t) * W))) } addGeo('secondary', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(horn), 20, .07 * W, 8)) });
      for (let k = -4; k <= 4; k++) { if (!k) continue; const ph = k * .2, y = yBelt - .1 * W, r = radAt(y, ph) + .14 * W, q = V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r); const c = new THREE.ConeGeometry(.04 * W, .2 * W, 8); c.rotateX(PI); c.translate(0, -.1 * W, 0); c.translate(q.x, q.y, q.z); addGeo('secondary', c); addGeo('trim', sph(q.clone().add(V(0, .02, 0)), .02 * W)) } }
    for (let k = 0; k < 18; k++) { const ph = -PI + k / 18 * 2 * PI, r = radAt(yBelt, ph) + .1 * W + .02; addGeo('trim', sph(V(Math.sin(ph) * r, yBelt, z0 + Math.cos(ph) * r), .03 * W, 1, 1, 1, 8, 6)) }
    detailSlot = 'upper';
    // ombreira esquerda: placas sobrepostas com espinhos de osso, alça cruzando o peito com argola
    { const sh = V(-S.x - .05 * W, S.y + .1, S.z), shp = []; for (let k = 0; k < 4; k++) { const c = sh.clone().add(V(-.1 * k * W, -.16 * k * W, 0)); addGeo(k % 2 ? 'leather' : 'trim', sph(c, (.72 - .08 * k) * W, 1.05, .5, 1.05, 24, 12)); for (let r = 0; r < 9; r++) { const a = r / 8 * PI * 1.6 - PI * .8; addGeo('trim', sph(c.clone().add(V(Math.sin(a) * .62 * W * (1 - .1 * k), .12 * W, Math.cos(a) * .62 * W)), .03 * W, 1, 1, 1, 6, 5)) } }
      const strap = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = -S.x * .75 * (1 - t) + .55 * W * t, y = S.y + (yBelt - S.y) * t; strap.push(onFront(x, y, .07)) } addGeo('leather', tubeG(strap, .11 * W, 8));
      const ring = new THREE.TorusGeometry(.12 * W, .025 * W, 8, 24); addGeo('trim', orient(ring, strap[11].clone().add(V(0, 0, .05)), V(0, 0, 1))) }
    // espinhos da ombreira: cones de osso (o loop acima cria tubos finos; os cones dão a ponta)
    { const sh = V(-S.x - .05 * W, S.y + .1, S.z); for (let k = 0; k < 7; k++) { const a = k / 6 * PI, base = sh.clone().add(V(Math.cos(a) * .45 * W - .1 * W, .3 * W, Math.sin(a - PI / 2) * .45 * W)), dir = V(-.45 + Math.cos(a) * .35, 1, Math.sin(a - PI / 2) * .45).normalize(), L = (.55 + .3 * Math.sin(a)) * W; const c = new THREE.ConeGeometry(.11 * W, L, 10); c.translate(0, L / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir)); c.translate(base.x, base.y, base.z); addGeo('secondary', c) } }
    // braçadeiras de couro com faixas de metal e espinhos; polainas nas canelas; pés descalços
    limbWrap('Bracadeira', 'leather', E, Wr, .3, .92, .09 * W, { flare: .04 * W });
    limbWrap('Bracadeira_Aro', 'trim', E, Wr, .45, .8, .11 * W, { rings: .02 * W, ringsN: 2.2 });
    mirror(s => { for (let k = 0; k < 5; k++) { const t = .4 + k * .12, p = E.clone().lerp(Wr, t), side = V(0, 1, 0).cross(dF).normalize(), dir = V(s * (-dF.y), dF.x, .3).normalize(); const pr = V(s * p.x, p.y, p.z), r = limbR(p, dF) + .1 * W; const c = new THREE.ConeGeometry(.035 * W, .13 * W, 8); c.translate(0, .065 * W + r, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(s * .3, 1, .4 * (k % 2 ? 1 : -1)).normalize())); c.translate(pr.x, pr.y, pr.z); addGeo('trim', c) } });
    limbWrap('Polaina', 'leather', K, A, .25, 1.02, .08 * W, { flare: .05 * W });
    limbWrap('Polaina_Placa', 'trim', K, A, .38, .62, .1 * W);
  }

  if (style === 'adventurer') {
    // camisa branca bufante, gibão azul até o meio da coxa com acabamento, capa vermelha nos ombros
    const shirt = garment('Camisa', 'secondary', 'upper', { top: yN + .04, bottom: Y(.42), t: .05 * W, sleeve: 'wrist', sleeveEase: .08 * W, puff: .14 * W, bell: .03 * W, env: { ease: .05 * W, hang: .3 } });
    const gib = garment('Gibao', 'fabric', 'upper', { over: shirt.outer, overGap: .08 * W, top: yN - .03, bottom: Y(.6), t: .1 * W, shoulderPad: -.02, open: .2, openTaper: 1.5, hollow: true, cell: cellBase * .8, env: { ease: .07 * W, hang: .25, cinch: Y(.36), cinchK: .7, flareFrom: Y(.38), flare: .14, folds: .015 * W, foldN: 10 }, hemCurve: .03 });
    edgeTube(gib, 'arm', 'trim', 'upper', .035 * W);
    edgeTube(gib, 'open', 'trim', 'upper', .03 * W);
    rim('upper', 'trim', gib.outer, a => Y(.6) + .015 + .03 * (1 - Math.cos(a)) * .5, .035 * W, { a0: -PI + .02, a1: -.31 });
    rim('upper', 'trim', gib.outer, a => Y(.6) + .015 + .03 * (1 - Math.cos(a)) * .5, .035 * W, { a0: .31, a1: PI - .02 });
    sleeveCuffs(shirt, 'upper', 'leather', .08 * W);
    pants('Calca', 'pants', { top: .34, t: .07 * W, puff: .06 * W, cuff: .2, under: { fn: gib.solid, y: Y(.6) + .03 } });
    boots('Botas', 'leather', { t: .07 * W, h: .26, cuffT: .09 * W, toe: .02 });
    beltOn('Cinto', 'leather', gib.solid, Y(.36), .12 * W, .05 * W);
    cape('Capa', 'accent', { top: .02, bottom: .85, span: 3.4, flare: .7, pleats: 8, ragged: .3, over: gib.env });
    cone('Echarpe', 'accent', { top: -.02, bottom: .13, pad: .2 * W, flare: .1, th: .05, pleat: .04, pleatN: 7, ragged: .05 });
    const onG = (x, y, off) => surfAt(gib.solid, y, Math.atan2(x, .45), off); // detalhes assentados no gibão
    detailSlot = 'belt';
    // fivela-bússola, alça diagonal, bolsas de couro e bússola pendurada
    { const p = onG(0, Y(.36), .1 * W); addGeo('trim', orient(new THREE.CylinderGeometry(.16 * W, .16 * W, .04, 28).rotateX(PI / 2), p, V(0, 0, 1))); addGeo('leather', orient(new THREE.ExtrudeGeometry(starShape(.13 * W, .04 * W, 8), { depth: .012, bevelEnabled: false }), p.clone().add(V(0, 0, .03)), V(0, 0, 1))) }
    { const strap = []; for (let i = 0; i <= 18; i++) { const t = i / 18, x = .62 * W * (1 - t) - .55 * W * t, y = S.y + .05 + (Y(.38) - S.y) * t; strap.push(onG(x, y, .04 * W)) } addGeo('leather', tubeG(strap, .05 * W, 6)); addGeo('trim', orient(new THREE.CylinderGeometry(.09 * W, .09 * W, .03, 20).rotateX(PI / 2), strap[5].clone().add(V(0, 0, .04)), V(0, 0, 1))) }
    detailSlot = 'belt';
    mirror(s => { const p = onG(s * .62 * W, Y(.42), .1 * W); const g = new RoundedBoxGeometry(.32 * W, .28 * W, .16 * W, 3, .035 * W); addGeo('leather', orient(g, p, V(s * .4, 0, 1).normalize())); addGeo('leather', orient(new RoundedBoxGeometry(.34 * W, .12 * W, .17 * W, 3, .025 * W), p.clone().add(V(0, .12 * W, .01)), V(s * .4, 0, 1).normalize())); addGeo('trim', sph(p.clone().add(V(0, .06 * W, .1 * W)), .025 * W)) });
    { const p = onG(.25 * W, Y(.5), .08 * W); addGeo('trim', orient(new THREE.CylinderGeometry(.11 * W, .11 * W, .04, 24).rotateX(PI / 2), p, V(0, 0, 1))); addGeo('secondary', orient(new THREE.CylinderGeometry(.085 * W, .085 * W, .045, 24).rotateX(PI / 2), p.clone().add(V(0, 0, .005)), V(0, 0, 1))); addGeo('trim', chainG([onG(.22 * W, Y(.37), .1 * W), p.clone().add(V(0, .11 * W, 0))])) }
  }

  if (style === 'desert') {
    // túnica branca de manga curta até o meio da coxa, bombacha creme franzida na canela, botas trançadas
    // túnica numa peça só: ombro apoiado, cai solta do peito, presa pela faixa e abrindo em saia até o joelho
    const tun = garment('Tunica', 'secondary', 'upper', { top: yN + .02, bottom: Y(.62), t: .07 * W, sleeve: 'short', short: .6, puff: .06 * W, sleeveEase: .1 * W, bell: .05 * W, vneck: .14, env: { ease: .13 * W, hang: .2, cinch: Y(.35), cinchK: .65, cinchW: .15, flareFrom: Y(.38), flare: .22, folds: .022 * W, foldN: 12 }, hemCurve: .05 });
    sleeveCuffs(tun, 'upper', 'fabric', .06 * W);
    rim('upper', 'fabric', tun.outer, a => Y(.62) + .02 + .05 * (1 - Math.cos(a)) * .5, .03 * W);
    pants('Bombacha', 'pants', { top: .4, t: .06 * W, puff: .22 * W, cuff: .26, under: { fn: tun.solid, y: Y(.62) + .03 } });
    boots('Botas', 'leather', { t: .07 * W, h: .3, cuffT: .03 * W });
    for (let k = 0; k < 4; k++) limbWrap('Bota_Tira', 'trim', K, A, .3 + k * .17, .3 + k * .17 + .04, .095 * W);
    // faixa azul larga + cinto com medalhão; tabardo azul com losangos e franja; tiras cruzadas no peito
    beltOn('Faixa', 'fabric', tun.solid, Y(.345), .2 * W, .05 * W);
    beltOn('Cinto', 'leather', (x, y, z) => tun.solid(x, y, z) - .05 * W, Y(.375), .07 * W, .045 * W);
    if (!onlySlot || onlySlot === 'belt') { const p = surfAt(tun.solid, Y(.36), 0, .11 * W); addGeoS('belt', 'trim', orient(new THREE.CylinderGeometry(.12 * W, .12 * W, .035, 26).rotateX(PI / 2), p, V(0, 0, 1))) }
    detailSlot = 'upper';
    const zTab = y => surfAt(tun.solid, Math.min(y, Y(.42)), 0).z + .12 * W + .05 * (Y(.4) - y);
    if (!onlySlot || onlySlot === 'upper') for (const xc of [-.22, .22]) {
      const rows = [], yT = Y(.39); for (let i = 0; i <= 20; i++) { const t = i / 20, y = yT - t * .3 * Lb, row = []; for (let j = 0; j <= 8; j++) { const s = j / 8 - .5, x = (xc + s * .3) * W; row.push(V(x, y, Math.max(zTab(y), surfAt(tun.solid, y, Math.atan2(x, .5)).z + .03) + .02 * Math.cos(s * 3))) } rows.push(row) }
      sheet('Tabardo', 'fabric', rows, null, (t, s) => .85 + .15 * Math.cos((s - .5) * 3));
      for (let k = 0; k < 3; k++) { const y = yT - (.07 + k * .09) * Lb, p = V(xc * W, y, rows[Math.round((.07 + k * .09) / .3 * 20)][4].z + .02); const g = new THREE.TorusGeometry(.07 * W, .012 * W, 4, 4); g.rotateZ(PI / 4); addGeo('trim', orient(g, p, V(0, 0, 1))) }
      const last = rows[20]; for (let k = 0; k < 9; k++) { const p = last[0].clone().lerp(last[8], (k + .5) / 9); addGeo('trim', tubeG([p, p.clone().add(V(0, -.09 * W, .005))], .008, 4)) }
    }
    if (!onlySlot || onlySlot === 'upper') {
      mirror(s => { const strap = []; for (let i = 0; i <= 16; i++) { const t = i / 16, x = s * (.6 * W * (1 - t) - .45 * W * t), y = S.y + (Y(.34) - S.y) * t; strap.push(surfAt(tun.outer, y, Math.atan2(x, .5), .03 * W)) } addGeoS('upper', 'leather', tubeG(strap, .045 * W, 6)) });
      addGeoS('upper', 'trim', orient(new THREE.CylinderGeometry(.1 * W, .1 * W, .03, 24).rotateX(PI / 2), surfAt(tun.outer, Y(.17), 0, .02), V(0, 0, 1)));
    }
    detailSlot = 'extras';
    // lenço/capuz azul no pescoço e capa azul caindo do ombro esquerdo com barra dourada
    fabric('Lenco','fabric',clothSurface(18,72,(t,u)=>{const a=u*PI*2,r=.34*body.hs+.12*W+.018*W*Math.sin(a*5+t*2);return V(Math.sin(a)*r,yN+.14*W-.32*W*t,z0+Math.cos(a)*r)},{closed:true,thickness:.035*W}),'extras');
    cape('Capa', 'fabric', { top: .03, yBottom: Y(.8), span: 3.4, flare: .65, pleats: 6, turn: -.25, over: tun.env, trim: 'trim' });
    // luva de falcoeiro no braço direito e braçadeira no esquerdo
    if(!onlySlot||onlySlot==='extras')add('Luva',handPatch(body,-1,.05*W),'leather','extras');
  }

  if (style === 'mermaid_pearl' || style === 'mermaid_ruby') {
    const ruby = style === 'mermaid_ruby';
    // cauda: começa nos quadris (cós em V na frente), afina até o "tornozelo" e abre na nadadeira; S suave de lado
    const yT = Y(.36), yAnk = ySole + .17 * Lb, yEnd = ySole + .08 * Lb;
    // Cós e quadril medidos no corpo escolhido; a extensão da cauda nasce desse encaixe.
    // Frente e costas conservam suas profundidades, sem impor uma elipse larga de tamanho fixo.
    const yJoin = Y(.43), tailFit = envelope(yT + .12, yJoin - .04, { ease: .025 * W, hang: 3, drape: .012 * W, smooth: 6 });
    const tailRadius = (y, ph) => {
      if (y >= yJoin) return tailFit.radius(y, ph);
      const u = clamp((yJoin - y) / (yJoin - yAnk), 0, 1);
      return lerp(tailFit.radius(yJoin, ph), .15 * W, Math.pow(u, 1.12));
    };
    const wAt = y => tailRadius(y, PI / 2);
    const zc = y => z0 + .1 * Math.sin(clamp((yJoin - y) / (yJoin - yEnd), 0, 1) * PI * 1.1);
    const tailPoint = (y, ph, off = 0) => { const r = tailRadius(y, ph) + off; return V(Math.sin(ph) * r, y, zc(y) + Math.cos(ph) * r) };
    activeSlot='lower';
    if(!onlySlot||onlySlot==='lower'){
    const tail = (x, y, z) => {
      const ph = Math.atan2(x, z - zc(y));
      let dd = (Math.hypot(x, z - zc(y)) - tailRadius(y, ph)) * .9;
      const vcut = yT + .06 - .16 * Math.max(0, 1 - Math.abs(x) / (.5 * W)) * sstep(z0, z0 + .3, z);
      const hipCover = armSide(Math.abs(x), y) > -.02 ? 1 : bf(x, y, z) - .035 * W; // piso de segurança no contato com quadril/glúteos
      dd = Math.min(dd, hipCover);
      dd = smax(dd, y - vcut, .02); dd = smax(dd, yEnd - y, .05);
      return dd;
    };
    const tg = refinedSdfMesh(tail, { x: 1.4 * W + .5, y0: yEnd - .2, y1: yT + .3, z0: z0 - 1.4 * W - .3, z1: z0 + 1.4 * W + .4 }, cellBase);
    { const pa = tg.attributes.position, n = pa.count, mixc = new Float32Array(n), shade = new Float32Array(n); for (let i = 0; i < n; i++) { const y = pa.getY(i); mixc[i] = Math.pow(sstep(yT, yEnd, y), ruby ? .9 : 1.3); shade[i] = 1 } tg.setAttribute('mixc', new THREE.BufferAttribute(mixc, 1)); tg.setAttribute('shade', new THREE.BufferAttribute(shade, 1)) }
    add('Cauda', smoothCloth(tg,3), 'tail', 'lower');
    }
    detailSlot='lower';
    // linhas douradas no cós e descendo a cauda
    { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, ph = -1.25 + 2.5 * t, x = Math.sin(ph), y = yT + .06 - .16 * Math.max(0, 1 - Math.abs(Math.sin(ph) * radAt(yT, ph)) / (.5 * W)) - .02; pts.push(tailPoint(y, ph, .012 * W)) } addGeo('trim', tubeG(pts, .022 * W, 6)) }
    mirror(s => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, y = yT - .1 - t * (yT - yAnk - .1), ph = s * Math.asin(.35 * (1 - t) + .08); pts.push(tailPoint(y, ph, .015)) } addGeo('trim', tubeG(pts, .012 * W, 5)) });
    // nadadeira da cauda: dois lóbulos em leque com raios, borda recortada e ondulada
    const finSheet = (name, base, dirMain, side, len, spread, n, ruffleAmp) => {
      const rows = [], NR = 48, NC = 96; const up = V(0, 0, 1);
      for (let i = 0; i <= NR; i++) { const t = i / NR, row = []; for (let j = 0; j <= NC; j++) { const s = j / NC, ang = (s - .5) * spread, dir = dirMain.clone().applyAxisAngle(up, ang).normalize(); const L = len * (.55 + .45 * Math.pow(Math.sin(PI * s), .6)) * (1 - .25 * Math.abs(Math.sin(s * PI * n)) * sstep(.8, 1, t)); const p = base.clone().addScaledVector(dir, L * t); p.z += ruffleAmp * Math.sin(s * PI * n * 2) * t * t + side * .05 * t; row.push(p) } rows.push(row) }
      sheet(name, 'fin', rows, (t) => .35 + .65 * t, (t, s) => .7 + .3 * Math.abs(Math.cos(s * PI * 14)) * (.6 + .4 * t));
    };
    const fb = V(0, yEnd + .05, zc(yEnd) - .02);
    mirror(s => finSheet('Nadadeira', fb, V(s * .9, -1, 0).normalize(), s, 1.5 * W + .25 * Lb * .3, 1.25, 4, .1));
    mirror(s => { const y = Y(.46), b = V(s * wAt(y) * .9, y, zc(y)); finSheet('Nadadeira_Quadril', b, V(s * 1, -1.1, .1).normalize(), s, .9 * W, .9, 3, .06) });
    mirror(s => { const y = yT - .55 * (yT - yAnk), b = V(s * wAt(y) * .95, y, zc(y)); finSheet('Nadadeira_Lateral', b, V(s * .8, -1, 0).normalize(), s, .75 * W, .8, 3, .05) });
    // top: faixa no busto com decote coração (pérolas/joias), colar e correntes na barriga
    const yB0 = Y(.2), yB1 = Y(.115);
    activeSlot='upper';
    // corpete: envoltória justa com bojo (o pano passa liso entre os seios), decote coração e costas mais baixas
    const heart = (ax, y, z) => sstep(z0 - .05, z0 + .15, z) * (.07 * W * Math.exp(-((ax - .28 * W) ** 2) / (.025 * W * W)) - .11 * W * Math.exp(-(ax * ax) / (.006 * W * W))) - .1 * W * sstep(z0 + .05, z0 - .25, z);
    const bod = garment('Top', 'secondary', 'upper', { top: yB1 + .02, bottom: yB0 + .02, t: .03 * W, shoulderPad: -.06, edge: heart, cell: cellBase * .7, env: { ease: .035 * W, hang: .9, cinch: yB0, cinchK: .5, smooth: 6 } });
    if (!onlySlot || onlySlot === 'upper') for (const ph of [-.95, -.5, .5, .95, 2.2, -2.2]) { const pts = []; for (let i = 0; i <= 8; i++) pts.push(surfAt(bod.outer, lerp(yB0 + .05, yB1 - .02, i / 8) - (Math.abs(ph) < 1 ? 0 : .06 * W), ph, .002)); addGeoS('upper', ruby ? 'trim' : 'secondary', tubeG(pts, .012 * W, 5)) } // barbatanas do corpete
    rim('upper', ruby ? 'trim' : 'secondary', bod.outer, yB0 + .035, .02 * W);
    detailSlot = 'upper';
    const pearl = 'pearl';
    if (!onlySlot || onlySlot === 'upper') { const pts = []; for (let i = 0; i <= 52; i++) { const ph = -1.35 + 2.7 * i / 52, r0 = radAt(yB1, ph), x = Math.sin(ph) * r0, zz = z0 + Math.cos(ph) * r0, y = yB1 + .02 + heart(Math.abs(x), yB1, zz) - .012; pts.push(surfAt(bod.solid, y, ph, .012 * W)) } pts.forEach(p => addGeoS('upper', ruby ? 'trim' : pearl, sph(p, (ruby ? .02 : .028) * W, 1, 1, 1, 8, 6))) }
    { const c = surfAt(bod.solid, Y(.135), 0, .03 * W); addGeo('gem', orient(new THREE.OctahedronGeometry(.07 * W, 0).scale(1, 1.3, .5), c, V(0, 0, 1))); const fr = new THREE.TorusGeometry(.08 * W, .012 * W, 6, 20); fr.scale(1, 1.25, 1); addGeo('trim', orient(fr, c, V(0, 0, 1))) }
    detailSlot = 'extras';
    { const pts = []; for (let i = 0; i <= 50; i++) { const a = -PI * .8 + i / 50 * PI * 1.6, y = yN - .22 - .08 * Math.cos(a / 1.6), r = radAt(Math.min(y, yN - .1), a) + .03; pts.push(V(Math.sin(a) * r, y, z0 + Math.cos(a) * r)) } pts.forEach(p => addGeo(ruby ? 'trim' : pearl, sph(p, .026 * W, 1, 1, 1, 8, 6))); addGeo('gem', orient(new THREE.OctahedronGeometry(.05 * W, 0).scale(1, 1.4, .5), pts[25].clone().add(V(0, -.08, .02)), V(0, 0, 1))) }
    detailSlot = 'belt';
    for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 50; i++) { const t = i / 50, ph = -1.3 + 2.6 * t, y = yT + .08 - (.12 + k * .1) * Math.sin(PI * t), r = radAt(y, ph) + .03; pts.push(V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r)) } addGeo('trim',chainG(pts,.014*W));pts.forEach((p, i) => { if (i % 2 === 0) addGeo(ruby ? 'trim' : pearl, sph(p, (ruby ? .016 : .02) * W, 1, 1, 1, 8, 6)) }) }
    { const c = onFront(0, yT + .02, .06); addGeo('gem', orient(new THREE.OctahedronGeometry(.075 * W, 0).scale(1, 1.4, .5), c, V(0, 0, 1))); const fr = new THREE.TorusGeometry(.085 * W, .014 * W, 6, 20); fr.scale(1, 1.3, 1); addGeo('trim', orient(fr, c, V(0, 0, 1))) }
    detailSlot = 'belt';
    if (ruby) { // cinto de alquimista: frascos de vidro com líquido vermelho pendurados
      for (const ph of [-1.15, -.75, .75, 1.15, 1.6, -1.6]) { const y = yT + .02, r = radAt(y, ph) + .1, p = V(Math.sin(ph) * r, y - .14, z0 + Math.cos(ph) * r); const tall = Math.abs(ph) > 1.3; if (tall) { addGeo('glass', orient(new THREE.CylinderGeometry(.05 * W, .05 * W, .26 * W, 14), p, V(0, 1, 0), V(0, 0, 1))); addGeo('liquid', orient(new THREE.CylinderGeometry(.04 * W, .04 * W, .17 * W, 12), p.clone().add(V(0, -.04 * W, 0)), V(0, 1, 0), V(0, 0, 1))) } else { addGeo('glass', sph(p, .09 * W, 1, 1, 1, 16, 12)); addGeo('liquid', sph(p.clone().add(V(0, -.02 * W, 0)), .07 * W, 1, .7, 1, 14, 8)); addGeo('glass', orient(new THREE.CylinderGeometry(.025 * W, .03 * W, .1 * W, 10), p.clone().add(V(0, .11 * W, 0)), V(0, 1, 0), V(0, 0, 1))) } addGeo('trim', tubeG([V(p.x, y, p.z), p.clone().add(V(0, tall ? .13 * W : .14 * W, 0))], .008, 4)) }
      mirror(s => { for (let k = 0; k < 2; k++) { const ph = s * (.25 + k * .3), y = Y(.45) - k * .05, r = radAt(y, ph) + .05; addGeo('gem', orient(new THREE.OctahedronGeometry(.04 * W, 0).scale(1, 1.5, .5), V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r), V(Math.sin(ph), 0, Math.cos(ph)))) } });
    }
    detailSlot = 'extras';
    // véus nos braços (tecido transparente preso no braço, caindo em ondas) com barra dourada; braceletes
    mirror(s => {
      const rows = [], a0 = S.clone().lerp(E, .3), a1 = E.clone().lerp(Wr, .05), NC = 16, NR = 22, drop = .55 * Lb * .32;
      const edge = [];
      for (let i = 0; i <= NR; i++) { const t = i / NR, row = []; for (let j = 0; j <= NC; j++) { const u = j / NC, p = a0.clone().lerp(a1, u); const r = limbR(p, dU) + .03; const q = V(s * p.x, p.y - r * .4, p.z); q.y -= drop * t * (.7 + .5 * u); q.x += s * .05 * t; q.z += .08 * Math.sin(u * 9 + t * 3) * t; row.push(q); if (i === NR) edge.push(q) } rows.push(row) }
      sheet('Veu', 'veil', rows, null, (t, u) => .85 + .15 * Math.sin(u * 20));
      addGeo('trim', tubeG(edge, .012 * W, 5));
      for (const [pp, k] of [[S.clone().lerp(E, .32), dU], [Wr.clone().addScaledVector(dF, -.12), dF], [Wr.clone().addScaledVector(dF, -.2), dF]]) { const r = limbR(pp, k) + .02, g = new THREE.TorusGeometry(r, .022 * W, 8, 28); addGeo('trim', orient(g, V(s * pp.x, pp.y, pp.z), V(s * k.x, k.y, k.z))) }
    });
  }
}
