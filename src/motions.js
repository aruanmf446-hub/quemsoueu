// Coreografias por poses de batida, compartilhadas por todos os personagens.
export const MOTIONS={
 lobby:{label:'Lobby',duration:6,loop:true,description:'Respiração, olhar e mudança suave de apoio'},
 defeat:{label:'Derrota',duration:3.6,loop:false,description:'Reação, queda dos ombros e acomodação'},
 victory:{label:'Vitória',duration:6,loop:false,description:'Preparação, comemoração e passos de vitória'},
 dance_floss:{label:'Floss',duration:4,loop:true,description:'Passagens alternadas dos braços e quadril em contraponto'},
 dance_shuffle:{label:'Shuffle',duration:4,loop:true,description:'Apoio alternado, recolhimento e avanço do pé'}
};
const PI=Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const channels=['Hips','Spine','Chest','Head','UpperArm_L','UpperArm_R','LowerArm_L','LowerArm_R','Hand_L','Hand_R'];
const neutral={root:[0,-.035,0],Hips:[0,0,0],Spine:[0,0,0],Chest:[0,0,0],Head:[0,0,0],UpperArm_L:[.015,0,-.64],UpperArm_R:[.015,0,.64],LowerArm_L:[-.10,0,0],LowerArm_R:[-.10,0,0],Hand_L:[0,0,0],Hand_R:[0,0,0],face:[.08,0,0]};
const frame=(time,values={})=>({time,...neutral,...values});
// Hermite com tangentes temporais: velocidade contínua, inclusive na costura dos loops.
function interpolate(keys,t,duration,loop){
 let i=0;while(i<keys.length-2&&t>=keys[i+1].time)i++;
 const a=keys[i],b=keys[i+1],span=b.time-a.time,u=clamp((t-a.time)/span),h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;
 const prev=i?keys[i-1]:loop?{...keys[keys.length-2],time:keys[keys.length-2].time-duration}:a;
 const next=i+2<keys.length?keys[i+2]:loop?{...keys[1],time:keys[1].time+duration}:b;
 const out={};
 for(const name of ['root',...channels,'face'])out[name]=a[name].map((v,k)=>{
  const ma=prev===a?0:.65*(b[name][k]-prev[name][k])/(b.time-prev.time),mb=next===b?0:.65*(next[name][k]-a[name][k])/(next.time-a.time);
  return h00*v+h10*span*ma+h01*b[name][k]+h11*span*mb;
 });
 return out;
}
const lobby=[frame(0),frame(1.5,{root:[.045,-.03,0],Chest:[-.012,.012,-.009],Head:[-.012,.07,.015],LowerArm_L:[-.16,0,0]}),frame(3,{root:[.025,-.045,0],Chest:[.009,0,.005],Head:[0,.02,0]}),frame(4.5,{root:[-.035,-.03,0],Chest:[-.01,-.012,.008],Head:[-.006,-.05,-.009],LowerArm_R:[-.15,0,0]}),frame(6)];
const defeat=[
 frame(0),
 frame(.22,{root:[0,-.055,0],Chest:[-.035,0,0],Head:[-.06,0,0],LowerArm_L:[-.32,0,.08],LowerArm_R:[-.32,0,-.08],face:[-.05,.18,.1]}),
 frame(.65,{root:[-.025,-.09,.015],Spine:[.045,0,0],Chest:[.13,0,0],Head:[.10,.025,0],UpperArm_L:[.06,0,-.62],UpperArm_R:[.06,0,.62],face:[-.25,.04,.04]}),
 frame(1.15,{root:[-.035,-.10,.02],Spine:[.08,.015,0],Chest:[.18,-.015,0],Head:[.20,.05,.015],UpperArm_L:[.09,0,-.67],UpperArm_R:[.09,0,.67],LowerArm_L:[-.04,0,0],LowerArm_R:[-.04,0,0],face:[-.4,-.15,0]}),
 frame(1.8,{root:[-.03,-.075,.015],Spine:[.065,.01,0],Chest:[.14,0,0],Head:[.14,-.04,.01],UpperArm_L:[.06,0,-.66],UpperArm_R:[.06,0,.66],face:[-.35,-.12,0]}),
 frame(2.6,{root:[-.03,-.075,.015],Spine:[.065,.01,0],Chest:[.14,0,0],Head:[.16,.025,.01],UpperArm_L:[.06,0,-.66],UpperArm_R:[.06,0,.66],face:[-.35,-.12,0]}),
 frame(3.6,{root:[-.03,-.075,.015],Spine:[.065,.01,0],Chest:[.14,0,0],Head:[.16,0,.01],UpperArm_L:[.06,0,-.66],UpperArm_R:[.06,0,.66],face:[-.35,-.12,0]})
];
function flossFrame(t,side,behind=null){
 const across=side*.56,leftBack=behind==='L',rightBack=behind==='R';
 return frame(t,{root:[-side*.18,behind?-.055:-.04,0],Hips:[0,-side*.10,side*.055],Chest:[.025,side*.085,-side*.035],Head:[-.015,-side*.025,side*.015],
 UpperArm_L:[leftBack?.38:-.22,leftBack?-.09:.035,-.62+across],UpperArm_R:[rightBack?.38:-.22,rightBack?.09:-.035,.62+across],
 LowerArm_L:[leftBack?.08:-.18,0,leftBack?-.05:.035],LowerArm_R:[rightBack?.08:-.18,0,rightBack?.05:-.035],Hand_L:[0,leftBack?-.12:.03,0],Hand_R:[0,rightBack?.12:-.03,0],face:[.35,0,0]});
}
const floss=[flossFrame(0,1),flossFrame(.5,-1),flossFrame(1,1,'L'),flossFrame(1.5,-1),flossFrame(2,1),flossFrame(2.5,-1,'R'),flossFrame(3,1),flossFrame(3.5,-1),flossFrame(4,1)];
function shuffleFrame(t,side){return frame(t,{root:[side*.22,-.045,-.015],Hips:[0,side*.055,-side*.025],Chest:[.045,-side*.06,side*.025],Head:[-.035,side*.035,0],
 UpperArm_L:[-.10-side*.26,0,-.57],UpperArm_R:[-.10+side*.26,0,.57],LowerArm_L:[-.60+side*.16,0,.08],LowerArm_R:[-.60-side*.16,0,-.08],Hand_L:[0,0,.03],Hand_R:[0,0,-.03],face:[.38,.025,0]});}
const shuffle=Array.from({length:17},(_,i)=>shuffleFrame(i*.25,i%4<2?1:-1));
const victory=[
 frame(0),frame(.30,{root:[-.035,-.10,0],Chest:[.07,0,.015],Head:[.04,0,0],LowerArm_L:[-.3,0,.1],LowerArm_R:[-.35,0,-.1],face:[.22,.08,0]}),
 frame(.85,{root:[-.08,-.025,0],Hips:[0,-.06,.025],Chest:[-.04,.06,-.025],Head:[-.06,-.04,0],UpperArm_L:[-.04,0,-.55],LowerArm_L:[-.60,0,.1],UpperArm_R:[-.12,.06,-1.20],LowerArm_R:[-.1,0,-.62],Hand_R:[.04,0,-.12],face:[.72,.07,.1]}),
 frame(1.22,{root:[-.07,-.065,0],Chest:[.01,.045,-.015],Head:[-.03,-.04,0],UpperArm_L:[-.04,0,-.55],LowerArm_L:[-.55,0,.12],UpperArm_R:[-.10,.03,-1.10],LowerArm_R:[-.1,0,-.70],face:[.65,.05,.06]}),
 frame(1.65,{root:[-.07,-.025,0],Chest:[-.045,.07,-.025],Head:[-.06,-.04,0],UpperArm_L:[-.04,0,-.55],LowerArm_L:[-.60,0,.1],UpperArm_R:[-.12,.06,-1.25],LowerArm_R:[-.1,0,-.62],Hand_R:[.04,0,-.12],face:[.75,.07,.1]}),
 frame(2.15,{...shuffleFrame(0,1),time:2.15}),frame(2.65,{...shuffleFrame(.5,-1),time:2.65}),frame(3.15,{...shuffleFrame(1,1),time:3.15}),frame(3.65,{...shuffleFrame(1.5,-1),time:3.65}),
 frame(4.15,{root:[.06,-.04,0],Chest:[-.025,-.04,.015],Head:[-.03,.025,0],UpperArm_L:[-.12,-.04,.65],LowerArm_L:[-.1,0,.9],UpperArm_R:[-.03,0,.56],LowerArm_R:[-.3,0,-.06],face:[.65,.04,.04]}),
 frame(4.8,{root:[.025,-.035,0],UpperArm_L:[-.1,0,.35],LowerArm_L:[-.14,0,.65],UpperArm_R:[-.03,0,.6],LowerArm_R:[-.2,0,0],Head:[-.015,.02,0],face:[.5,.02,0]}),
 frame(5.5,{root:[0,-.035,0],face:[.35,0,0]}),frame(6,{root:[0,-.035,0],face:[.35,0,0]})
];
function step(time,offset,side){
 const u=((time+offset)%1+1)%1;if(u<=.5)return {position:[0,0,0],angle:[0,0,0]};
 const s=(u-.5)*2,arc=Math.sin(PI*s)**2,sweep=Math.sin(2*PI*s)*Math.sin(PI*s);
 return {position:[side*.025*arc,.24*arc,-.55*sweep],angle:[.07*sweep,side*.12*sweep,0]};
}
export function motionPose(id,time){
 const def=Object.hasOwn(MOTIONS,id)?MOTIONS[id]:null;if(!def)throw Error('Animação desconhecida: '+id);
 const t=def.loop?((time%def.duration)+def.duration)%def.duration:clamp(time,0,def.duration),keys={lobby,defeat,victory,dance_floss:floss,dance_shuffle:shuffle}[id],p=interpolate(keys,t,def.duration,def.loop),face=p.face;
 p.face={smile:face[0],browRaise:face[1],jaw:Math.max(0,face[2])};p.offset=[0,0,0];p.feet={L:[0,0,0],R:[0,0,0]};p.footAngles={L:[0,0,0],R:[0,0,0]};
 if(id==='dance_shuffle'||id==='victory'&&t>=2.15&&t<=3.95){
  // A subida/descida começa e termina sem velocidade: apoio permanece imóvel.
  const w=id==='victory'?Math.sin(PI*clamp((t-2.15)/1.8))**2:1;
  for(const [s,phase,side]of [['L',0,1],['R',.5,-1]]){const foot=step(id==='victory'?t-2.15:t,phase,side);p.feet[s]=foot.position.map(v=>v*w);p.footAngles[s]=foot.angle.map(v=>v*w)}
 }
 // Rigs não bípedes mantêm o mesmo tempo com amplitude própria.
 for(const s of ['L','R']){const lift=p.feet[s][1];p['UpperLeg_'+s]=[-lift*1.2,0,0];p['LowerLeg_'+s]=[lift*2,0,0];p['Foot_'+s]=p.footAngles[s]}
 return p;
}
