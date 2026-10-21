// Visual do personagem: pele, cabelo, barba e acessórios escolhidos por catálogo (clica e troca).
// O rosto (olhos, nariz, boca) nunca é esticado — só trocamos modelos prontos e cores.
import * as THREE from 'three';
import { buildHair, HAIR_STYLES, HAIR_COLORS } from './hair.js';
import { buildAccessories, ACCESSORIES, ACC_SLOTS, ACC_COLORS } from './accessories.js';
import { buildCompanionLook } from './companions.js';
import { PRESETS } from './presets.js';
import { defaultClothes } from './clothes.js';
export { HAIR_STYLES, HAIR_COLORS, ACCESSORIES, ACC_SLOTS, ACC_COLORS };

export const SKIN_TONES = {
  human: [['Porcelana', '#f2d3be'], ['Clara', '#e9bc9c'], ['Bege', '#dca582'], ['Dourada', '#cc9373'], ['Morena', '#b47a58'], ['Canela', '#946044'], ['Marrom', '#744631'], ['Escura', '#4f2f22']],
  fantasy: [['Orc', '#b25e47'], ['Verde', '#7f9e52'], ['Oliva', '#8a8a4a'], ['Azul', '#6f8cc0'], ['Lilás', '#9c84c2'], ['Cinza', '#9a9a9e'], ['Pálida', '#d6bfa9']],
  veg: [['Vermelho', '#bf1d12'], ['Laranja', '#e0661b'], ['Amarelo', '#e6b51e'], ['Verde', '#6c9b33'], ['Verde-escuro', '#3f6f2a'], ['Roxo', '#5a2a5e']]
};
export function skinPalette(P) {
  if (P.kind === 'robot') return [];
  if (P.family === 'Vegetais') return SKIN_TONES.veg;
  if (P.family === 'Criaturas') return [...SKIN_TONES.fantasy, ...SKIN_TONES.human];
  return [...SKIN_TONES.human, ...SKIN_TONES.fantasy];
}

const C = { metal: '#d4a640', gem: '#c0182a', gem2: '#2fa6c9', fabric: '#6b4228', flower: '#f6f1e6' };
// visual padrão de cada personagem (o jogador troca à vontade)
export const DEFAULT_LOOKS = {
  feminine_soft: { hair: 'long_wavy', hairColor: '#1f1410', acc: { head: 'tiara', ears: 'drop', forehead: 'tikka', hairpin: 'flowers' } },
  masculine_soft: { hair: 'short', hairColor: '#24170f', acc: {} },
  cute_round: { hair: 'bun', hairColor: '#4a2c1c', acc: { ears: 'studs' } },
  feminine_bold: { hair: 'long_curly', hairColor: '#1a110d', acc: { ears: 'drop', forehead: 'tikka', hairpin: 'coral' }, colors: { gem2: '#c0182a', flower: '#d63a22' } },
  old_king: { hair: 'royal', hairColor: '#efede8', beard: 'full', acc: { head: 'crown', ears: 'drop' }, colors: { gem: '#2453c4', gem2: '#2fa6c9' } },
  alchemist_villain: { hair: 'swept', hairColor: '#a9a49c', acc: { head: 'bubbles' }, colors: { metal: '#b5893f', gem: '#8e3fd0' } },
  dwarf_bard: { hair: 'long_braids', hairColor: '#7a4a28', acc: {} },
  sad_clown: { hair: 'clown', hairColor: '#c2401c', acc: { head: 'tophat' }, colors: { fabric: '#9e2420', metal: '#e0b545' } },
  orc_warrior: { hair: 'topknot', hairColor: '#1e140f', acc: {} },
  cactus_cowboy: { hair: 'none', hairColor: '#24170f', acc: { head: 'cowboy' }, colors: { fabric: '#6b4228', metal: '#b8a27a' } },
  pepper_king: { hair: 'none', hairColor: '#120c0c', acc: { head: 'crown' } },
  chili_bandit: { hair: 'none', hairColor: '#140a08', acc: {} },
  nana_explorer: { hair: 'lunar_curls', hairColor: '#20131c', acc: { face: 'visor', ears: 'hoops' }, colors: { gem2: '#5ab8ef' } },
  moon_guardian: { hair: 'long_wavy', hairColor: '#201419', acc: { head: 'moon_crown', ears: 'drop' }, colors: { gem: '#416ec4', gem2: '#416ec4' } },
  nico_inventor: { hair: 'short_curls', hairColor: '#59311e', beard: 'none', acc: { face: 'glasses', head: 'goggles' } },
  ruby_sorceress: { hair: 'long_braids', hairColor: '#20131a', acc: { head: 'moon_crown', ears: 'drop', forehead: 'tikka' }, colors: { gem: '#c0182a', gem2: '#c0182a' } },
  paysandu_wolf: { hair: 'none', acc: { head: 'wolf_kit' }, colors: { fabric: '#253f74', gem: '#4788d9' } },
  ruby_raven: { hair: 'none', acc: { head: 'raven_kit' }, colors: { fabric: '#932d3d', gem: '#c0182a' } },
  robot_ball: { hair: 'none', hairColor: '#333', acc: {} }
};
export function defaultLook(presetId) {
  const P = PRESETS[presetId], d = DEFAULT_LOOKS[presetId] || { hair: 'none', acc: {} };
  return { ...defaultClothes(presetId), build: { weight: 0, muscle: 0 }, skin: P.skin || null, hair: d.hair, hairColor: d.hairColor || '#2a1a12', beard: d.beard || 'default', acc: { ...d.acc }, colors: { ...C, ...(d.colors || {}) } };
}
// barba acompanha o cabelo quando o personagem tem cabelo e barba de fios (anão, orc, rei…)
export const headOpts = (look, P) => ({ skin: look.skin, beard: look.beard, hairColor: look.hairColor, beardFollowsHair: look.hair !== 'none' && P.family !== 'Vegetais' });

// Monta cabelo + acessórios no espaço da cabeça e prende no osso da cabeça (vão juntos no GLB)
export function buildLook(fit, look, bodySdf = null) {
  if(fit?.companion)return buildCompanionLook(fit,look);
  const group = new THREE.Group(); group.name = 'Look';
  if (fit && bodySdf) { const hs = fit.sdf; fit = { ...fit, sdf: (x, y, z) => y < -1.25 ? Math.min(hs(x, y, z), bodySdf(x, y, z)) : hs(x, y, z) } } // cabelo cai sobre ombros e costas
  if (!fit) return { group, dispose() { }, setColors() { }, setHairColor() { } };
  const hair = buildHair(fit, look.hair, look.hairColor);
  if (hair) group.add(hair.group);
  let acc = buildAccessories(fit, look.acc || {}, look.colors || C, hair ? hair.meshes : []);
  group.add(acc.group);
  return {
    group, hair, get acc() { return acc },
    rebuildAcc(lk) { group.remove(acc.group); acc.dispose(); acc = buildAccessories(fit, lk.acc || {}, lk.colors || C, hair ? hair.meshes : []); group.add(acc.group); acc.group.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.transparent; o.receiveShadow = true } }) },
    setHairColor(c) { if (hair) hair.setColor(c) },
    setColors(cols) { acc.setColors(cols) },
    dispose() { if (hair) hair.dispose(); acc.dispose() }
  };
}
// prende o visual no osso da cabeça mantendo a posição (a cabeça já está montada em pose neutra)
export function attachLook(head, L) {
  if(head.fit?.companion){head.group.add(L.group);return}
  if (!head.fit || !head.fit.headBone) { head.group.add(L.group); return }
  head.group.updateMatrixWorld(true); L.group.applyMatrix4(head.group.matrixWorld); L.group.updateMatrixWorld(true); // visual está no espaço da cabeça (que pode estar reduzida)
  head.fit.headBone.attach(L.group);
}
