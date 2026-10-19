// Rig facial híbrido da Head V2 (padrão de personagem cartoon):
//  • Ossos para o que gira: Bone_Jaw (mandíbula), Bone_Eye_L/R (olhar), Bone_LidUp/LidLo_L/R (pálpebras em volta do globo).
//  • Blendshapes esculpidos para o que muda de forma (gerados em head.js reconstruindo o rosto):
//      smile_L/R, frown_L/R, mouthWide, mouthPucker, mouthPress, browUp_L/R, browInnerUp, browDown.
// Exporta no GLB como skin + morph targets padrão glTF (Unity, Unreal, Godot, three.js), com clipes de animação.
import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const gau = (d, r) => Math.exp(-(d * d) / (r * r));

export const BONE_NAMES = ['Bone_Head', 'Bone_Jaw', 'Bone_Eye_L', 'Bone_Eye_R', 'Bone_LidUp_L', 'Bone_LidLo_L', 'Bone_LidUp_R', 'Bone_LidLo_R'];
export const MORPH_NAMES = ['smile_L', 'smile_R', 'frown_L', 'frown_R', 'mouthWide', 'mouthPucker', 'mouthPress', 'browUp_L', 'browUp_R', 'browInnerUp', 'browDown'];
const B = Object.fromEntries(BONE_NAMES.map((n, i) => [n.replace('Bone_', ''), i]));

export const NEUTRAL = { lookX: 0, lookY: 0, blinkL: 0, blinkR: 0, wide: 0, squint: 0, jaw: 0, smile: 0, smileL: 0, smileR: 0, mouthWide: 0, pucker: 0, press: 0,
  browRaise: 0, browAngry: 0, browUpL: 0, browUpR: 0 };
// pose → pesos dos blendshapes
export function morphWeights(p) {
  const sL = p.smile + p.smileL, sR = p.smile + p.smileR, c = v => clamp(v, 0, 1.2);
  return { smile_L: c(sL), smile_R: c(sR), frown_L: c(-sL), frown_R: c(-sR), mouthWide: c(p.mouthWide), mouthPucker: c(p.pucker), mouthPress: c(p.press),
    browUp_L: c(p.browRaise + p.browUpL), browUp_R: c(p.browRaise + p.browUpR), browInnerUp: c(-p.browAngry), browDown: c(p.browAngry + Math.max(-p.browRaise, 0) * .5) };
}

// Expressões prontas (somadas por cima da pose neutra)
export const EXPRESSIONS = {
  neutro: {},
  feliz: { smile: 1, squint: .45, browRaise: .3, mouthWide: .2 },
  risada: { smile: 1, squint: .7, browRaise: .4, jaw: .55, mouthWide: .3 },
  triste: { smile: -1, browAngry: -1, lookY: -.3, squint: .1, press: .35 },
  bravo: { browAngry: 1, smile: -.55, squint: .6, press: .45, lookY: -.05 },
  surpreso: { browRaise: 1, wide: 1, jaw: .85, pucker: .35 },
  piscadela: { blinkR: 1, smileR: 1, smile: .25, browUpL: .5, squint: .25 },
  desconfiado: { browAngry: .45, browUpL: .7, squint: .65, lookX: .55, smileR: .65, press: .3 },
  beijo: { pucker: 1, blinkL: .85, blinkR: .85, browRaise: .35 }
};

// fala: sequência de formas de boca (visemas) com transição suave → A, E, O, U, M/B/P, pausa
const VISEMES = { A: { jaw: .55, mouthWide: .15 }, E: { jaw: .25, mouthWide: .7, smile: .15 }, O: { jaw: .45, pucker: .65 }, U: { jaw: .15, pucker: 1 }, M: { press: .9 }, _: {} };
const TALK_SEQ = 'MAOEAU_EAMOA_EOMA';
export function talkPose(t, rate = 7.5) {
  const f = t * rate, i = Math.floor(f), k = f - i, e = k * k * (3 - 2 * k), a = VISEMES[TALK_SEQ[i % TALK_SEQ.length]], b = VISEMES[TALK_SEQ[(i + 1) % TALK_SEQ.length]];
  const out = { browRaise: .14 * Math.max(0, Math.sin(t * 2.6)) };
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) out[key] = (out[key] || 0) + (a[key] || 0) * (1 - e) + (b[key] || 0) * e;
  return out;
}

export function createRig(P, ctx) {
  const { eyes, MC, surfZ, frontRadius } = ctx;
  const bones = BONE_NAMES.map(n => { const b = new THREE.Bone(); b.name = n; return b });
  const head = bones[B.Head], headPos = new THREE.Vector3(0, -.6, -.1);
  head.position.copy(headPos);
  const place = (i, x, y, z, quat) => { const b = bones[i]; b.position.set(x, y, z).sub(headPos); if (quat) b.quaternion.copy(quat); head.add(b); b.userData.rest = { p: b.position.clone(), q: b.quaternion.clone() } };
  head.userData.rest = { p: head.position.clone(), q: head.quaternion.clone() };

  const ymC = MC.ym(MC.mw), chinY = P.jawChinY ?? (P.loft?.y?.[0] ?? -1) + .02;
  const yTMJ = (P.eyeY + P.noseTipY) / 2 - .12, zTMJ = P.lathe ? P.lathe.cz : -.14;
  place(B.Jaw, 0, yTMJ, zTMJ);
  const jawDist = Math.hypot(ymC - yTMJ, surfZ(0, MC.ym(0)) - zTMJ), jawK = .17 / Math.max(jawDist, .3); // mesma abertura em qualquer personagem
  const eyeInfo = {};
  for (const e of eyes) {
    const side = e.s < 0 ? 'L' : 'R', q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), e.s * P.tilt);
    place(B['Eye_' + side], e.ex, e.ey, e.zc);
    place(B['LidUp_' + side], e.ex, e.ey, e.zc, q);
    place(B['LidLo_' + side], e.ex, e.ey, e.zc, q);
    // ângulos de fechamento: a borda superior desce até encontrar a inferior (que sobe um pouco)
    eyeInfo[side] = { e, closeU: Math.atan2(e.hu + e.hl * .35, e.Rl), closeL: Math.atan2(e.hl * .55, e.Rl), hu: e.hu, hl: e.hl };
  }

  // ---------- pesos ----------
  const cornerFn = (u, peak) => { if (Math.abs(u) >= 1) return 0; const w = u < peak ? (u - peak) / (peak + 1) : (u - peak) / (1 - peak); return Math.pow(Math.cos(clamp(w, -1, 1) * Math.PI / 2), .8) };
  // modo: 'skin' (pele, com sobreposições), 'lidU' / 'lidL' (cílios e bordas), 'brow' (sobrancelha), 'generic' (bigode etc.)
  function weights(x, y, z, o = {}) {
    const W = new Array(BONE_NAMES.length).fill(0), ax = Math.abs(x), s = x < 0 ? -1 : 1, side = s < 0 ? 'L' : 'R';
    const front = sstep(-.45, -.15, z);
    if (o.mode === 'lidU' || o.mode === 'lidL') {
      const { e } = eyeInfo[side], [U] = e.local(x, y), uN = U / e.halfW;
      const w = Math.pow(cornerFn(clamp(uN, -.999, .999), o.mode === 'lidU' ? P.peakU : P.peakL), .6);
      W[B[(o.mode === 'lidU' ? 'LidUp_' : 'LidLo_') + side]] = w;
      return pack(W);
    }
    // mandíbula: abaixo da linha da boca; fora da boca a divisa sobe em direção à articulação (perto da orelha)
    if (o.jaw !== undefined) W[B.Jaw] = o.jaw;
    else {
      const yB = ax < MC.mw ? MC.ym(x) : ymC + (yTMJ - ymC) * sstep(MC.mw, .8, ax), bw = .006 + .13 * sstep(MC.mw * .85, MC.mw * 1.9, ax); // transição larga nas bochechas
      W[B.Jaw] = sstep(yB + bw, yB - bw, y) * sstep(-.5, -.2, z) * sstep(chinY - .45, chinY - .1, y);
    }
    // cantos abrem menos que o centro → abertura em forma de lente (só perto da linha da boca; o queixo vai inteiro)
    if (W[B.Jaw] > 0) W[B.Jaw] *= 1 - .7 * sstep(.45, 1.02, ax / MC.mw) * gau(y - MC.ym(x), .07) * (ax < MC.mw * 1.4 ? 1 : 0);
    // pálpebras
    const ei = eyeInfo[side];
    if (ei) {
      const { e } = ei, [U, V] = e.local(x, y), uN = U / e.halfW;
      if (Math.abs(uN) < 1.2 && V > -(e.hl + .14) && V < e.hu + (P.creaseGap || .05) + .12) {
        const uc = clamp(uN, -.999, .999), Hu = e.H(uc, true), Hl = e.H(uc, false);
        if (o.interior) { if (V > 0) W[B['LidUp_' + side]] = Math.pow(cornerFn(uc, P.peakU), .6); else W[B['LidLo_' + side]] = Math.pow(cornerFn(uc, P.peakL), .6) }
        else if (V >= 0) W[B['LidUp_' + side]] = Math.pow(cornerFn(uc, P.peakU), .6) * sstep(Hu + (P.creaseGap || .05) + .07, Hu + .008, V) * front;
        else W[B['LidLo_' + side]] = Math.pow(cornerFn(uc, P.peakL), .6) * sstep(-(Hl + .1), -(Hl + .006), V) * front;
      }
    }
    return pack(W);
  }
  function pack(W) { // 4 influências: maiores pesos + cabeça com o resto
    const list = W.map((w, i) => [i, w]).filter(a => a[1] > .002 && a[0] !== B.Head).sort((a, b) => b[1] - a[1]).slice(0, 3);
    let sum = list.reduce((s, a) => s + a[1], 0);
    if (sum > 1) { list.forEach(a => a[1] /= sum); sum = 1 }
    list.push([B.Head, 1 - sum]);
    while (list.length < 4) list.push([0, 0]);
    return list;
  }
  function skinAttributes(geo, fn) {
    const p = geo.attributes.position, n = p.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const L = fn(p.getX(i), p.getY(i), p.getZ(i), i); for (let k = 0; k < 4; k++) { si[i * 4 + k] = L[k][0]; sw[i * 4 + k] = L[k][1] } }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }

  // ---------- poses ----------
  const tmpQ = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  function apply(pose) {
    const p = { ...NEUTRAL, ...pose };
    for (const b of bones) if (b.userData.rest) { b.position.copy(b.userData.rest.p); b.quaternion.copy(b.userData.rest.q) }
    bones[B.Jaw].quaternion.multiply(tmpQ.setFromAxisAngle(X, clamp(p.jaw, -.1, 1.2) * jawK));
    for (const side of ['L', 'R']) {
      const ei = eyeInfo[side]; if (!ei) continue;
      const s = side === 'L' ? -1 : 1, blink = clamp(side === 'L' ? p.blinkL : p.blinkR, 0, 1);
      const eb = bones[B['Eye_' + side]];
      eb.quaternion.multiply(tmpQ.setFromAxisAngle(Y, p.lookX * .45)).multiply(tmpQ.setFromAxisAngle(X, -p.lookY * .32));
      // pálpebras: o piscar domina; apertar/arregalar/olhar acompanham
      const open = 1 - blink, up = -p.wide * .35 * ei.hu / ei.e.Rl + p.squint * .22 * ei.closeU - p.lookY * .18;
      const lo = p.wide * .3 * ei.hl / ei.e.Rl - p.squint * .55 * ei.closeL - p.lookY * .1 - Math.max(p.smile + (s < 0 ? p.smileL : p.smileR), 0) * .3 * ei.closeL;
      const aU = blink * ei.closeU + open * up, aL = -blink * ei.closeL + open * lo;
      bones[B['LidUp_' + side]].quaternion.multiply(tmpQ.setFromAxisAngle(X, aU));
      bones[B['LidLo_' + side]].quaternion.multiply(tmpQ.setFromAxisAngle(X, aL));
    }
    const mw = morphWeights(p); // blendshapes em todas as malhas que os têm (pele, sobrancelhas, bigode)
    for (const m of rig.morphMeshes || []) { const dict = m.morphTargetDictionary, inf = m.morphTargetInfluences; if (!dict) continue; for (const k in dict) inf[dict[k]] = mw[k] || 0 }
  }

  // ---------- clipes de animação (exportados no GLB) ----------
  function makeClips() {
    const fps = 24, mk = (name, dur, poseAt) => {
      const times = [], vals = bones.map(() => ({ q: [], p: [] })), mv = Object.fromEntries(MORPH_NAMES.map(n => [n, []]));
      for (let f = 0; f <= Math.round(dur * fps); f++) {
        const t = f / fps, pose = poseAt(t); times.push(t); apply(pose);
        bones.forEach((b, i) => { vals[i].q.push(...b.quaternion.toArray()); vals[i].p.push(...b.position.toArray()) });
        const w = morphWeights({ ...NEUTRAL, ...pose }); for (const n of MORPH_NAMES) mv[n].push(w[n]);
      }
      apply({});
      const tracks = [];
      bones.forEach((b, i) => { if (i === B.Head) return; tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', times, vals[i].q)); tracks.push(new THREE.VectorKeyframeTrack(b.name + '.position', times, vals[i].p)) });
      for (const m of rig.morphMeshes || []) for (const n of Object.keys(m.morphTargetDictionary || {})) tracks.push(new THREE.NumberKeyframeTrack(m.name + '.morphTargetInfluences[' + n + ']', times, mv[n]));
      return new THREE.AnimationClip(name, dur, tracks);
    };
    const pulse = (t, a, b) => sstep(a, a + (b - a) * .35, t) * (1 - sstep(a + (b - a) * .65, b, t));
    const hold = (pose, dur = 1.2) => t => { const k = sstep(0, .3, t) * (1 - sstep(dur - .3, dur, t)); return Object.fromEntries(Object.entries(pose).map(([k2, v]) => [k2, v * k])) };
    return [
      mk('Blink', .3, t => { const b = pulse(t, 0, .3); return { blinkL: b, blinkR: b } }),
      mk('Wink_R', .6, t => { const b = pulse(t, 0, .6); return { blinkR: b, smileR: b * .8, squint: b * .2 } }),
      mk('Talk', 2.4, t => talkPose(t)),
      mk('LookAround', 3, t => ({ lookX: Math.sin(t * Math.PI * 2 / 3) * .8, lookY: Math.sin(t * Math.PI * 4 / 3) * .3, blinkL: pulse(t, 1.4, 1.65), blinkR: pulse(t, 1.4, 1.65) })),
      ...Object.entries(EXPRESSIONS).filter(([k]) => k !== 'neutro').map(([k, v]) => mk('Expr_' + k, 1.2, hold(v)))
    ];
  }

  const rig = { bones, root: head, weights, skinAttributes, apply, makeClips, B, eyeInfo, kind: 'bones', morphMeshes: [] };
  return rig;
}
