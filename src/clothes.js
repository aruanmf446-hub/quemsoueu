// Figurinos procedurais no espaço do corpo. Nenhuma alteração na pele ou no rig facial.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSdfOutfit, twoTone, stripeMaterial, SDF_OUTFITS, SDF_DEFAULT_COLORS, SDF_DEFAULT_OUTFIT } from './outfits.js';

export const OUTFITS = {
  none: { label: 'Sem roupa', sub: 'Somente a malha do corpo' },
  casual: { label: 'Aventureiro', sub: 'Túnica, calça e botas' },
  dress: { label: 'Vestido', sub: 'Saia rodada e cinto' },
  clown: { label: 'Palhaço', sub: 'Listras, pompons e gola franzida' },
  warrior: { label: 'Guerreiro', sub: 'Couro, ombreira e rebites' },
  cowboy: { label: 'Faroeste', sub: 'Colete, lenço e botas' },
  royal: { label: 'Realeza', sub: 'Túnica longa, capa e broche' },
  inventor: { label: 'Inventor', sub: 'Jaleco, botões e cinto' },
  ...SDF_OUTFITS
};
export const CLOTH_COLORS = [['Vinho', '#822e42'], ['Vermelho', '#b83c32'], ['Azul', '#324c78'], ['Petróleo', '#246366'], ['Verde', '#426349'], ['Roxo', '#66467f'], ['Creme', '#e8d9b6'], ['Branco', '#e6e3de'], ['Caramelo', '#93613c'], ['Marrom', '#493028'], ['Grafite', '#30323c'], ['Dourado', '#c59842'], ['Azul real', '#2f4fb5'], ['Turquesa', '#4f8fd8'], ['Rubi', '#c4161f'], ['Preto', '#17111a'], ['Pérola', '#f3f1ee'], ['Cinza ferro', '#8c8a86'], ['Osso', '#e8dcc0']];
export const CLOTH_CHANNELS = { fabric: 'Tecido principal', secondary: 'Tecido secundário', accent: 'Destaque', pants: 'Calça', trim: 'Acabamentos e metal', leather: 'Couro e calçados' };
const DEFAULTS = { fabric: '#324c78', secondary: '#e8d9b6', accent: '#8e3326', pants: '#3a3836', trim: '#c59842', leather: '#493028' };
// cores padrão de um figurino (ao escolher o figurino no catálogo)
export const outfitColors = id => ({ ...DEFAULTS, ...(SDF_DEFAULT_COLORS[id] || {}) });
export function defaultClothes(id) {
  const styles = { feminine_soft: 'dress', feminine_bold: 'dress', cute_round: 'casual', masculine_soft: 'casual', old_king: 'royal', alchemist_villain: 'inventor', dwarf_bard: 'casual', sad_clown: 'clown', orc_warrior: 'warrior', cactus_cowboy: 'cowboy', pepper_king: 'royal', chili_bandit: 'cowboy' };
  const colors = id === 'sad_clown' ? { fabric: '#822e42', secondary: '#e8d9b6', leather: '#822e42' } : id === 'pepper_king' || id === 'old_king' ? { fabric: '#822e42' } : id === 'alchemist_villain' ? { fabric: '#e6e3de', secondary: '#324c78' } : id === 'orc_warrior' || id === 'cactus_cowboy' ? { fabric: '#93613c', secondary: '#30323c' } : {};
  if (SDF_DEFAULT_OUTFIT[id]) return { outfit: SDF_DEFAULT_OUTFIT[id], clothColors: outfitColors(SDF_DEFAULT_OUTFIT[id]) };
  return { outfit: styles[id] || 'none', clothColors: { ...DEFAULTS, ...colors } };
}

export function buildClothes(body, look) {
  const group = new THREE.Group(); group.name = 'Figurino';
  const materials = {};
  for (const key of Object.keys(DEFAULTS)) {
    materials[key] = new THREE.MeshStandardMaterial({ name: 'Roupa_' + key, color: look.clothColors?.[key] || DEFAULTS[key], roughness: key === 'trim' ? .38 : .88, metalness: key === 'trim' ? .65 : 0, side: THREE.DoubleSide });
  }
  const result = { group, setColors(colors) { for (const [key, mat] of Object.entries(materials)) mat.color.set(colors[key] || DEFAULTS[key]) }, dispose() { group.traverse(o => { if (o.isMesh) o.geometry.dispose() }); Object.values(materials).forEach(m => m.dispose()) } };
  const style = look.outfit;
  if (SDF_OUTFITS[style] && body) return buildSculpted(body, style, look.clothColors || outfitColors(style));
  if (!body || !OUTFITS[style] || style === 'none') return result;
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
    const rows = 36, cols = 64, p = [], ids = [[], []];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const f = THREE.MathUtils.lerp(f0, f1, j / rows), a = THREE.MathUtils.lerp(start, end, i / cols), q = point(f, a, pad + wave * (.5 + .5 * Math.cos(a * 18)), flare);
      p.push(q.x, q.y, q.z);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i, b = a + cols + 1, channelIndex = stripes && Math.floor(i / 5) % 2 ? 1 : 0;
      ids[channelIndex].push(a, b, a + 1, a + 1, b, b + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setIndex([...ids[0], ...ids[1]]); geo.computeVertexNormals();
    const m = add(name, geo, channel);
    if (stripes) { m.material = [materials.fabric, materials.secondary]; geo.addGroup(0, ids[0].length, 0); geo.addGroup(ids[0].length, ids[1].length, 1) }
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
  if (!isDress && !isRoyal) shell('Calca', p => Math.min(fAt(p) - .39, p.y - (J.ankle.y + .025), W * (B.hip + .28) - Math.abs(p.x)), .065 * W, 'secondary', isClown);
  shell('Botas', p => Math.min(J.ankle.y + L * .12 - p.y, J.ankle.x + W * .36 - Math.abs(p.x)), .085 * W, 'leather');
  for (const s of [-1, 1]) {
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
    shell('Bracadeiras', p => { const q = V(Math.abs(p.x), p.y, p.z), d = J.elbow.distanceTo(J.wrist), t = q.clone().sub(J.elbow).dot(J.wrist.clone().sub(J.elbow)) / (d * d); return Math.min(t - .15, .88 - t, Math.abs(p.x) - J.shoulder.x) }, .08 * W, 'leather');
  } else {
    const bottom = isRoyal ? .89 : isDress ? .72 : isClown ? .48 : .46;
    surface('Tunica', .005, bottom, { flare: isDress ? .25 : isRoyal ? .11 : isClown ? .045 : 0, stripes: isClown, wave: isDress || isRoyal ? .012 * W : 0 });
    edge('Gola', .005, { pad: .15 * W }); edge('Barra', bottom, { flare: isDress ? .25 : isRoyal ? .11 : isClown ? .045 : 0 });
    {
      shell('Mangas', p => Math.min(Math.abs(p.x) - J.shoulder.x * .78, p.y - (isDress || style === 'cowboy' ? Y(.17) : J.wrist.y + .1 * L), Y(0) - p.y), .08 * W, 'fabric');
    }
    if (style === 'inventor' || style === 'cowboy') {
      surface(style === 'inventor' ? 'Jaleco' : 'Colete', .035, style === 'inventor' ? .72 : .4, { pad: .23 * W, start: .28, end: Math.PI * 2 - .28, flare: style === 'inventor' ? .13 : 0, channel: style === 'inventor' ? 'fabric' : 'leather' });
      for (const s of [-1, 1]) {
        const lapel = [];
        for (let i = 0; i <= 16; i++) lapel.push(point(.04 + i / 16 * .19, s * (.3 + Math.sin(i / 16 * Math.PI) * .14), .26 * W));
        line('Lapela', lapel, .035 * W);
      }
    }
    if (isRoyal) {
      surface('Capa', .045, .94, { pad: .23 * W, start: Math.PI * .36, end: Math.PI * 1.64, flare: .19, channel: 'fabric' });
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
  if (!isClown) {
    surface('Cinto', .305, .333, { pad: .21 * W, channel: 'leather' });
    ball('Fivela', point(.32, 0, .28 * W), [.14 * W, .085 * W, .035 * W], 'trim');
  }
  return result;
}

// ---------- figurinos esculpidos (src/outfits.js) ----------
function buildSculpted(body, style, cols) {
  const group = new THREE.Group(); group.name = 'Figurino';
  const c = k => cols[k] || DEFAULTS[k];
  const ruby = style === 'mermaid_ruby';
  const std = (k, o = {}) => new THREE.MeshPhysicalMaterial({ name: 'Roupa_' + k, color: c(k), roughness: .78, sheen: .35, sheenRoughness: .6, sheenColor: new THREE.Color('#ffffff').multiplyScalar(.25), side: THREE.DoubleSide, ...o });
  const mats = {
    fabric: std('fabric'), secondary: std('secondary'), accent: std('accent'), pants: std('pants'),
    leather: std('leather', { roughness: .62, sheen: .1 }), trim: std('trim', { metalness: .9, roughness: .3, sheen: 0 }),
    gem: new THREE.MeshPhysicalMaterial({ name: 'Roupa_gem', color: c('accent'), roughness: .05, clearcoat: 1, specularIntensity: 1, ior: 2.2, flatShading: true }),
    pearl: new THREE.MeshPhysicalMaterial({ name: 'Roupa_perola', color: '#f6f0e6', roughness: .22, sheen: 1, sheenColor: new THREE.Color('#ffe6f2'), clearcoat: .8 }),
    glass: new THREE.MeshPhysicalMaterial({ name: 'Roupa_vidro', color: '#e9eef2', roughness: .05, transparent: true, opacity: .35, clearcoat: 1, depthWrite: false }),
    liquid: new THREE.MeshPhysicalMaterial({ name: 'Roupa_liquido', color: c('accent'), emissive: c('accent'), emissiveIntensity: .35, roughness: .2, transparent: true, opacity: .9 }),
    tail: twoTone('Roupa_cauda', c('fabric'), c('accent'), { scales: true, roughness: .32, clearcoat: .6, clearcoatRoughness: .25, sheen: .4, sheenColor: new THREE.Color('#ffffff') }),
    fin: twoTone('Roupa_nadadeira', c('fabric'), c('accent'), { side: THREE.DoubleSide, transparent: true, opacity: .9, roughness: .3, clearcoat: .5, dark: true }),
    stripesV: stripeMaterial('Roupa_listras', [c('secondary'), c('fabric'), c('accent')], 'x', .3 * (body.joints.W || 1)),
    stripesH: stripeMaterial('Roupa_meias', [c('fabric'), c('secondary')], 'y', .07),
    veil: twoTone('Roupa_veu', ruby ? c('accent') : c('secondary'), ruby ? '#3a0508' : c('trim'), { side: THREE.DoubleSide, transparent: true, opacity: .45, roughness: .4, depthWrite: false })
  };
  const geos = {};
  const add = (name, geo, ch) => { const m = new THREE.Mesh(geo, mats[ch] || mats.fabric); m.name = 'Roupa_' + name; m.castShadow = !(mats[ch] && mats[ch].transparent); m.receiveShadow = true; if (ch === 'veil' || ch === 'glass') m.renderOrder = 3; group.add(m); return m };
  const addGeo = (ch, g) => { (geos[ch] || (geos[ch] = [])).push(g) };
  buildSdfOutfit(body, style, cols, mats, add, addGeo);
  for (const [ch, list] of Object.entries(geos)) {
    const norm = list.map(g => { if (g.attributes.uv) g.deleteAttribute('uv'); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g.toNonIndexed() : g });
    const merged = mergeGeometries(norm, false); norm.forEach(g => g.dispose()); list.forEach(g => g.dispose());
    if (merged) add('Detalhes_' + ch, merged, ch);
  }
  return {
    group,
    setColors(cc) {
      const k = x => cc[x] || DEFAULTS[x];
      for (const ch of ['fabric', 'secondary', 'accent', 'pants', 'leather', 'trim']) mats[ch].color.set(k(ch));
      mats.gem.color.set(k('accent')); mats.liquid.color.set(k('accent')); mats.liquid.emissive.set(k('accent'));
      mats.tail.color.set(k('fabric')); mats.tail.userData.colorB.set(k('accent')); mats.fin.color.set(k('fabric')); mats.fin.userData.colorB.set(k('accent'));
      mats.veil.color.set(ruby ? k('accent') : k('secondary'));
      mats.stripesV.userData.cols[0].set(k('secondary')); mats.stripesV.userData.cols[1].set(k('fabric')); mats.stripesV.userData.cols[2].set(k('accent')); mats.stripesH.userData.cols[0].set(k('fabric')); mats.stripesH.userData.cols[1].set(k('secondary'));
    },
    dispose() { group.traverse(o => { if (o.isMesh) o.geometry.dispose() }); Object.values(mats).forEach(m => m.dispose()) }
  };
}
