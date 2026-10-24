// Uma coreografia em coordenadas normalizadas; todos os rigs usam esta mesma fonte.
export const MOTIONS={
 lobby:{label:'Lobby',duration:6,loop:true,description:'Respiração e balanço de espera'},
 defeat:{label:'Derrota',duration:3.6,loop:false,description:'Desânimo e cabeça baixa'},
 victory:{label:'Vitória',duration:6,loop:false,description:'Comemoração e dança de vitória'},
 dance_floss:{label:'Floss',duration:4,loop:true,description:'Braços alternados e quadril no contratempo'},
 dance_shuffle:{label:'Shuffle',duration:4,loop:true,description:'Passos alternados e balanço dos braços'}
};
const PI=Math.PI;
export function motionPose(id,time){
 const def=Object.hasOwn(MOTIONS,id)?MOTIONS[id]:null;if(!def)throw Error('Animação desconhecida: '+id);
 const t=def.loop?((time%def.duration)+def.duration)%def.duration:Math.max(0,Math.min(def.duration,time)),p={},rot=(name,x=0,y=0,z=0)=>p[name]=[x,y,z],s=Math.sin(t*2*PI),c=Math.cos(t*2*PI);
 // A pose A de autoria é preservada no botão Parar; aqui os ombros relaxam.
 rot('UpperArm_L',0,0,-.30);rot('UpperArm_R',0,0,.30);
 p.offset=[0,0,0];p.face={};
 if(id==='lobby'){
  const a=t*2*PI/6;rot('Chest',.013*Math.sin(a),.025*Math.sin(a),.012*Math.sin(a));rot('Hips',0,0,.018*Math.sin(a));rot('Head',0,.06*Math.sin(a),0);
  rot('LowerArm_L',-.10,0,0);rot('LowerArm_R',-.08,0,0);
 }else if(id==='defeat'){
  const u=Math.min(1,t/1.1),ease=u*u*(3-2*u);rot('Chest',.26*ease,0,0);rot('Head',.29*ease,.09*Math.sin(t*5)*Math.exp(-t)*ease,0);rot('Spine',.12*ease,0,0);
  rot('UpperArm_L',.12*ease,0,-.34);rot('UpperArm_R',.12*ease,0,.34);p.face={smile:-.55,browRaise:-.3};
 }else if(id==='dance_floss'){
  const a=t*2*PI,side=Math.sin(a),across=Math.sin(a+PI*.38),back=Math.cos(a);
  rot('Hips',0,.10*side,-.085*side);rot('Chest',0,-.10*side,.055*side);
  for(const [suffix,sign]of [['L',1],['R',-1]]){rot('UpperArm_'+suffix,.28*back,0,-sign*.24+.52*across);rot('LowerArm_'+suffix,-.12,0,0);rot('UpperLeg_'+suffix,-.045+.035*Math.cos(a+sign),0,sign*.035*side);rot('LowerLeg_'+suffix,.10+.045*Math.cos(a+sign),0,0)}
  p.offset=[.018*side,0,0];rot('Head',0,.05*side,-.035*side);p.face={smile:.4};
 }else if(id==='dance_shuffle'){
  const a=t*2*PI,beat=Math.sin(a),lift=Math.max(0,beat),other=Math.max(0,-beat);
  rot('Hips',0,.10*beat,.065*beat);rot('Chest',-.04,-.08*beat,-.045*beat);
  for(const [suffix,sign,k]of [['L',1,lift],['R',-1,other]]){rot('UpperLeg_'+suffix,-.28*k+.10*(1-k),sign*.10*beat,0);rot('LowerLeg_'+suffix,.46*k+.05,0,0);rot('Foot_'+suffix,-.17*k,sign*.13*beat,0);rot('UpperArm_'+suffix,sign*.26*beat,0,-sign*.28);rot('LowerArm_'+suffix,-.38-.12*k,0,0)}
  p.offset=[.025*beat,.008*Math.abs(beat),0];p.face={smile:.55};
 }else if(id==='victory'){
  const raise=Math.sin(Math.min(1,t/.85)*PI/2),out=1-Math.max(0,(t-4.7)/1.3),v=raise*out;
  rot('Chest',-.07*v,0,.06*s*v);rot('Head',-.07*v,0,-.04*s*v);
  rot('UpperArm_L',-.16*v,0,1.35*v-.3*(1-v));rot('UpperArm_R',-.16*v,0,-1.35*v+.3*(1-v));rot('LowerArm_L',-.25*v,0,.2*v);rot('LowerArm_R',-.25*v,0,-.2*v);
  rot('Hips',0,.13*s*v,.06*s*v);rot('UpperLeg_L',-.06*v,0,0);rot('UpperLeg_R',-.06*v,0,0);rot('LowerLeg_L',.12*v,0,0);rot('LowerLeg_R',.12*v,0,0);
  p.offset=[.018*s*v,.035*Math.max(0,s)*v,0];p.face={smile:.8*v,jaw:.12*v};
 }
 return p;
}
