// Movimentos capturados CMU/cgspeed, compartilhados por direção anatômica.
// IDs anteriores permanecem para links e integrações existentes.
import {MOCAP} from './mocap-data.js';
import {sampleCapture} from './mocap-player.js';
import * as THREE from 'three';
const definitions={
 lobby:{label:'Lobby',description:'Espera com postura e mudança de apoio capturadas'},
 defeat:{label:'Derrota',description:'Desânimo, passos e ombros abatidos'},
 victory:{label:'Vitória',description:'Comemoração corporal capturada'},
 dance_floss:{label:'Macarena',description:'Sequência de braços e quadril da Macarena'},
 dance_shuffle:{label:'Dança retrô',description:'Sequência solo de passos e braços capturados'}
};
export const MOTIONS=Object.fromEntries(Object.entries(definitions).map(([id,definition])=>[id,{...definition,duration:MOCAP[id].duration,loop:MOCAP[id].loop}]));
export function motionPose(id,time){
 if(!Object.hasOwn(MOTIONS,id))throw Error('Animação desconhecida: '+id);
 const clip=MOCAP[id],capture=sampleCapture(clip,time),t=Math.max(0,Math.min(clip.duration,time)),ease=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u)};
 // A orientação capturada também define a direção. Isso evita duas curvas
 // diferentes para o mesmo segmento nas mesclas das emendas.
 if(clip.restDirections)for(const [name,direction]of Object.entries(clip.restDirections))capture.directions[name]=new THREE.Vector3(...direction).applyQuaternion(new THREE.Quaternion(...capture.orientations[name])).normalize().toArray();
 const face=id==='defeat'?{smile:-.30*ease(t/.7),browRaise:-.10*ease(t/.7),jaw:0}:id==='victory'?{smile:.2+.35*ease(t/.8),browRaise:.05,jaw:.04*Math.sin(Math.PI*t/clip.duration)**2}:{smile:id==='lobby'?.06:.24,browRaise:0,jaw:0};
 return {capture,restFeet:clip.restFoot,restDirections:clip.restDirections,face,offset:[0,0,0]};
}
