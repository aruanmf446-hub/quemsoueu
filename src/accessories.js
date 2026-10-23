// Acessórios da Head V2 — peças prontas que se encaixam na cabeça e no cabelo de cada personagem.
// Encaixe: anéis (coroa, tiara, chapéus) medidos na superfície externa real (pele + cabelo, por raios);
// brincos no lóbulo da orelha; enfeite de testa na linha do cabelo; flores e coral sobre o cabelo.
// Cores por material (metal, pedra principal, pedras menores, chapéu, flores) → trocar cor é instantâneo.
import * as THREE from 'three';
import { crescent } from './lunar.js';
import {clothSurface} from './fabric.js';
import {groomedLock,groomSurface} from './groom.js';
import {heroSurface} from './hero-material.js';
import {badge,tuft,buckleGeo,gear} from './detail.js';
import {leafGeo} from './forest.js';
import {cactusHeadgear} from './cactus-headgear.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), DEG = Math.PI / 180;

const GEMS = [['Rubi', '#c0182a'], ['Safira', '#2453c4'], ['Esmeralda', '#16935a'], ['Ametista', '#8e3fd0'], ['Turquesa', '#2fa6c9'], ['Topázio', '#e8a020'], ['Diamante', '#e6f0ff']];
export const ACC_COLORS = {
  metal: { label: 'Metal', list: [['Ouro', '#d4a640'], ['Ouro rosé', '#d9967a'], ['Prata', '#c9ccd1'], ['Bronze', '#a8723e'], ['Latão velho', '#b5893f'], ['Preto', '#2a2a2e']] },
  gem: { label: 'Pedra principal', list: GEMS },
  gem2: { label: 'Pedras menores', list: GEMS },
  fabric: { label: 'Chapéu', list: [['Couro', '#6b4228'], ['Café', '#3e2a1e'], ['Preto', '#1d1b1f'], ['Vermelho', '#9e2420'], ['Bege', '#c8b08a'], ['Azul', '#2b3f7a'], ['Verde', '#2f5a3a']] },
  flower: { label: 'Flores / coral', list: [['Branco', '#f6f1e6'], ['Rosa', '#f19bb8'], ['Amarelo', '#f2cf4a'], ['Lilás', '#b79be6'], ['Coral', '#d63a22'], ['Azul', '#7fb2f0']] }
};
export const ACC_SLOTS = [{ id: 'head', label: 'Cabeça' }, { id: 'ears', label: 'Orelhas' }, { id: 'forehead', label: 'Testa' }, { id: 'hairpin', label: 'Enfeite de cabelo' }, { id: 'face', label: 'Rosto' }];
export const ACCESSORIES = {
  leaf_crown:{slot:'head',label:'Coroa de folhas',colors:['metal','gem','gem2']},
  frontier_hat:{slot:'head',label:'Chapéu de viajante do deserto',colors:['fabric','metal']},
  chef_hat:{slot:'head',label:'Chapéu de padeiro',colors:['fabric']},
  vigilante_hood:{slot:'head',label:'Capuz e máscara do vigilante',colors:['fabric','metal']},
  guard_helmet:{slot:'head',label:'Elmo do soldado',colors:['fabric','metal','gem']},
  fennec_saddle:{slot:'head',label:'Sela e bolsas do feneco',colors:['fabric','metal','gem'],companion:'fennec'},
  fennec_rider:{slot:'head',label:'Cowboy montado no feneco',colors:['fabric','metal','gem'],companion:'fennec'},
  monocle:{slot:'face',label:'Monóculo esmeralda',colors:['metal','gem2']},
  moon_crown: {slot:'head',label:'Coroa lunar',colors:['metal','gem','gem2']},
  goggles: {slot:'head',label:'Óculos de inventor',colors:['metal','gem2']},
  visor: {slot:'face',label:'Visor azul',colors:['metal','gem2']},
  wolf_kit: {slot:'head',label:'Equipamento de Paysandu',colors:['metal','fabric','gem'],companion:'wolf'},
  raven_kit: {slot:'head',label:'Equipamento do corvo',colors:['metal','fabric','gem'],companion:'raven'},
  tiara: { slot: 'head', label: 'Tiara', colors: ['metal', 'gem', 'gem2'] },
  crown: { slot: 'head', label: 'Coroa', colors: ['metal', 'gem', 'gem2'] },
  cowboy: { slot: 'head', label: 'Chapéu de cowboy', colors: ['fabric', 'metal'] },
  tophat: { slot: 'head', label: 'Cartola', colors: ['fabric', 'metal'] },
  bubbles: { slot: 'head', label: 'Coroa de bolhas', colors: ['metal', 'gem'] },
  drop: { slot: 'ears', label: 'Brinco gota', colors: ['metal', 'gem2'], ears: true },
  hoops: { slot: 'ears', label: 'Argola', colors: ['metal'], ears: true },
  studs: { slot: 'ears', label: 'Ponto de luz', colors: ['metal', 'gem2'], ears: true },
  tikka: { slot: 'forehead', label: 'Joia de testa', colors: ['metal', 'gem'] },
  flowers: { slot: 'hairpin', label: 'Flores', colors: ['flower'] },
  coral: { slot: 'hairpin', label: 'Coral', colors: ['flower', 'metal'] },
  glasses: { slot: 'face', label: 'Óculos redondos', colors: ['metal'] }
};

// ---------- geometria básica ----------
function tube(pts,r,seg=8){
  const closed=pts.length>3&&pts[0].distanceToSquared(pts[pts.length-1])<1e-12,length=pts.slice(1).reduce((n,p,i)=>n+p.distanceTo(pts[i]),0);
  return groomedLock(pts,1,1,{rows:Math.max(2,Math.min(320,Math.max(pts.length-1,Math.ceil(length/.025)))),segments:Math.max(12,seg),closed,grooveStrength:0,tangents:false,profile:t=>{const rr=typeof r==='function'?r(t):r;return[rr,rr]},normal:()=>V(0,1,0)});
}
function lensGeometry(radius,sag=.018,thickness=.004){
  const nr=12,nc=64,p=[],uv=[],ix=[],ends=[];
  for(const back of [false,true]){
    const center=p.length/3;ends.push(center);p.push(0,0,back?sag*.5-thickness:sag);uv.push(.5,.5);
    for(let i=1;i<=nr;i++)for(let j=0;j<nc;j++){const t=i/nr,a=j/nc*2*Math.PI,x=Math.cos(a)*radius*t,y=Math.sin(a)*radius*t;p.push(x,y,(back?sag*.5:sag)*(1-t*t)-(back?thickness:0));uv.push(.5+x/radius*.5,.5+y/radius*.5)}
    const tri=(a,b,c)=>ix.push(a,...(back?[c,b]:[b,c]));
    for(let j=0;j<nc;j++)tri(center,center+1+j,center+1+(j+1)%nc);
    for(let i=1;i<nr;i++)for(let j=0;j<nc;j++){const a=center+1+(i-1)*nc+j,b=center+1+(i-1)*nc+(j+1)%nc,c=a+nc,d=b+nc;tri(a,c,b);tri(b,c,d)}
  }
  for(let j=0;j<nc;j++){const a=ends[0]+1+(nr-1)*nc+j,b=ends[0]+1+(nr-1)*nc+(j+1)%nc,c=ends[1]+1+(nr-1)*nc+j,d=ends[1]+1+(nr-1)*nc+(j+1)%nc;ix.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

const sphere = (p, r, sx = 1, sy = 1, sz = 1, ws = 24, hs = 16) => { const g = new THREE.SphereGeometry(r, ws, hs); g.scale(sx, sy, sz); g.translate(p.x, p.y, p.z); return g };
function gemGeo(p, r, dir = V(0, 0, 1), stretch = 1) { // pedra lapidada (octaedro alongado), virada para dir
  // Lapidação com mesa, cintura e pavilhão: facetas menores que o antigo octaedro.
  const N = 10, tiers = [[.42, .43], [.92, .12], [1, 0], [.45, -.38]], pos = [], ix = [];
  for (const [rad, z] of tiers) for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; pos.push(Math.sin(a) * r * rad, Math.cos(a) * r * rad * stretch, z * r) }
  for (let j = 0; j < tiers.length - 1; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N, c = a + N, d = b + N; ix.push(a, b, c, b, d, c) }
  for (let i = 1; i < N - 1; i++) { ix.push(0, i + 1, i); ix.push(N * 3, N * 3 + i, N * 3 + i + 1) }
  const g = new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,0,1),dir.clone().normalize()));g.translate(p.x,p.y,p.z);g.userData.setting={p:p.clone(),r,dir:dir.clone().normalize(),stretch};return g;
}
function place(g, p, dir, up = V(0, 1, 0)) { // geometria local (z = frente) orientada para dir
  const z = dir.clone().normalize(), x = up.clone().cross(z).normalize(), y = z.clone().cross(x);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(x, y, z).setPosition(p)); return g;
}
function traceR(sdf, y, ph, zc) { const dx = Math.sin(ph), dz = Math.cos(ph); let r = 1.6; for (let k = 0; k < 80; k++) { const d = sdf(dx * r, y, zc + dz * r); if (Math.abs(d) < 1e-4) break; r -= d * .9 } return r }

// ---------- montagem ----------
export function buildAccessories(fit, sel = {}, cols = {}, hairMeshes = []) {
  const group = new THREE.Group(); group.name = 'Accessories';
  const mats = {
    metal: new THREE.MeshPhysicalMaterial({ name: 'Acc_Metal', color: cols.metal || '#d4a640', metalness: 1, roughness: .32, clearcoat: .35, clearcoatRoughness: .2 }),
    gem: new THREE.MeshPhysicalMaterial({ name: 'Acc_Gem', color: cols.gem || '#c0182a', metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .02, specularIntensity: 1, ior: 2.2, flatShading: true }),
    gem2: new THREE.MeshPhysicalMaterial({ name: 'Acc_Gem2', color: cols.gem2 || '#2fa6c9', metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .02, specularIntensity: 1, ior: 2.2, flatShading: true }),
    pearl: new THREE.MeshPhysicalMaterial({ name: 'Acc_Pearl', color: '#f4eee2', roughness: .25, sheen: 1, sheenColor: new THREE.Color('#ffe8f0'), clearcoat: .8 }),
    fabric: new THREE.MeshPhysicalMaterial({ name: 'Acc_Fabric', color: cols.fabric || '#6b4228', roughness: .82, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color('#ffffff').multiplyScalar(.25) }),
    plume: new THREE.MeshPhysicalMaterial({name:'Acc_Penacho',color:cols.gem||'#a82c2b',roughness:.87,sheen:.6}),
    band: new THREE.MeshPhysicalMaterial({ name: 'Acc_Band', color: new THREE.Color(cols.fabric || '#6b4228').multiplyScalar(.45), roughness: .7 }),
    flower: new THREE.MeshPhysicalMaterial({ name: 'Acc_Flower', color: cols.flower || '#f6f1e6', roughness: .55, sheen: .6, sheenColor: new THREE.Color('#ffffff') }),
    pollen: new THREE.MeshPhysicalMaterial({ name: 'Acc_Pollen', color: '#e8b52c', roughness: .7 }),
    glass: new THREE.MeshPhysicalMaterial({ name: 'Acc_Glass', color: '#f0f3f6', roughness: .03, metalness: 0, transparent: true, opacity: .035, specularIntensity: .6, clearcoat: .35, clearcoatRoughness: 0, depthWrite: false, side: THREE.DoubleSide }),
    frame: new THREE.MeshPhysicalMaterial({name:'Acc_Frame',color:cols.gem2||'#5ab8ef',roughness:.42,metalness:.12,clearcoat:.16}),
    nosePad: new THREE.MeshPhysicalMaterial({name:'Acc_NosePad',color:'#e5d7c4',transparent:true,opacity:.28,roughness:.38,depthWrite:false}),
    pad: new THREE.MeshStandardMaterial({name:'Acc_Pad',color:'#292d35',roughness:.85}),
    goggleGlass: new THREE.MeshPhysicalMaterial({name:'Acc_GoggleGlass',color:cols.gem2||'#5ab8ef',transparent:true,opacity:.24,roughness:.06,depthWrite:false}),
    visor: new THREE.MeshPhysicalMaterial({name:'Acc_Visor',color:cols.gem2||'#5ab8ef',transparent:true,opacity:.09,roughness:.03,clearcoat:.35,specularIntensity:.6,depthWrite:false,side:THREE.DoubleSide}),
    liquid: new THREE.MeshPhysicalMaterial({ name: 'Acc_Liquid', color: cols.gem || '#8e3fd0', emissive: cols.gem || '#8e3fd0', emissiveIntensity: .55, roughness: .3, transparent: true, opacity: .85 })
  };
  const setColors = c => {
    if (c.metal) mats.metal.color.set(c.metal);
    if (c.gem) { mats.gem.color.set(c.gem); mats.liquid.color.set(c.gem); mats.liquid.emissive.set(c.gem);mats.plume.color.set(c.gem) }
    if (c.gem2) {mats.gem2.color.set(c.gem2);mats.visor.color.set(c.gem2);mats.frame.color.set(c.gem2);mats.goggleGlass.color.set(c.gem2)}
    if (c.fabric) { mats.fabric.color.set(c.fabric); mats.band.color.set(c.fabric).multiplyScalar(.45) }
    if (c.flower) mats.flower.color.set(c.flower);
  };
  const dispose = () => { group.traverse(o => { if (o.isMesh) o.geometry.dispose() }); Object.values(mats).forEach(m => m.dispose()) };
  if (!fit) return { group, setColors, dispose };

  const P = fit.P, sdf = fit.sdf, zc = fit.cz, top = fit.top, brow = fit.browY;
  // mapa do cabelo: maior raio (a partir do eixo vertical da cabeça) por faixa de altura e ângulo — 1 passada nos vértices
  const hm = hairMeshes.filter(m => m.isMesh), YB = .02, NPH = 120, y0m = -2.2, NY = 200;
  let hmap = null;
  if (hm.length) {
    const key = hm[0].geometry; hmap = key.userData.radMap;
    if (!hmap) {
      hmap = new Float32Array(NY * NPH);
      for (const m of hm) { const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) {
        const x = a[i], y = a[i + 1], z = a[i + 2] - zc, iy = Math.floor((y - y0m) / YB); if (iy < 0 || iy >= NY) continue;
        const ip = Math.floor(((Math.atan2(x, z) + Math.PI) / (2 * Math.PI)) * NPH) % NPH, r = Math.hypot(x, z), k = iy * NPH + ip; if (r > hmap[k]) hmap[k] = r } }
      key.userData.radMap = hmap;
    }
  }
  const hairR = (y, ph) => {
    if (!hmap) return 0; const iy = Math.floor((y - y0m) / YB), ip = Math.floor(((ph + Math.PI) / (2 * Math.PI)) * NPH); let r = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dp = -1; dp <= 1; dp++) { const yy = iy + dy; if (yy < 0 || yy >= NY) continue; r = Math.max(r, hmap[yy * NPH + ((ip + dp) % NPH + NPH) % NPH]) }
    return r;
  };
  // raio externo (pele ou cabelo) na altura y e ângulo ph em volta da cabeça
  const outerR = (y, ph) => Math.max(traceR(sdf, y, ph, zc), hairR(y, ph) + .006);
  // anel em volta da cabeça: y(ph) = y0 + tilt·cos(ph) (tilt < 0 → mais baixo na frente), raio suavizado + folga
  function ring(y0, tilt, gap = .012, N = 64) {
    const rs = [], ys = [];
    for (let i = 0; i < N; i++) { const ph = -Math.PI + 2 * Math.PI * i / N, y = y0 + tilt * Math.cos(ph); ys.push(y); rs.push(outerR(y, ph)) }
    const sm = rs.map((_, i) => { let s = 0, w = 0; for (let k = -3; k <= 3; k++) { const ww = 1 - Math.abs(k) / 4; s += Math.max(rs[(i + k + N) % N], rs[i] * .97) * ww; w += ww } return Math.max(s / w + gap, rs[i] + gap) });
    const at = ph => { const f = ((ph + Math.PI) / (2 * Math.PI)) * N, i = Math.floor(f), t = f - i, a = (i % N + N) % N, b = (a + 1) % N; const r = sm[a] + (sm[b] - sm[a]) * t, y = y0 + tilt * Math.cos(ph); return V(Math.sin(ph) * r, y, zc + Math.cos(ph) * r) };
    return { at, out: ph => V(Math.sin(ph), 0, Math.cos(ph)) };
  }
  const geos = {}; const add = (k, g) => { (geos[k] || (geos[k] = [])).push(g) };
  const hasHair = hm.length > 0;

  // ---------------- cabeça ----------------
  const head = sel.head;
  if (head === 'crown') {
    const R = ring(top - (P.lathe ? .26 : .36), -.08, .008), H = .12, N = 8;
    const band = [], bandT = [];
    for (let i = 0; i <= 96; i++) { const ph = -Math.PI + 2 * Math.PI * i / 96; band.push(R.at(ph)) }
    for (const dy of [0, H]) add('metal', tube(band.map(p => p.clone().add(V(0, dy, 0)).addScaledVector(V(p.x, 0, p.z - zc).normalize(), dy * .12)), .016, 8));
    // faixa (anel cônico levemente aberto para cima)
    add('metalD',clothSurface(6,96,(t,u)=>{const p=R.at(-Math.PI+2*Math.PI*u),out=V(p.x,0,p.z-zc).normalize();return p.addScaledVector(out,t*H*.12).add(V(0,t*H,0))},{closed:true,thickness:.012}));
    for (let k = 0; k < N; k++) { // pontas (prisma triangular afinando), mais alta na frente
      const ph = k / N * Math.PI * 2, p = R.at(ph), o = V(p.x, 0, p.z - zc).normalize(), front = Math.max(0, Math.cos(ph)), h = .2 + .1 * front, w = .085 + .02 * front;
      const shape = new THREE.Shape(); shape.moveTo(-w, 0); shape.quadraticCurveTo(-w * .35, h * .45, 0, h); shape.quadraticCurveTo(w * .35, h * .45, w, 0); shape.lineTo(-w, 0);
      const g = new THREE.ExtrudeGeometry(shape, { depth: .02, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 3, curveSegments: 6 });
      g.translate(0, 0, -.01); g.rotateX(-.12); add('metal', place(g, p.clone().add(V(0, H * .85, 0)).addScaledVector(o, H * .1), o));
      const pearlTip=p.clone().add(V(0,H*.85+h*Math.cos(.12)+.012,0)).addScaledVector(o,H*.1-h*Math.sin(.12)+.008);
      add('pearl', sphere(pearlTip, .022));
      add(k === 0 ? 'gem' : 'gem2', gemGeo(p.clone().add(V(0, H * .5, 0)).addScaledVector(o, .02), k === 0 ? .055 : .032, o, k === 0 ? 1.5 : 1.2));
      const ph2 = ph + Math.PI / N, p2 = R.at(ph2), o2 = V(p2.x, 0, p2.z - zc).normalize();
      add('pearl', sphere(p2.clone().add(V(0, H * .5, 0)).addScaledVector(o2, .018), .016));
    }
  }
  if (head === 'crown') {
    const R=ring(top-(P.lathe?.y?.length ? .26 : .36),-.08,.02);
    // Filigrana, borda milgrain e garras das pedras, na mesma referência de encaixe da coroa.
    for(let k=0;k<8;k++){
      const ph=k/8*Math.PI*2, arch=[];
      for(let j=0;j<=16;j++){const t=j/16,a=ph+(t-.5)*Math.PI/4,p=R.at(a);p.y+=.13+.075*Math.sin(t*Math.PI);p.addScaledVector(R.out(a),.022);arch.push(p)}
      add('metal',tube(arch,.007,8));
      const c=R.at(ph).add(V(0,.06,0)).addScaledVector(R.out(ph),.025);
      for(const s of [-1,1])add('metal',sphere(c.clone().add(V(s*.035,.015,.01)),.012,1,.8,1,10,8));
    }
    for(let i=0;i<64;i++){const a=i/64*Math.PI*2;for(const dy of [.012,.11])add('metal',sphere(R.at(a).add(V(0,dy,0)).addScaledVector(R.out(a),.015),.008,1,1,1,8,6))}
  }
  if (head === 'tiara' || head === 'moon_crown' || head==='leaf_crown') {
    const R = ring(top - (hasHair ? .17 : .2), -.15, .006), span = 105 * DEG, pts = [];
    for (let i = 0; i <= 80; i++) pts.push(R.at(-span + 2 * span * i / 80));
    add('metal', tube(pts, .011, 8));
    for (let i = 0; i <= 26; i++) { const ph = -span + 2 * span * i / 26, p = R.at(ph), o = V(p.x, 0, p.z - zc).normalize(); add('pearl', sphere(p.clone().addScaledVector(o, .012).add(V(0, .014, 0)), .014, 1, 1, 1, 10, 8)) }
    // arcos de filigrana subindo para o centro
    const arch = (ph0, ph1, h, thick) => { const a = []; for (let i = 0; i <= 20; i++) { const t = i / 20, ph = ph0 + (ph1 - ph0) * t, p = R.at(ph), o = V(p.x, 0, p.z - zc).normalize(); a.push(p.clone().add(V(0, .01 + h * Math.sin(Math.PI * t) ** .8, 0)).addScaledVector(o, .006 + .03 * Math.sin(Math.PI * t) * h)) } add('metal', tube(a, thick, 6)); return a };
    const K = 4, step = 13 * DEG;
    for (let k = -K; k < K; k++) { const f = 1 - Math.abs(k + .5) / (K + .5), a = arch(k * step, (k + 1) * step, .05 + .13 * f * f, .007); const tip = a[10]; add('gem2', gemGeo(tip.clone().add(V(0, .014, 0)), .016 + .01 * f, V(tip.x, 0, tip.z - zc), 1.3)) }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) arch(s * (k * step + step * .5), s * ((k + 1.6) * step), .05 + .08 * (1 - k / 3), .005);
    const c = R.at(0), o = V(0, 0, 1);
    add('gem', gemGeo(c.clone().add(V(0, .12, .035)), .055, o, 1.45));
    { const g = new THREE.TorusGeometry(1, .14, 6, 28); g.scale(.058, .085, .058); add('metal', place(g, c.clone().add(V(0, .12, .028)), o)) }
    for (const s of [-1, 1]) add('gem2', gemGeo(c.clone().add(V(s * .085, .07, .03)), .026, o, 1.3));
    add('pearl', sphere(c.clone().add(V(0, .235, .03)), .02)); add('gem2', gemGeo(c.clone().add(V(0, .27, .03)), .022, o, 1.6));
  }
  if (head === 'cowboy') {
    const y0 = top - (P.lathe ? .42 : .36), R = ring(y0, -.05, .02), Hc = head==='frontier_hat'?.51:.42, Wb = head==='frontier_hat'?.56:.42;
    // copa: do anel até o topo com vinco central e "beliscões" na frente
    const NA = 72, NV = 16, cpos = [], cidx = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
      const v = j / NV, ph = -Math.PI + 2 * Math.PI * i / NA, b = R.at(ph), o = V(Math.sin(ph), 0, Math.cos(ph)), r0 = Math.hypot(b.x, b.z - zc);
      const pinch = .06 * Math.max(0, Math.cos(ph)) ** 3 * sstep(.3, 1, v) * Math.abs(Math.sin(ph * 2)) * 2, rr = r0 * (1 - .14 * v * v) - pinch - (v > .92 ? (v - .92) * 2 * r0 * 1.4 : 0);
      const crease = v > .85 ? .07 * (1 - Math.abs(Math.sin(ph))) * sstep(.85, 1, v) : 0;
      cpos.push(o.x * Math.max(rr, .02), b.y + v * Hc - crease - .02 * Math.cos(ph) * v, zc + o.z * Math.max(rr, .02));
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; cidx.push(a, b, c, b, d, c) }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3)); cg.setIndex(cidx); cg.computeVertexNormals(); add('fabric', cg);
    { const last = []; for (let i = 0; i <= NA; i++) last.push(V(cpos[(NV * (NA + 1) + i) * 3], cpos[(NV * (NA + 1) + i) * 3 + 1], cpos[(NV * (NA + 1) + i) * 3 + 2])); const cen = last.reduce((a, b) => a.add(b), V()).multiplyScalar(1 / last.length); cen.y -= .03;
      const pos = [cen.x, cen.y, cen.z], idx = []; last.forEach(p => pos.push(p.x, p.y, p.z)); for (let i = 1; i <= NA; i++) idx.push(0, i, i + 1); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add('fabric', g) }
    // aba: larga, laterais viradas para cima, frente e trás levemente para baixo; com espessura
    const NB = 10, bpos = [], bidx = [];
    for (const side of [0, 1]) for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) {
      const w = j / NB, ph = -Math.PI + 2 * Math.PI * i / NA, b = R.at(ph), o = V(Math.sin(ph), 0, Math.cos(ph)), r0 = Math.hypot(b.x, b.z - zc) - .01;
      const ext = Wb * (.85 + .15 * Math.abs(Math.cos(ph))), up = .2 * Math.sin(ph) ** 2 * w * w - .05 * Math.cos(ph) ** 2 * w;
      bpos.push(o.x * (r0 + ext * w), b.y + up - side * .018 * (1 - .5 * w), zc + o.z * (r0 + ext * w));
    }
    const off = (NB + 1) * (NA + 1);
    for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; bidx.push(a, c, b, b, c, d); bidx.push(off + a, off + b, off + c, off + b, off + d, off + c) }
    for (let i = 0; i < NA; i++) { const a = NB * (NA + 1) + i, b = a + 1; bidx.push(a, a + off, b, b, a + off, b + off) } // borda
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); bg.setIndex(bidx); bg.computeVertexNormals(); add('fabric', bg);
    const welt=[];
    for(let i=0;i<=NA;i++){const ph=-Math.PI+2*Math.PI*i/NA,b=R.at(ph),o=V(Math.sin(ph),0,Math.cos(ph)),ext=Wb*(.85+.15*Math.abs(Math.cos(ph))),up=.2*Math.sin(ph)**2-.05*Math.cos(ph)**2;
      const p=b.clone().addScaledVector(o,ext);p.y+=up+.007;welt.push(p);
      if(i%2===0){const q=p.clone().addScaledVector(o,-.024);add('band',sphere(q,.006,1,1,1,8,6))}}
    add('band',tube(welt,.009,8));
    // fita + estrela de metal na frente
    const bandP = []; for (let i = 0; i <= NA; i++) { const ph = -Math.PI + 2 * Math.PI * i / NA, b = R.at(ph), o = V(Math.sin(ph), 0, Math.cos(ph)); bandP.push(b.clone().addScaledVector(o, .006).add(V(0, .045, 0))) }
    add('band', tube(bandP, .035, 8).scale(1, 1, 1));
    const f = R.at(0).add(V(0, .05, .04)), star = new THREE.Shape(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = k % 2 ? .022 : .055; k ? star.lineTo(Math.sin(a) * r, Math.cos(a) * r) : star.moveTo(Math.sin(a) * r, Math.cos(a) * r) }
    const sg = new THREE.ExtrudeGeometry(star, { depth: .01, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 3 }); add('metal', place(sg, f, V(0, 0, 1)));
    { const g = new THREE.TorusGeometry(head==='frontier_hat'?.13:.06, .009, 6, head==='frontier_hat'?40:24); add('metal', place(g, f.clone().add(V(0, 0, -.002)), V(0, 0, 1))) }
    if(head==='frontier_hat'){const g=badge('star',.115,.018);g.translate(f.x,f.y,f.z+.015);add('metal',g)}
  }
  if (head === 'tophat') { // cartolinha inclinada sobre um lado
    const base = V(-.26, 0, zc + .05); let y = top + .6; // apoia na superfície (pele ou cabelo) logo abaixo
    for (let k = 0; k < 200; k++) { const ph = Math.atan2(base.x, base.z - zc), rr = Math.hypot(base.x, base.z - zc); if (outerR(y, ph) >= rr) break; y -= .01 }
    const g = new THREE.Group(); const hatGeo = [];
    const cyl = new THREE.CylinderGeometry(.19, .17, .34, 40, 1, false); cyl.translate(0, .17, 0); hatGeo.push(['fabric', cyl]);
    const top2 = new THREE.CylinderGeometry(.19, .19, .012, 40); top2.translate(0, .345, 0); hatGeo.push(['fabric', top2]);
    const brim = new THREE.CylinderGeometry(.3, .3, .026, 64); brim.translate(0, .01, 0); hatGeo.push(['fabric', brim]);
    const band = new THREE.CylinderGeometry(.176, .174, .07, 40, 1, true); band.translate(0, .06, 0); hatGeo.push(['band', band]);
    for(const yy of [.027,.095]){const rim=new THREE.TorusGeometry(.176,.006,8,48);rim.rotateX(Math.PI/2);rim.translate(0,yy,0);hatGeo.push(['metal',rim])}
    const st = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, r = k % 2 ? .02 : .05; k ? st.lineTo(Math.sin(a) * r, Math.cos(a) * r) : st.moveTo(Math.sin(a) * r, Math.cos(a) * r) }
    const sg = new THREE.ExtrudeGeometry(st, { depth: .008, bevelEnabled: false }); sg.translate(0, .19, .172); hatGeo.push(['metal', sg]);
    const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-.12, .2, .3)).multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.25)).setPosition(base.x, y - .06, base.z + .02);
    for (const [k, gg] of hatGeo) add(k, gg.applyMatrix4(M));
  }
  if (head === 'bubbles') { // tiara de latão com globos de vidro e líquido brilhante
    const R = ring(top - .3, -.12, .004), band = []; for (let i = 0; i <= 96; i++) band.push(R.at(-Math.PI + 2 * Math.PI * i / 96));
    add('metal', tube(band, .03, 10)); add('metal', tube(band.map(p => p.clone().add(V(0, .045, 0))), .016, 8));
    const globes = [[0, .3, .2], [-.6, .12, .12], [.6, .12, .12], [-1.5, .1, .1], [1.5, .1, .1], [Math.PI, .14, .15]];
    for (const [ph, lift, r] of globes) {
      const p = R.at(ph), o = V(p.x, 0, p.z - zc).normalize(), c = p.clone().add(V(0, lift + r * .7, 0)).addScaledVector(o, .02 - r * .25);
      add('glass', sphere(c, r, 1, 1, 1, 28, 20)); { const g = new THREE.SphereGeometry(r * .9, 24, 12, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55); g.translate(c.x, c.y, c.z); add('liquid', g); const lid = new THREE.CircleGeometry(r * .89 * Math.sin(Math.PI * .45), 24); lid.rotateX(-Math.PI / 2); lid.translate(c.x, c.y + r * .9 * Math.cos(Math.PI * .45), c.z); add('liquid', lid) }
      const ringG = new THREE.TorusGeometry(r * .55, .012, 6, 24); ringG.rotateX(Math.PI / 2); ringG.translate(c.x, c.y - r * .82, c.z); add('metal', ringG);
      add('metal', tube([p.clone().add(V(0, .03, 0)), c.clone().add(V(0, -r * .85, 0))], .012, 6));
    }
  }

  // ---------------- orelhas ----------------
  const ears = fit.ears || [];
  if (sel.ears && ears.length) for (const e of ears) {
    const s = e.s, lobe = e.lobe.clone().add(V(s * .015, -.012, .01));
    if (sel.ears === 'drop') {
      add('metal', sphere(lobe, .018));
      add('metal', tube([lobe, lobe.clone().add(V(0, -.05, 0))], .006, 6));
      const c = lobe.clone().add(V(0, -.12, 0)), fr = new THREE.TorusGeometry(1, .16, 6, 24); fr.scale(.05, .072, .05); add('metal', place(fr, c, V(s, 0, .25)));
      add('gem2', gemGeo(c, .042, V(s, 0, .25), 1.45));
      for (let k = -1; k <= 1; k++) { const q = c.clone().add(V(0, -.085 - (k ? 0 : .025), k * .03)); add('metal', tube([c.clone().add(V(0, -.07, k * .022)), q], .004, 5)); add('pearl', sphere(q.add(V(0, -.012, 0)), .014)) }
    }
    if (sel.ears === 'hoops') { const g = new THREE.TorusGeometry(.075, .01, 8, 40); add('metal', place(g, lobe.clone().add(V(0, -.07, 0)), V(s, 0, .5))) }
    if (sel.ears === 'studs') { add('metal', sphere(lobe, .02, 1, 1, .5)); add('gem2', gemGeo(lobe.clone().add(V(s * .012, 0, 0)), .022, V(s, 0, .3), 1)) }
  }
  // ---------------- testa ----------------
  if (sel.forehead === 'tikka') {
    const yA = Math.min(top - .2, fit.P.eyeY + .95), yB = brow + .2, pts = [];
    for (let i = 0; i <= 24; i++) { const y = yA + (yB - yA) * i / 24; pts.push(V(0, y, fit.surfZ(0, y) + .012 + .03 * sstep(yB + .15, yA, y))) }
    for (let i = 0; i < pts.length; i += 2) add('metal', sphere(pts[i], .008, 1, 1, 1, 8, 6));
    const end = pts[pts.length - 1].clone(); end.z = fit.surfZ(0, end.y - .05) + .02;
    add('metal', sphere(end, .016)); const g = end.clone().add(V(0, -.065, .006));
    { const fr = new THREE.TorusGeometry(1, .17, 6, 20); fr.scale(.036, .05, .036); add('metal', place(fr, g, V(0, 0, 1))) }
    add('gem', gemGeo(g, .03, V(0, 0, 1), 1.5)); add('gem', sphere(g.clone().add(V(0, -.07, .004)), .012));
  }
  // ---------------- enfeites de cabelo ----------------
  if (sel.hairpin === 'flowers') {
    const spots = [[.95, .42, .075], [1.2, .22, .065], [1.05, .05, .055], [1.35, .48, .05]];
    for (const [ph, yy, r] of spots) {
      const y = brow + yy, rr = outerR(y, ph), o = V(Math.sin(ph), 0, Math.cos(ph)), c = V(o.x * rr, y, zc + o.z * rr).addScaledVector(o, .005);
      const n = o.clone().add(V(0, .25, .15)).normalize();
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, g = new THREE.SphereGeometry(1, 10, 6); g.scale(r * .23, r * .58, r * .07); g.translate(0, r * .55, 0); g.rotateZ(a); g.rotateX(.18); add('flower', place(g, c, n)) }
      const cg = new THREE.SphereGeometry(r * .26, 12, 8); cg.scale(1, 1, .55); add('pollen', place(cg, c.clone().addScaledVector(n, .01), n));
    }
  }
  if (sel.hairpin === 'coral') { // galho de coral preso no alto de um lado, com correntinha de contas
    const ph = .62, y = top - .22, rr = outerR(y, ph), o = V(Math.sin(ph), 0, Math.cos(ph)), base = V(o.x * rr, y, zc + o.z * rr);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const branch = (p, d, len, r, lvl) => {
      const pts = [p.clone()], q = p.clone(), dir = d.clone();
      for (let i = 0; i < 8; i++) { dir.add(V(rnd() - .5, rnd() - .3, rnd() - .5).multiplyScalar(.35)).normalize(); q.addScaledVector(dir, len / 8); pts.push(q.clone()) }
      add('flower', tube(pts, t => r * (1 - .6 * t) + .003, 7)); add('flower', sphere(q, r * .45 + .003, 1, 1, 1, 8, 6));
      if (lvl < 3) for (let k = 0; k < 2 + (lvl < 1 ? 1 : 0); k++) { const i = 3 + Math.floor(rnd() * 4); branch(pts[i], dir.clone().add(V(rnd() - .5, .4, rnd() - .5)).normalize(), len * .62, r * .62, lvl + 1) }
    };
    branch(base, o.clone().add(V(0, 1.1, -.3)).normalize(), .26, .022, 0);
    const chain = []; for (let i = 0; i <= 12; i++) { const t = i / 12; chain.push(base.clone().add(V(o.x * .02, -t * .5, -t * .1)).addScaledVector(o, .03 + .05 * Math.sin(Math.PI * t))) }
    chain.forEach((p, i) => add('metal', sphere(p, i % 3 ? .009 : .014, 1, 1, 1, 8, 6)));
  }
  // ---------------- rosto ----------------
  if (sel.face === 'glasses' && fit.eyes && fit.eyes.length === 2) {
    const separation=Math.abs(fit.eyes[1].x-fit.eyes[0].x),R=Math.min(fit.eyes[0].R*1.22,separation*.47);
    // Aros medidos contra o rosto completo: a ponte do nariz pode avançar além do globo.
    // O antigo raio cruzava os dois aros e deixava os trechos internos enterrados na face.
    let zF=Math.max(...fit.eyes.map(e=>e.z+e.R))+.05;
    for(const e of fit.eyes)for(let j=0;j<72;j++){const a=j/72*Math.PI*2;zF=Math.max(zF,fit.surfZ(e.x+R*Math.cos(a),e.y-.01+R*Math.sin(a))+.045)}
    for (const e of fit.eyes) {
      const c = V(e.x, e.y - .01, zF), g = new THREE.TorusGeometry(R, .018, 20, 96); g.translate(c.x, c.y, c.z); add('metal', g);
      const lens = lensGeometry(R,.010,.003); lens.translate(c.x, c.y, c.z - .003); add('glass', lens);
      const s = Math.sign(e.x), hinge = V(e.x + s * R, e.y, zF - .01), back = V(s * (traceR(sdf, e.y, s * 80 * DEG, zc) * Math.sin(80 * DEG) + .04), e.y + .02, (fit.ears[0] ? fit.ears[0].center.z : zc - .1) + .05);
      add('metal', tube([hinge, hinge.clone().lerp(back, .5).add(V(s * .03, .012, 0)), back], .012, 12));
      add('pad',tube([back.clone().lerp(hinge,.18),back,back.clone().add(V(-s*.015,-.075,-.02))],.018,12));
      add('metal',sphere(hinge,.023,1,1,.55));
      const pad=V(e.x-s*R*.76,e.y-.025,0);pad.z=fit.surfZ(pad.x,pad.y)+.018;add('nosePad',sphere(pad,.016,.65,1.5,.55));add('metal',tube([V(e.x-s*R*.84,e.y+.025,zF),pad.clone().add(V(0,.015,.008)),pad],.004,10));
    }
    const a = fit.eyes[0], b = fit.eyes[1], mid = V(0, a.y + .04, zF + .01), pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(V(a.x + (b.x - a.x) * t - Math.sign(a.x - b.x) * 0, 0, 0)) }
    const l = V(Math.sign(a.x) * (Math.abs(a.x) - R), a.y + .02, zF), r2 = V(Math.sign(b.x) * (Math.abs(b.x) - R), b.y + .02, zF);
    add('metal', tube([l, l.clone().lerp(mid, .5).add(V(0, .02, 0)), mid, r2.clone().lerp(mid, .5).add(V(0, .02, 0)), r2], .011, 6));
  }

  // Elementos lunares reaproveitam a medição externa do cabelo e as órbitas do rosto.
  if(head==='leaf_crown'){
    const R=ring(top-.29,-.04,.03);
    for(let i=0;i<13;i++){const a=-1.2+i*.2,p=R.at(a),g=leafGeo(.09+(i===6?.05:0),.018);g.rotateZ((i%2?1:-1)*.5);add('metal',place(g,p.clone().add(V(0,.10,0)),V(Math.sin(a),0,Math.cos(a))));if(i%2===0)add('gem2',gemGeo(p.clone().add(V(0,.025,.015)),.035,V(Math.sin(a),0,Math.cos(a)),1.35))}
    const p=R.at(0).add(V(0,.11,.025));add('gem',gemGeo(p,.07,V(0,0,1),1.5));
  }
  if(head==='moon_crown'){
    const R=ring(top-.3,-.08,.025),p=R.at(0).add(V(0,.17,.015)),g=crescent(.2,.035);g.translate(...p.toArray());add('metal',g);
    add('gem2',gemGeo(p.clone().add(V(.045,0,.025)),.055,V(0,0,1),1.25));
    for(const side of [-1,1]){const q=R.at(side*.63).add(V(0,.11,.02)),m=crescent(.11,.022);m.rotateZ(side*.3);add('metal',place(m,q,V(Math.sin(side*.63),0,Math.cos(side*.63))));add('gem',gemGeo(q.clone().add(V(0,.12,0)),.035,V(side*.4,0,1),1.5));}
  }
  if(head==='goggles'){
    const R=ring(top-.3,-.06,.04);
    // A mesma correia e os mesmos óculos, agora com espessura, aro, junta e lente curva.
    add('band',clothSurface(6,128,(t,u)=>R.at(.62+u*(Math.PI*2-1.24)).add(V(0,(t-.5)*.065,0)),{thickness:.016}));
    for(const edge of [-.027,.027])for(let i=0;i<64;i++){
      const a=.62+i/64*(Math.PI*2-1.24),b=.62+(i+.48)/64*(Math.PI*2-1.24);add('fabric',tube([R.at(a).add(V(0,edge,0)),R.at(b).add(V(0,edge,0))],.0025));
    }
    const centers=[];
    for(const side of [-1,1]){
      const p=R.at(side*.36).add(V(0,.05,.055)),dir=V(side*.18,.05,1).normalize();centers.push(p);
      const body=new THREE.CylinderGeometry(.177,.169,.050,64,1,true);body.rotateX(Math.PI/2);add('metal',place(body,p.clone().addScaledVector(dir,-.012),dir));
      for(const [radius,width,depth,key]of [[.164,.019,.025,'metal'],[.146,.008,.026,'band'],[.176,.008,-.035,'metal']])add(key,place(new THREE.TorusGeometry(radius,width,16,64),p.clone().addScaledVector(dir,depth),dir));
      add('goggleGlass',place(lensGeometry(.145,.023,.006),p.clone().addScaledVector(dir,.020),dir));
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2,q=V(Math.cos(a)*.164,Math.sin(a)*.164,.038),disc=new THREE.CylinderGeometry(.008,.008,.006,16);disc.rotateX(Math.PI/2);disc.translate(...q.toArray());add('metal',place(disc,p,dir));
        add('band',place(tube([q.clone().add(V(-.005,0,.004)),q.clone().add(V(.005,0,.004))],.0016),p,dir));
      }
      add('gem2',sphere(p.clone().add(V(side*.21,0,0)),.035));
    }
    add('metal',tube([centers[0].clone().add(V(.17,0,0)),V(0,centers[0].y+.02,centers[0].z+.02),centers[1].clone().add(V(-.17,0,0))],.014));
  }
  if(sel.face==='visor'&&fit.eyes?.length===2){
    const y=fit.eyes.reduce((a,e)=>a+e.y,0)/2,halfW=Math.max(...fit.eyes.map(e=>Math.abs(e.x)+e.R*.90)),halfH=Math.max(...fit.eyes.map(e=>e.R))*.88,corner=Math.min(.07,halfH*.32),bend=.105;
    const halfWidth=t=>{const q=Math.max(0,Math.abs((t-.5)*2*halfH)-(halfH-corner));return halfW-corner+Math.sqrt(Math.max(0,corner*corner-q*q))};
    let z=Math.max(...fit.eyes.map(e=>e.z+e.R))+.07;
    for(let i=0;i<=12;i++)for(let j=0;j<=32;j++){const t=i/12,x=(.5-j/32)*2*halfWidth(t),yy=y+(t-.5)*2*halfH;z=Math.max(z,fit.surfZ(x,yy)+.050+bend*(x/halfW)**2)}
    const point=(t,u)=>{const x=(.5-u)*2*halfWidth(t);return V(x,y+(t-.5)*2*halfH+.065*Math.exp(-((x/.16)**2))*(1-t)**3,z-bend*(x/halfW)**2)};
    // Casca curva e fina, com contorno contínuo; o visor acompanha a largura real do rosto.
    add('visor',clothSurface(20,64,point,{thickness:.010}));
    const rim=[];for(let j=0;j<48;j++)rim.push(point(0,j/48));for(let i=0;i<24;i++)rim.push(point(i/24,1));for(let j=0;j<48;j++)rim.push(point(1,1-j/48));for(let i=0;i<=24;i++)rim.push(point(1-i/24,0));
    add('frame',tube(rim,.014,16));
    add('frame',tube(Array.from({length:49},(_,j)=>point(1,j/48)),.023,16));
    for(const side of [-1,1]){
      const q=point(.5,side<0?1:0),ear=fit.ears.find(e=>Math.sign(e.center.x)===side)?.center||V(side*.78,y,-.12),hinge=V(side*(traceR(sdf,y,side*80*DEG,zc)*Math.sin(80*DEG)+.055),y+.01,ear.z+.06);
      add('frame',sphere(q.clone().add(V(side*.015,0,-.005)),.036,1.2,.75,.65));add('frame',tube([q,hinge.clone().lerp(q,.45),hinge],.022));add('metal',sphere(q.clone().add(V(side*.018,0,.018)),.010));add('pad',tube([hinge.clone().lerp(q,.15),hinge,hinge.clone().add(V(-side*.01,-.075,-.03))],.023));
    }
  }

  if(sel.face==='monocle'&&fit.eyes?.length){
    const e=fit.eyes.find(e=>e.x<0)||fit.eyes[0],r=Math.min(e.R*1.16,Math.abs(e.x)*.95);let front=e.z+e.R+.07;
    for(let j=0;j<72;j++){const a=j/72*Math.PI*2;front=Math.max(front,fit.surfZ(e.x+r*1.2*Math.cos(a),e.y+r*1.2*Math.sin(a))+.05)}
    const p=V(e.x,e.y,front),g=new THREE.TorusGeometry(r,.020,16,64);g.translate(...p.toArray());add('metal',g);
    const shape=new THREE.Shape(),outer=r*1.12;for(let j=0;j<64;j++){const a=j/64*Math.PI*2,rr=outer*(j%4<2?1:.965);if(j)shape.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else shape.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}shape.closePath();const opening=new THREE.Path();opening.absarc(0,0,r*.94,0,Math.PI*2,false);shape.holes.push(opening);const cog=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:3,curveSegments:48});cog.translate(p.x,p.y,p.z-.02);add('metal',cog);
    const glass=lensGeometry(r*.94,.012,.004);glass.translate(p.x,p.y,p.z);add('glass',glass);
    for(let j=0;j<21;j++){const t=j/20,q=p.clone().add(V(-r-.045*Math.sin(t*Math.PI),-.015-j*.018,-.07*t)),link=new THREE.TorusGeometry(.012,.003,8,16);link.scale(.72,1,1);link.rotateY(j%2?Math.PI/2:0);link.translate(...q.toArray());add('metal',link)}
    add('gem2',sphere(p.clone().add(V(-r,0,.02)),.035));
  }

  // Chapéus do deserto: somente modelos novos, sem alterar os encaixes anteriores.
  if(sel.head==='chef_hat'){
    const y=top-.20,R=ring(y,-.04,.025),profile=t=>{const pts=[[0,1],[.18,1.10],[.47,1.18],[.72,1.0],[.9,.64],[1,.035]];let i=1;while(t>pts[i][0])i++;const a=pts[i-1],b=pts[i],u=sstep(a[0],b[0],t);return a[1]+(b[1]-a[1])*u};
    add('fabric',clothSurface(48,120,(t,u)=>{const ph=u*Math.PI*2,p=R.at(ph),r=Math.hypot(p.x,p.z-zc)*profile(t)+.014*Math.sin(ph*24)*Math.sin(Math.PI*t);return V(Math.sin(ph)*r,y+1.0*t,zc+Math.cos(ph)*r)},{closed:true,thickness:.025}));
    for(const dy of [0,.12])add('fabric',tube(Array.from({length:97},(_,i)=>R.at(i/96*Math.PI*2).add(V(0,dy,0))),.018));
  }
  if(head==='frontier_hat'||head==='guard_helmet')cactusHeadgear({head,fit,ring,add,tube,sphere,place,gemGeo,mats});
  if(sel.head==='vigilante_hood'){
    const point=(t,u)=>{const ph=Math.PI*.32+u*Math.PI*1.36,y=-1.0+(top+1.16)*t,base=.08+.92*Math.sin(Math.PI*(.16+.84*t)),r=Math.max(base,outerR(y,ph)+.085);return V(Math.sin(ph)*r,y,zc+Math.cos(ph)*r)};
    add('fabric',clothSurface(64,96,point,{thickness:.038}));
    for(const u of [0,1])add('band',tube(Array.from({length:65},(_,i)=>point(i/64,u)),.018));
    const maskPoint=(t,u)=>{const x=(u-.5)*1.14*(1-.18*t),yy=THREE.MathUtils.lerp(P.noseTipY-.04,P.loft.y[0]-.015,t)+.055*Math.exp(-((x/.20)**2))*(1-t),z=fit.surfZ(x,yy)+.042+.012*Math.sin(t*Math.PI*3)*Math.sin(Math.PI*u);return V(x,yy,z)};
    add('fabric',clothSurface(40,64,maskPoint,{thickness:.014}));
    for(const t of [0,1])add('band',tube(Array.from({length:49},(_,j)=>maskPoint(t,j/48)),.009));
    for(const u of [0,1])add('band',tube(Array.from({length:33},(_,j)=>maskPoint(j/32,u)),.009));
  }

  // Assentos e garras acompanham a lapidação de cada pedra, sem mudar seu desenho.
  for(const key of ['gem','gem2'])for(const stone of geos[key]||[]){
    const S=stone.userData.setting;if(!S)continue;const seat=new THREE.TorusGeometry(S.r*1.015,S.r*.085,12,40);seat.scale(1,S.stretch,1);add('metal',place(seat,S.p.clone().addScaledVector(S.dir,-S.r*.04),S.dir));
    for(let j=0;j<4;j++){
      const a=Math.PI*.25+j*Math.PI/2,c=Math.cos(a),s=Math.sin(a),pts=[V(c*S.r*1.05,s*S.r*S.stretch*1.05,-S.r*.17),V(c*S.r*1.05,s*S.r*S.stretch*1.05,S.r*.12),V(c*S.r*.87,s*S.r*S.stretch*.87,S.r*.21)];
      add('metal',place(tube(pts,Math.max(.0015,S.r*.052)),S.p,S.dir));
    }
  }
  // ---------------- malhas por material ----------------
  const matOf = k => k === 'metalD' ? mats.metal : mats[k];
  for (const [k, list] of Object.entries(geos)) {
    const norm = list.map(g => { for (const attribute of Object.keys(g.attributes)) if (!(k==='plume'?['position','normal','uv']:['position','normal']).includes(attribute)) g.deleteAttribute(attribute); if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g.toNonIndexed() : g });
    const merged = mergeGeometries(norm, false); norm.forEach(g => g.dispose()); list.forEach(g => g.dispose());
    if (!merged) continue;
    if(['metal','metalD','fabric','band'].includes(k)){
      const p=merged.attributes.position, colors=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){const variation=.965;colors.fill(variation,i*3,i*3+3)}
      merged.setAttribute('color',new THREE.BufferAttribute(colors,3));matOf(k).vertexColors=true;
    }
    if(k==='plume'&&merged.attributes.uv){groomSurface(matOf(k),{roughness:matOf(k).roughness,anisotropy:.3});merged.setIndex(Array.from({length:merged.attributes.position.count},(_,i)=>i));merged.computeTangents()}
    else if(['metal','metalD','fabric','band'].includes(k))heroSurface(merged,matOf(k),k.startsWith('metal')||matOf(k).metalness>.5?'metal':k==='band'||['cowboy','frontier_hat'].includes(head)?'leather':'fabric');
    const m = new THREE.Mesh(merged, matOf(k)); m.name = 'Acc_' + (sel.head && ['metal', 'metalD', 'fabric', 'band', 'glass', 'liquid'].includes(k) ? '' : '') + k; m.castShadow = !matOf(k).transparent; m.receiveShadow = true;
    if (k === 'glass') m.renderOrder = 2;
    group.add(m);
  }
  return { group, setColors, dispose };
}
