// Figurinos procedurais no espaço do corpo. Nenhuma alteração na pele ou no rig facial.
import * as THREE from 'three';
import { clothSurface, smoothCloth } from './fabric.js';
import { sdfMesh } from './body.js';

const DEFAULTS={fabric:'#324c78',secondary:'#e8d9b6',accent:'#8e3326',pants:'#3a3836',trim:'#c59842',leather:'#493028'};

export function buildLegacyClothes(body, look, slot) {
  const group = new THREE.Group(); group.name = 'Figurino';
  const materials = {};
  for (const key of Object.keys(DEFAULTS)) {
    materials[key] = new THREE.MeshStandardMaterial({ name: 'Roupa_' + key, color: look.clothColors?.[key] || DEFAULTS[key], roughness: key === 'trim' ? .38 : .88, metalness: key === 'trim' ? .65 : 0, side: THREE.DoubleSide });
  }
  const result = { group, setColors(colors) { for (const [key, mat] of Object.entries(materials)) mat.color.set(colors[key] || DEFAULTS[key]) }, dispose() { group.traverse(o => { if (o.isMesh) o.geometry.dispose() }); Object.values(materials).forEach(m => m.dispose()) } };
  const style = look.outfit;

  if (!body || !['casual','dress','clown','warrior','cowboy','royal','inventor'].includes(style) || style === 'none') return result;
  const B = body.proportions, J = body.joints, L = J.Lb, W = B.W, zc = J.zCenter;
  const Y = f => J.yNeck - L * f;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (name, geo, channel = 'fabric') => { const m = new THREE.Mesh(geo, materials[channel]); m.name = 'Roupa_' + name; m.castShadow = true; m.receiveShadow = true; group.add(m); return m };
  const ball = (name, p, scale, channel) => { const m = add(name, new THREE.SphereGeometry(1, 16, 12), channel); m.position.copy(p); m.scale.set(...scale); return m };
  const line = (name, points, radius, channel = 'trim') => add(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(24, points.length * 3), radius, 6, false), channel);

  // Seções medidas no SDF: envoltória do tronco com limite lateral para excluir os braços.
  const radii = new Map();
  function radius(f, a) {
    const key = f.toFixed(5) + '|' + a.toFixed(5);
    if (radii.has(key)) return radii.get(key);
    const y = Y(f), dx = Math.sin(a), dz = Math.cos(a);
    // Usa a última saída do tronco: sulcos do cacto e volumes do quadril podem ter mais de um cruzamento.
    const maxX = f < .12 ? J.shoulder.x + .35 * W : f < .3 ? J.shoulder.x * .85 + .06 * W : W * (B.hip + .35);
    const limit = Math.min(W * 2.5, maxX / Math.max(.001, Math.abs(dx)), W * (B.depth + .35) / Math.max(.001, Math.abs(dz)));
    let lastInside = 0;
    for (let r = .02; r <= limit; r += .045) if (body.sdf(dx * r, y, zc + dz * r) <= 0) lastInside = r;
    let lo = lastInside, hi = Math.min(limit, lastInside + .045);
    for (let i = 0; i < 5; i++) { const m = (lo + hi) / 2; if (body.sdf(dx * m, y, zc + dz * m) > 0) hi = m; else lo = m }
    radii.set(key, hi); return hi;
  }
  function point(f, a, pad = .13 * W, flare = 0) {
    // A partir do quadril, o tecido cai como saia/casaco em vez de entrar entre as pernas.
    const sample = Math.min(f, .43), drape = Math.max(0, f - .32) * flare * L;
    const blend = THREE.MathUtils.smoothstep(f, .35, .43);
    const hip = f > .35 ? Math.max(...[.4, .43, .46, .48].map(h => radius(h, a))) : 0;
    const base = radius(sample, a), r = Math.max(base, THREE.MathUtils.lerp(base, hip, blend)) + pad + drape;
    return V(Math.sin(a) * r, Y(f), zc + Math.cos(a) * r);
  }
  function surface(name, f0, f1, { pad = .13 * W, flare = 0, start = 0, end = Math.PI * 2, channel = 'fabric', stripes = false, wave = 0 } = {}) {
    const target=/Saia|Saiote/.test(name)?'lower':name==='Cinto'?'belt':name==='Capa'?'cape':'upper';
    if(slot!==target)return;
    const rows=64,cols=128,closed=Math.abs(end-start-Math.PI*2)<1e-5;
    // Splines periódicas eliminam as quinas entre as medidas angulares do corpo.
    const rings=Array.from({length:49},(_,j)=>{
      const f=THREE.MathUtils.lerp(f0,f1,j/48),pts=[];
      for(let i=0;i<(closed?96:97);i++){const a=THREE.MathUtils.lerp(start,end,i/96);pts.push(point(f,a,pad+wave*(.5+.5*Math.cos(a*18)),flare))}
      return new THREE.CatmullRomCurve3(pts,closed,'catmullrom',.5);
    });
    const curves=Array.from({length:cols+1},(_,i)=>new THREE.CatmullRomCurve3(rings.map(r=>r.getPoint(i/cols)),false,'catmullrom',.5));
    const geo=clothSurface(rows,cols,(t,u)=>curves[Math.round(u*cols)].getPoint(t),{closed,thickness:.025*W});
    const m=add(name,geo,channel);
    return m;
  }
  function edge(name, f, options = {}) {
    const points = [];
    for (let i = 0; i <= 64; i++) points.push(point(f, i / 64 * Math.PI * 2, options.pad ?? .15 * W, options.flare || 0));
    return line(name, points, .022 * W, options.channel || 'trim');
  }
  // Recorte interpolado da malha do corpo, com folga ao longo das normais. Mantém dedos e rosto intactos.
  function shell(name, field, pad, channel, stripes = false) {
    const geo = body.geo, p = geo.attributes.position, n = geo.attributes.normal, ix = geo.index.array, vertices = [], normals = [], indices = [[], []], shared = new Map();
    for (let i = 0; i < ix.length; i += 3) {
      let poly = [ix[i], ix[i + 1], ix[i + 2]].map(k => ({ p: V(p.getX(k), p.getY(k), p.getZ(k)), n: V(n.getX(k), n.getY(k), n.getZ(k)) }));
      const clipped = [];
      for (let j = 0; j < 3; j++) {
        const a = poly[j], b = poly[(j + 1) % 3], fa = field(a.p), fb = field(b.p);
        if (fa >= 0) clipped.push(a);
        if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); clipped.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() }) }
      }
      poly = clipped;
      for (let j = 1; j + 1 < poly.length; j++) {
        const tri = [poly[0], poly[j], poly[j + 1]], x = tri.reduce((v, q) => v + q.p.x / 3, 0), z = tri.reduce((v, q) => v + q.p.z / 3, 0);
        const angle = Math.atan2(x - Math.sign(x) * J.ankle.x, z - zc), channelIndex = stripes ? Math.floor((angle + Math.PI) * 3) % 2 : 0;
        for (const q of tri) {
          const v = q.p.clone().addScaledVector(q.n, pad), key = [v.x, v.y, v.z].map(c => c.toFixed(6)).join('|');
          let index = shared.get(key);
          if (index === undefined) { index = vertices.length / 3; shared.set(key, index); vertices.push(v.x, v.y, v.z); normals.push(q.n.x, q.n.y, q.n.z) }
          indices[channelIndex].push(index);
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // Compartilha vértices e agrupa índices por tecido: duas chamadas de desenho para as listras.
    g.setIndex([...indices[0], ...indices[1]]);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    const m = add(name, g, channel);
    if (stripes) { m.material = [materials.fabric, materials.secondary]; g.addGroup(0, indices[0].length, 0); g.addGroup(indices[0].length, indices[1].length, 1) }
    return m;
  }
  const fAt = p => (J.yNeck - p.y) / L;
  const isDress = style === 'dress', isRoyal = style === 'royal', isClown = style === 'clown';
  // Calças cobrem quadril e virilha; a túnica cruza a cintura para evitar frestas.
  if (!isDress && !isRoyal && slot==='lower') {
    // Campo unido: as duas pernas não deixam cascas sobrepostas na virilha.
    const field=(x,y,z)=>Math.max(body.sdf(x,y,z)-.06*W,y-Y(.39),J.ankle.y+.025-y,Math.abs(x)-W*(B.hip+.28));
    const bounds={x:J.bounds.x+.2,y0:J.ankle.y-.1,y1:Y(.39)+.15,z0:J.bounds.z0-.2,z1:J.bounds.z1+.2};
    add('Calca',smoothCloth(sdfMesh(field,bounds,.03*W),3),'secondary');
  }

  if(slot==='feet')shell('Botas', p => Math.min(J.ankle.y + L * .12 - p.y, J.ankle.x + W * .36 - Math.abs(p.x)), .085 * W, 'leather');
  if(slot==='feet')for (const s of [-1, 1]) {
    const an = J.ankle;
    ball('FivelaBota', V(s * an.x, an.y + L * .08, an.z + .22 * W), [.085 * W, .065 * W, .035 * W], 'trim');
  }
  if (style === 'warrior') {
    surface('Saiote', .36, .59, { pad: .23 * W, flare: .16, stripes: true });
    edge('Cinto', .38, { pad: .15 });
    const sh = J.shoulder;
    ball('Ombreira', V(-sh.x, sh.y + .04, sh.z), [.49 * W, .41 * W, .46 * W], 'leather');
    for (let i = 0; i < 5; i++) {
      const a = i / 4 * Math.PI, m = add('Espinho', new THREE.ConeGeometry(.075 * W, .28 * W, 8), 'trim');
      m.position.set(-sh.x + Math.cos(a) * .28 * W, sh.y + .49 * W, sh.z + Math.sin(a) * .27 * W); m.rotation.z = -(i - 2) * .18;
    }
    const strap = [];
    for (let i = 0; i <= 24; i++) { const f = .07 + i / 24 * .3, a = -.95 + i / 24 * 1.65; strap.push(point(f, a, .12)) }
    line('Correia', strap, .075 * W, 'leather');
    if(slot==='extras')shell('Bracadeiras', p => { const q = V(Math.abs(p.x), p.y, p.z), d = J.elbow.distanceTo(J.wrist), t = q.clone().sub(J.elbow).dot(J.wrist.clone().sub(J.elbow)) / (d * d); return Math.min(t - .15, .88 - t, Math.abs(p.x) - J.shoulder.x) }, .08 * W, 'leather');
  } else {
    const bottom = isRoyal ? .89 : isDress ? .72 : isClown ? .48 : .46;
    surface(isDress||isRoyal?(slot==='lower'?'Saia':'Tunica'):'Tunica', (isDress||isRoyal)&&slot==='lower'?.325:.005, (isDress||isRoyal)&&slot==='upper'?.335:bottom,
      {flare:isDress?.25:isRoyal?.11:isClown?.045:0,stripes:isClown,wave:isDress||isRoyal?.012*W:0});
    edge('Gola', .005, { pad: .15 * W }); edge('Barra', bottom, { flare: isDress ? .25 : isRoyal ? .11 : isClown ? .045 : 0 });
    if(slot==='upper')shell('Mangas', p=>Math.min(Math.abs(p.x)-J.shoulder.x*.78,p.y-(isDress||style==='cowboy'?Y(.17):J.wrist.y+.1*L),Y(0)-p.y),.08*W,'fabric');
    if (slot==='upper'&&(style === 'inventor' || style === 'cowboy')) {
      surface(style === 'inventor' ? 'Jaleco' : 'Colete', .035, style === 'inventor' ? .72 : .4, { pad: .23 * W, start: .28, end: Math.PI * 2 - .28, flare: style === 'inventor' ? .13 : 0, channel: style === 'inventor' ? 'fabric' : 'leather' });
      for (const s of [-1, 1]) {
        const lapel = [];
        for (let i = 0; i <= 16; i++) lapel.push(point(.04 + i / 16 * .19, s * (.3 + Math.sin(i / 16 * Math.PI) * .14), .26 * W));
        line('Lapela', lapel, .035 * W);
      }
    }
    if (isRoyal) {
      if(slot==='cape')surface('Capa', .045, .94, { pad: .23 * W, start: Math.PI * .36, end: Math.PI * 1.64, flare: .19, channel: 'fabric' });
      ball('Broche', point(.09, 0, .15), [.14 * W, .16 * W, .065 * W], 'trim');
    }
    if (style === 'cowboy') {
      surface('Lenco', .015, .09, { pad: .14 * W, channel: 'secondary' });
      const a = point(.09, -.55, .16 * W), b = point(.09, .55, .16 * W), c = point(.2, 0, .17 * W);
      const g = new THREE.BufferGeometry().setFromPoints([a, b, c]); g.computeVertexNormals(); add('PontaLenco', g, 'secondary');
    }
    if (isClown) {
      // Gola em sanfona, com duas bordas onduladas e pompons sobre as listras.
      const p = [], ix = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i <= 96; i++) {
        const a = i / 96 * Math.PI * 2, r = (.4 + j * .22) * W, y = Y(.02) - j * .05 + Math.sin(a * 18) * .065 * j;
        p.push(Math.sin(a) * r, y, zc + Math.cos(a) * r);
        if (j < 2 && i < 96) { const k = j * 97 + i; ix.push(k, k + 97, k + 1, k + 1, k + 97, k + 98) }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals(); add('GolaFranzida', g, 'secondary');
      for (const f of [.15, .26, .37]) ball('Pompon', point(f, 0, .16 * W), [.12 * W, .12 * W, .12 * W], 'fabric');
    } else if (style === 'inventor' || style === 'casual') for (const f of [.12, .19, .26]) ball('Botao', point(f, 0, .13 * W), [.04 * W, .04 * W, .025 * W], 'trim');
  }
  if (!isClown&&slot==='belt') {
    surface('Cinto', .305, .333, { pad: .15 * W, channel: 'leather' });
    ball('Fivela', point(.32, 0, .20 * W), [.14 * W, .085 * W, .035 * W], 'trim');
  }
  return result;
}
