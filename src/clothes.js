// Figurinos procedurais no espaço do corpo. Nenhuma alteração na pele ou no rig facial.
import * as THREE from 'three';
import {finishMaterial} from './detail.js';
import {heroSurface} from './hero-material.js';
import {FRONTIER_OUTFITS} from './frontier.js';
import {FOREST_OUTFITS} from './forest.js';
import { buildLegacyClothes } from './legacy-clothes.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSdfOutfit, SDF_OUTFITS, SDF_DEFAULT_COLORS, SDF_DEFAULT_OUTFIT } from './outfits.js?v=altura-roupas-1';

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
  const colors = { chili_bandit: { fabric: '#34507e', pants: '#e8dcbf', secondary: '#1f1d22' }, pepper_king: { fabric: '#7a2436', accent: '#3e2a6e' } }[id] || {};
  if (SDF_DEFAULT_OUTFIT[id]) return { outfit: SDF_DEFAULT_OUTFIT[id], clothColors: outfitColors(SDF_DEFAULT_OUTFIT[id]) };
  return { outfit: styles[id] || 'none', clothColors: { ...outfitColors(styles[id]), ...colors } };
}

// Slots independentes. Um conjunto é apenas um atalho que preenche estes slots.
export const CLOTH_SLOTS = { upper: 'Parte de cima', lower: 'Parte de baixo', feet: 'Calçado', cape: 'Capa / manto', belt: 'Cinto', extras: 'Extras' };
const SLOT_STYLES = {
  upper: ['circus', 'orc', 'adventurer', 'desert', 'mermaid_pearl', 'mermaid_ruby', 'casual', 'dress', 'warrior', 'cowboy', 'royal', 'inventor'],
  lower: ['circus', 'orc', 'adventurer', 'desert', 'mermaid_pearl', 'mermaid_ruby', 'casual', 'dress', 'warrior', 'cowboy', 'royal', 'inventor'],
  feet: ['circus', 'orc', 'adventurer', 'desert', 'casual', 'dress', 'warrior', 'cowboy', 'royal', 'inventor'],
  cape: ['adventurer', 'desert', 'mermaid_pearl', 'mermaid_ruby', 'royal'],
  belt: ['orc', 'adventurer', 'desert', 'mermaid_pearl', 'mermaid_ruby', 'casual', 'dress', 'warrior', 'cowboy', 'royal', 'inventor'],
  extras: ['circus', 'orc', 'adventurer', 'desert', 'mermaid_pearl', 'mermaid_ruby', 'cowboy']
};
// Os conjuntos lunares usam os mesmos slots; combinações continuam clica-e-troca.
for(const slot of Object.keys(SLOT_STYLES))SLOT_STYLES[slot].push(...(slot==='cape'?['lunar_guardian','lunar_ruby']:['lunar_explorer','lunar_guardian','lunar_inventor','lunar_ruby']));
for(const slot of Object.keys(SLOT_STYLES))SLOT_STYLES[slot].push(...Object.keys(FOREST_OUTFITS));
for(const slot of Object.keys(SLOT_STYLES))SLOT_STYLES[slot].push(...Object.keys(FRONTIER_OUTFITS),'flame_guardian');
const PIECE_LABELS = {
  bread_baker:{upper:'Camisa de padeiro',lower:'Calça de padeiro',feet:'Botas do padeiro',cape:'Avental',belt:'Faixa laranja',extras:'Pão e utensílios'},
  bread_vigilante:{upper:'Túnica do vigilante',lower:'Calça do vigilante',feet:'Botas do vigilante',cape:'Manto escuro',belt:'Cinturão do vigilante',extras:'Cristal de âmbar'},
  cactus_guard:{upper:'Túnica e armadura',lower:'Calça do soldado',feet:'Botas e grevas',cape:'Capa vermelha',belt:'Cinturão dourado',extras:'Escudo e lança'},
  frontier_cowboy:{upper:'Camisa e colete',lower:'Calça de viagem',feet:'Botas do deserto',cape:'Poncho',belt:'Cinturão de viagem',extras:'Lenço e bolsas'},
  forest_archer:{upper:'Túnica de arqueiro',lower:'Calça da floresta',feet:'Botas de arqueiro',cape:'Manto da floresta',belt:'Cinto de viagem',extras:'Arco e aljava'},
  forest_guard:{upper:'Túnica e ombreiras',lower:'Calça do guarda',feet:'Botas e grevas',cape:'Capa do guarda',belt:'Cinturão do guarda',extras:'Escudo e lança'},
  forest_artificer:{upper:'Casaca do artífice',lower:'Calça do artífice',feet:'Botas mecânicas',cape:'Manto do artífice',belt:'Cinto de ferramentas',extras:'Mochila e frascos'},
  forest_princess:{upper:'Corpete da floresta',lower:'Saia da princesa',feet:'Sapatos da princesa',cape:'Manto da princesa',belt:'Cinto de folhas',extras:'Joias da floresta'},
  lunar_explorer:{upper:'Jaqueta lunar',lower:'Calça cargo',feet:'Tênis de exploração',belt:'Cinto lunar',extras:'Mochila lunar'},
  lunar_guardian:{upper:'Corpete lunar',lower:'Saia da guardiã',feet:'Sapatos lunares',cape:'Manto azul',belt:'Cinto crescente',extras:'Cajado lunar'},
  lunar_inventor:{upper:'Camisa e jardineira',lower:'Calça da jardineira',feet:'Tênis do inventor',belt:'Cinto de ferramentas',extras:'Mochila e projeto'},
  lunar_ruby:{upper:'Corpete rubi',lower:'Saia da feiticeira',feet:'Sapatos rubi',cape:'Manto rubi',belt:'Cinto crescente',extras:'Cajado rubi'},
  circus: { upper: 'Casaca de circo', lower: 'Bombacha listrada', feet: 'Sapatões e meias', extras: 'Gola, punhos e luvas' },
  orc: { upper: 'Ombreira de espinhos', lower: 'Saiote de tiras', feet: 'Polainas do guerreiro', belt: 'Cinto de caveira', extras: 'Braçadeiras de metal' },
  adventurer: { upper: 'Camisa e gibão', lower: 'Calça aventureira', feet: 'Botas de viagem', cape: 'Capa aventureira', belt: 'Bússola e bolsas', extras: 'Gola e braçadeiras' },
  desert: { upper: 'Túnica e tabardos', lower: 'Bombacha do deserto', feet: 'Botas trançadas', cape: 'Manto do deserto', belt: 'Faixa e medalhão', extras: 'Lenço e luva' },
  mermaid_pearl: { upper: 'Top pérola', lower: 'Cauda pérola', cape: 'Véus pérola', belt: 'Joias de pérola', extras: 'Colar e braceletes pérola' },
  mermaid_ruby: { upper: 'Top rubi', lower: 'Cauda rubi', cape: 'Véus rubi', belt: 'Joias e frascos rubi', extras: 'Colar e braceletes rubi' },
  casual: { upper: 'Túnica com cinto', lower: 'Calça reta', feet: 'Botas de cano curto', belt: 'Cinto de fivela' },
  dress: { upper: 'Corpete bufante', lower: 'Saia rodada', feet: 'Sapatilhas', belt: 'Faixa' },
  royal: { upper: 'Manto real e arminho', lower: 'Saia do manto', feet: 'Sapatos reais', cape: 'Capa real', belt: 'Cinto real' },
  inventor: { upper: 'Jaleco e colete', lower: 'Calça social', feet: 'Sapatos', belt: 'Cinto fino' },
  cowboy: { upper: 'Camisa e colete', lower: 'Calça de montaria', feet: 'Botas de caubói', belt: 'Cinturão', extras: 'Lenço' }
};
const STYLE_ALIAS = { clown: 'circus' };
const styleOf = id => STYLE_ALIAS[id] || id;
export function pieceOptions(body, slot) {
  if(!body)return [{id:'none',label:'Nenhum'}];
  const mermaid = !!body?.joints.mermaid;
  return [{ id: 'none', label: 'Nenhum' }, ...(SLOT_STYLES[slot] || []).filter(style => {
    if (slot === 'feet') return !mermaid;
    if (slot === 'lower') return mermaid ? ['mermaid_pearl', 'mermaid_ruby', 'dress', 'royal'].includes(style) : !SDF_OUTFITS[style]?.mermaid;
    return true;
  }).map(style => ({ id: style + ':' + slot, label: PIECE_LABELS[style]?.[slot] || OUTFITS[style].label }))];
}
export function pieceSelection(look, body) {
  const selection = {}, style = styleOf(look.outfit);
  for (const slot of Object.keys(CLOTH_SLOTS)) {
    const wanted = look.pieces?.[slot] ?? ((SLOT_STYLES[slot] || []).includes(style) ? style + ':' + slot : 'none');
    selection[slot] = pieceOptions(body, slot).some(p => p.id === wanted) ? wanted : 'none';
  }
  return selection;
}

// Cache limitado e com referências: as instâncias compartilham somente geometria imutável.
// A identidade de body.sdf inclui peso, músculo, escala e cauda; nunca reaproveita peças de outro tipo físico.
const templates = new Map(), bodyKeys = new WeakMap(); let nextBodyKey = 0;
function template(body, style, slot) {
  if (!bodyKeys.has(body.sdf)) bodyKeys.set(body.sdf, ++nextBodyKey);
  // Gera um conjunto uma única vez: os slots compartilham medidas e campos de camada.
  const key = bodyKeys.get(body.sdf) + ':' + style + ':' + (SDF_OUTFITS[style] ? '*' : slot);
  if (templates.has(key)) { const item = templates.get(key); templates.delete(key); templates.set(key, item); return item }
  const descriptors = [], details = new Map(), coverage=[], bodyMasks=[];
  const add = (name, geo, channel) => descriptors.push({ name, geo, channel, slot: geo.userData.slot || 'extras' });
  if(!SDF_OUTFITS[style]){
    const legacy=buildLegacyClothes(body,{outfit:style},slot);legacy.group.updateMatrixWorld(true);
    legacy.group.traverse(m=>{if(!m.isMesh)return;const name=m.name.slice(6),part=/Calca|Saiote|Saia/.test(name)||name==='Barra'&&['dress','royal'].includes(style)?'lower':/Bota/.test(name)?'feet':/Cinto|Fivela$/.test(name)?'belt':/Capa/.test(name)?'cape':/Bracadeira/.test(name)?'extras':'upper';
      if(part!==slot)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);geo.clearGroups();geo.userData.slot=part;add(name,geo,Array.isArray(m.material)?'fabric':m.material.name.slice(6));});
    legacy.dispose();
  }else buildSdfOutfit(body, style, {}, {}, add, (ch, geo) => {
    const key = (geo.userData.slot || 'extras') + ':' + ch;
    if (!details.has(key)) details.set(key, []); details.get(key).push(geo);
  }, null, coverage, bodyMasks);
  for (const [key, geos] of details) {
    const hero=!!FOREST_OUTFITS[style]||!!FRONTIER_OUTFITS[style]||style.startsWith('lunar_')||style==='flame_guardian';
    const [slot, channel] = key.split(':'), normalized = geos.map(g => {
      const c=g.clone();for(const k of Object.keys(c.attributes))if(!['position','normal'].includes(k))c.deleteAttribute(k);
      if(!hero)return c.index?c.toNonIndexed():c;
      // Mantém os mesmos triângulos e normais sem triplicar os vértices de cada acabamento.
      if(!c.index){const n=c.attributes.position.count,ix=n>65535?new Uint32Array(n):new Uint16Array(n);for(let i=0;i<n;i++)ix[i]=i;c.setIndex(new THREE.BufferAttribute(ix,1))}
      return c;
    });
    const merged = mergeGeometries(normalized, false); normalized.forEach(g => g.dispose()); geos.forEach(g => g.dispose());
    if (merged) descriptors.push({ name: 'Detalhes_' + slot + '_' + channel, geo: merged, channel, slot });
  }
  for (const d of descriptors) {
    const g = d.geo, colors = new Float32Array(g.attributes.position.count * 3), shade = g.attributes.shade;
    for (let i = 0; i < colors.length / 3; i++) {
      let tone=shade ? shade.getX(i) : 1;
      // Lavagem localizada do denim: variação ampla acompanha a peça e continua
      // multiplicando qualquer cor escolhida no editor, sem pintar manchas na pele.
      if(style==='lunar_inventor'&&['fabric','pants'].includes(d.channel)){
        const p=g.attributes.position,x=p.getX(i)/body.proportions.W,y=p.getY(i)/body.proportions.W,z=p.getZ(i)/body.proportions.W;
        const wash=.5+.5*Math.sin(x*5.3+Math.sin(y*3.1)) * Math.sin(y*4.7+z*2.3);
        tone*=.80+.20*wash;
      }
      colors.fill(tone,i*3,i*3+3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const item = { descriptors, coverage, bodyMasks, refs: 0 }; templates.set(key, item);
  // Um corpo precisa reter ao menos uma versão de cada conjunto do catálogo. Com mais de
  // 24 estilos, o limite antigo expulsava a peça recém-aquecida e voltava a malhá-la na troca.
  const templateLimit=Math.max(32,Object.keys(OUTFITS).length+4);
  for (const [k, old] of templates) if (templates.size > templateLimit && !old.refs && old !== item) { old.descriptors.forEach(d => d.geo.dispose()); templates.delete(k) }
  return item;
}

function pieceMaterial(channel, colors) {
  const colorKey = ({sole:'leather',enamel:'fabric',lining:'accent'})[channel] || (['gem', 'liquid'].includes(channel) ? 'accent' : ['tail', 'fin'].includes(channel) ? 'fabric' : channel === 'veil' ? 'secondary' : channel);
  const metal = channel === 'trim', leather = channel === 'leather', pearl = channel === 'pearl';
  const m = new THREE.MeshPhysicalMaterial({ name: 'Roupa_' + channel, color: pearl ? '#f6eee5' : colors[colorKey] || '#ffffff', vertexColors: true, roughness: metal ? .36 : leather ? .62 : .72, metalness: metal ? .85 : 0, sheen: metal ? 0 : leather ? .1 : .3, sheenRoughness: .55, sheenColor: new THREE.Color('#eee7e2'), clearcoat: pearl ? .2 : 0, side: THREE.DoubleSide, shadowSide: THREE.FrontSide });
  if (['gem', 'pearl', 'tail', 'fin'].includes(channel)) { m.roughness = channel === 'gem' ? .13 : .32; m.clearcoat = .5 }
  if (['veil', 'glass', 'liquid'].includes(channel)) { m.side=THREE.DoubleSide; m.transparent = true; m.opacity = channel === 'glass' ? .3 : channel === 'liquid' ? .85 : .48; m.depthWrite = false }
  if(channel==='enamel'){m.metalness=.55;m.roughness=.38;m.clearcoat=.3}
  m.userData.colorFactor=channel==='sole'?.48:channel==='lining'?.78:1;
  m.userData.colorKey = colorKey; return m;
}
const patterned = new Set(['stripesV', 'stripesH', 'tail', 'fin', 'veil']);
function paint(mesh, channel, colors, W) {
  const mat = mesh.material;
  if (!patterned.has(channel)) { if (channel !== 'pearl') mat.color.set(colors[mat.userData.colorKey] || '#ffffff').multiplyScalar(mat.userData.colorFactor||1); return }
  mat.color.set('#ffffff');
  const g = mesh.geometry, p = g.attributes.position, col = g.attributes.color, mix = g.attributes.mixc, shade = g.attributes.shade;
  if(channel.startsWith('stripes')){
    const vertical=channel==='stripesV',n=vertical?3:2,palette=[colors.secondary,colors.fabric,colors.accent],width=n*128;
    if(!mat.map){const tex=new THREE.DataTexture(new Uint8Array(width*4),width,1,THREE.RGBAFormat);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=THREE.RepeatWrapping;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;mat.map=tex;mat.needsUpdate=true;
      const uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(vertical?p.getX(i)/(.3*W*n):p.getY(i)/(.07*n))+.5/n;uv[i*2+1]=.5}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    }
    const data=mat.map.image.data,c=new THREE.Color();for(let i=0;i<width;i++){c.set(palette[Math.floor(i/128)]).convertLinearToSRGB();data[i*4]=Math.round(c.r*255);data[i*4+1]=Math.round(c.g*255);data[i*4+2]=Math.round(c.b*255);data[i*4+3]=255}mat.map.needsUpdate=true;
    for(let i=0;i<p.count;i++){const s=shade?shade.getX(i):1;col.setXYZ(i,s,s,s)}col.needsUpdate=true;return;
  }
  if(channel==='tail'&&!mat.map){
    // Escamas procedurais incorporadas no GLB; as cores continuam nos vértices.
    const size=256,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const row=Math.floor(y/128),u=((x/size+row*.5)%1)-.5,v=(y%128)/128-.15,d=Math.hypot(u,v*.9);
      const edge=THREE.MathUtils.smoothstep(d,.42,.52),hi=1-THREE.MathUtils.smoothstep(d,0,.38),tone=THREE.MathUtils.lerp(1+.18*hi,.55,edge),k=(y*size+x)*4;
      const value=Math.round(THREE.MathUtils.clamp(tone/1.18,0,1)*255);data.set([value,value,value,255],k);
    }
    const tex=new THREE.DataTexture(data,size,size);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;mat.map=tex;mat.needsUpdate=true;
    const uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=Math.atan2(p.getX(i),p.getZ(i)+.15)*.62/.085;uv[i*2+1]=p.getY(i)/(.068*2)}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  const a = new THREE.Color(colors[channel === 'veil' ? (['mermaid_ruby','lunar_ruby','lunar_guardian'].includes(mesh.userData.style)?'accent':'secondary') : 'fabric']), b = new THREE.Color(colors.accent), c = new THREE.Color();
  const stripes = [new THREE.Color(colors.secondary), a, b];
  for (let i = 0; i < p.count; i++) {
    if (channel.startsWith('stripes')) { const h = channel === 'stripesV', k = Math.floor((h ? p.getX(i) / (.3 * W) : p.getY(i) / .07) + 30.5); c.copy(stripes[((k % (h ? 3 : 2)) + (h ? 3 : 2)) % (h ? 3 : 2)]) }
    else c.copy(a).lerp(b, mix ? mix.getX(i) : .3);
    c.multiplyScalar(shade ? shade.getX(i) : 1); col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}

export function buildClothes(body, look) {
  const start = performance.now(), group = new THREE.Group(); group.name = 'Figurino';
  const instances = new Map(), selection = pieceSelection(look, body);
  function remove(slot) {
    const item = instances.get(slot); if (!item) return;
    item.group.removeFromParent(); item.group.traverse(m => { if (m.isMesh) { m.material.map?.dispose(); m.material.dispose(); if (m.userData.ownGeometry) m.geometry.dispose() } });
    item.template.refs--; instances.delete(slot);
  }
  // O cinto usa o mesmo contorno medido da roupa; não é esticado como um aro.
  function setPiece(slot, id, colors = null) {
    if (!body || !pieceOptions(body, slot).some(p => p.id === id)) return false;
    remove(slot); selection[slot] = id; if (id === 'none') {return true;}
    const style = id.split(':')[0], source = template(body, style, slot), part = new THREE.Group(); part.name = 'RoupaSlot_' + slot; source.refs++;
    const cc = { ...outfitColors(style), ...(style === styleOf(look.outfit) ? look.clothColors || {} : {}), ...(colors || look.pieceColors?.[slot] || {}) };
    for (const d of source.descriptors.filter(d => d.slot === slot)) {
      const own = patterned.has(d.channel), geo = own ? d.geo.clone() : d.geo, mat = pieceMaterial(d.channel, cc), mesh = new THREE.Mesh(geo, mat);
      if((FOREST_OUTFITS[style]||FRONTIER_OUTFITS[style]||style.startsWith('lunar_'))&&['fabric','secondary','pants','accent','leather','trim','sole','lining'].includes(d.channel))finishMaterial(mat,['trim'].includes(d.channel)?'metal':['leather','sole'].includes(d.channel)?'leather':'fabric');
      heroSurface(geo,mat,style==='lunar_explorer'&&['pearl','sole'].includes(d.channel)?'polymer':style==='lunar_inventor'&&['fabric','pants'].includes(d.channel)?'denim':d.channel,body.proportions.W,{detail:['fabric','secondary','pants','leather','lining','accent'].includes(d.channel)});
      if(style==='lunar_explorer'&&['pearl','sole'].includes(d.channel)){mat.roughness=.86;mat.clearcoat=0;mat.sheen=0;mat.metalness=0}
      if(!SDF_OUTFITS[style]){mat.roughness=d.channel==='trim'?.38:d.channel==='leather'?.78:.88;mat.sheen=.15;mat.clearcoat=0}
      mesh.name = 'Roupa_' + d.name; mesh.castShadow = !mat.transparent; mesh.receiveShadow = true; mesh.userData = { ownGeometry: own, channel: d.channel, slot, style, ...(geo.userData.skinningMode?{skinningMode:geo.userData.skinningMode}:{}) }; paint(mesh, d.channel, cc, body.proportions.W); part.add(mesh);
    }
    group.add(part); instances.set(slot, { group: part, template: source, colors: cc }); return true;
  }
  for (const [slot, id] of Object.entries(selection)) setPiece(slot, id);
  return {
    group, selection, timing: Math.round(performance.now() - start),
    get hasCoverageDesign(){return [...instances.values()].some(p=>p.template.coverage?.length)},
    coveredByDesign(x,y,z){return [...instances].some(([slot,p])=>p.template.coverage?.some(r=>r.slot===slot&&r.contains(x,y,z)))},
    bodyCovered(x,y,z){return [...instances].some(([slot,p])=>p.template.bodyMasks?.some(r=>r.slot===slot&&r.contains(x,y,z)))},
    setPiece,
    setPieceColors(slot, colors) { const part = instances.get(slot); if (!part) return; Object.assign(part.colors, colors); part.group.traverse(m => { if (m.isMesh) paint(m, m.userData.channel, part.colors, body.proportions.W) }) },
    setColors(colors) { for (const slot of instances.keys()) this.setPieceColors(slot, colors) },
    dispose() { for (const slot of [...instances.keys()]) remove(slot) }
  };
}
