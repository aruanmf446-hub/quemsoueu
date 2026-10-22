// Escultura facial por identidade. Atua na forma, não na iluminação, roupa ou cor.
// Skins da mesma pessoa recebem o mesmo perfil anatômico.
const deg=x=>x*Math.PI/180;
const profiles={
 feminine_soft:{shape:[.88,1.02,.98,.065],eyes:[.239,.349,25,-23,5],nose:[.86,.070,.058,-.37],mouth:[.224,-.68],cheek:[.061,.43,-.24,.20],chin:[.019,.17],brow:[.034,.047],lid:1.02},
 masculine_soft:{shape:[1.13,.97,1.03,.025],eyes:[.219,.366,17,-18,-1],nose:[1.14,.105,.068,-.43],mouth:[.259,-.76],cheek:[.022,.46,-.29,.19],chin:[.048,.27],brow:[.052,.020],bridge:.012},
 cute_round:{shape:[1.06,1.08,1.02,.075],eyes:[.279,.378,33,-30,-2],nose:[.90,.034,.064,-.29],mouth:[.178,-.53],cheek:[.083,.45,-.29,.24],chin:[.012,.22],brow:[.025,.040],lid:.72},
 feminine_bold:{shape:[.89,1.065,.99,.030],eyes:[.240,.354,20,-20,11],nose:[.82,.089,.050,-.385],mouth:[.254,-.68],cheek:[.042,.48,-.23,.16],chin:[.029,.16],brow:[.031,.078],zyg:.040,lid:1.18},
 old_king:{shape:[1.19,1.015,1.04,-.035],eyes:[.207,.365,12,-16,2],nose:[1.08,.132,.074,-.47],mouth:[.241,-.80],cheek:[.013,.48,-.28,.18],chin:[.064,.29],brow:[.060,.018],bridge:.025,zyg:.041},
 alchemist_villain:{shape:[.79,.97,.98,-.030],eyes:[.207,.325,12,-15,7],nose:[.90,.164,.052,-.57],mouth:[.264,-.94],cheek:[.008,.49,-.25,.15],chin:[.065,.12],brow:[.027,.078],bridge:.038,zyg:.055,lid:1.25},
 dwarf_bard:{shape:[1.15,1.06,1.02,.040],eyes:[.215,.348,22,-19,-3],nose:[1.28,.082,.112,-.35],mouth:[.223,-.59],cheek:[.093,.44,-.31,.23],chin:[.042,.28],brow:[.065,.032],lid:.86},
 sad_clown:{shape:[1.08,1.09,1,.025],eyes:[.237,.340,25,-22,-10],mouth:[.224,-.66],cheek:[.088,.44,-.33,.23],chin:[.026,.23],brow:[.028,.022],lid:.85},
 orc_warrior:{shape:[1.16,1.04,1.03,-.020],eyes:[.185,.349,14,-15,10],nose:[1.60,.068,.100,-.42],mouth:[.333,-.78],cheek:[.028,.49,-.23,.20],chin:[.080,.31],brow:[.075,.012],zyg:.050,lid:1.12},
 nana_explorer:{shape:[1.10,1.02,1.02,.085],eyes:[.260,.360,26,-24,4],nose:[1.04,.066,.071,-.35],mouth:[.258,-.65],cheek:[.069,.46,-.25,.21],chin:[.032,.24],brow:[.042,.037],lid:.98},
 moon_guardian:{shape:[.87,1.025,.99,.075],eyes:[.270,.350,27,-25,4],nose:[.77,.065,.052,-.36],mouth:[.218,-.655],cheek:[.068,.43,-.23,.19],chin:[.020,.16],brow:[.032,.055],lid:1.02},
 nico_inventor:{shape:[.91,1.10,1.025,.090],eyes:[.307,.382,33,-30,2],nose:[.85,.032,.061,-.29],mouth:[.197,-.55],cheek:[.085,.45,-.27,.22],chin:[.012,.19],brow:[.035,.039],lid:.75},
 ruby_sorceress:{shape:[.84,1.055,.98,-.020],eyes:[.254,.345,20,-22,10],nose:[.80,.089,.047,-.42],mouth:[.242,-.72],cheek:[.035,.48,-.20,.16],chin:[.040,.14],brow:[.031,.079],bridge:.009,zyg:.045,lid:1.25},
 flame_guardian:{shape:[1.17,1.035,1.05,.015],eyes:[.231,.367,17,-19,3],nose:[1.04,.111,.064,-.43],mouth:[.266,-.755],cheek:[.027,.49,-.23,.18],chin:[.069,.28],brow:[.061,.022],bridge:.017,zyg:.044,lid:1.1},
 forest_archer_f:{shape:[.90,1.045,1,.125],eyes:[.251,.345,24,-21,7],nose:[.86,.062,.055,-.34],mouth:[.244,-.625],cheek:[.060,.455,-.24,.24],chin:[.024,.17],brow:[.032,.050],zyg:.022,lid:1.16,smirk:.55},
 forest_archer_m:{shape:[.98,1.075,1.02,-.015],eyes:[.238,.375,18,-19,3],nose:[1.16,.100,.071,-.445],mouth:[.264,-.775],cheek:[.028,.48,-.20,.18],chin:[.047,.22],brow:[.055,.026],zyg:.046,lid:1.1},
 forest_guard_f:{shape:[1.14,1.01,1.025,.050],eyes:[.245,.359,22,-21,5],nose:[.96,.081,.060,-.385],mouth:[.245,-.68],cheek:[.045,.46,-.255,.19],chin:[.043,.235],brow:[.043,.027],lid:1.10},
 forest_guard_m:{shape:[1.12,.99,1.02,.075],eyes:[.243,.371,22,-20,1],nose:[1.01,.087,.068,-.39],mouth:[.253,-.715],cheek:[.043,.455,-.26,.21],chin:[.048,.25],brow:[.050,.027],lid:.94},
 forest_guard_veteran:{shape:[1.22,1.025,1.055,-.030],eyes:[.214,.365,13,-17,1],nose:[1.13,.131,.075,-.47],mouth:[.248,-.805],cheek:[.014,.485,-.25,.18],chin:[.075,.30],brow:[.069,.015],bridge:.029,zyg:.045,lid:1.18},
 forest_artificer:{shape:[.88,1.025,.99,-.020],eyes:[.229,.351,15,-18,7],nose:[.92,.120,.054,-.45],mouth:[.257,-.77],cheek:[.020,.475,-.24,.17],chin:[.057,.16],brow:[.051,.049],bridge:.022,zyg:.042,lid:1.2,smirk:.82},
 forest_princess:{shape:[.94,1.095,1.005,.135],eyes:[.276,.355,28,-27,3],nose:[.76,.047,.052,-.32],mouth:[.214,-.60],cheek:[.083,.445,-.25,.21],chin:[.018,.18],brow:[.030,.050],lid:.91},
 bread_baker:{shape:[1.18,1.06,1.025,.055],eyes:[.249,.366,24,-23,0],nose:[1.12,.079,.084,-.39],mouth:[.271,-.72],cheek:[.065,.455,-.30,.225],chin:[.040,.27],brow:[.054,.033],lid:.90}
};
profiles.bread_vigilante=profiles.bread_baker;
const lips={feminine_soft:[.041,.058,.037],masculine_soft:[.028,.048,.030],cute_round:[.035,.050,.033],feminine_bold:[.052,.067,.044],old_king:[.021,.039,.026],alchemist_villain:[.016,.027,.021],dwarf_bard:[.022,.042,.027],sad_clown:[.026,.036,.027],orc_warrior:[.023,.075,.055],nana_explorer:[.041,.062,.039],moon_guardian:[.040,.058,.036],nico_inventor:[.027,.040,.027],ruby_sorceress:[.044,.062,.041],flame_guardian:[.026,.047,.032],forest_archer_f:[.035,.050,.032],forest_archer_m:[.027,.046,.031],forest_guard_f:[.036,.051,.034],forest_guard_m:[.027,.048,.032],forest_guard_veteran:[.023,.041,.030],forest_artificer:[.024,.040,.028],forest_princess:[.035,.051,.032],bread_baker:[.032,.053,.035]};
lips.bread_vigilante=lips.bread_baker;
export const FACE_IDENTITIES=profiles;

export function refineFaceIdentities(presets){
 for(const [id,f]of Object.entries(profiles)){
  const p=presets[id],L=p.loft,[jaw,cheek,skull,lift]=f.shape,gauss=(x,w)=>Math.exp(-((x/w)**2));
  p.cran=p.cran.slice();p.cran[2]*=skull;
  p.loft={...L,y:L.y.map(y=>y<-.15?y+lift*(-.15-y)/(-.15-L.y[0]):y),a:L.a.map((a,i)=>a*(1+(jaw-1)*gauss(L.y[i]+.77,.25)+(cheek-1)*gauss(L.y[i]+.28,.23))),zf:L.zf.slice(),zb:L.zb.slice()};
  const [re,ex,up,low,tilt]=f.eyes;Object.assign(p,{Re:re,eyeX:ex,openU:deg(up),openL:deg(low),tilt:deg(tilt)});
  if(f.nose){const [w,h,r,y]=f.nose;Object.assign(p,{noseW:w,noseH:h,tipR:r,noseTipY:y})}
  [p.mouthW,p.mouthY]=f.mouth;[p.cheekH,p.cheekX,p.cheekY,p.cheekW]=f.cheek;[p.chinH,p.chinW]=f.chin;[p.browTh,p.browArch]=f.brow;
  p.cheekTall=.19;[p.lipU,p.lipL,p.lipH]=lips[id];
  p.bridgeBump=f.bridge||0;p.upperLidPower=f.lid||1;p.lowerLidPower=(f.lid||1)*.92;if(f.zyg!==undefined)p.zyg=f.zyg;if(f.smirk!==undefined)p.smirk=f.smirk;
  p.irisAng=deg(id==='cute_round'||id==='nico_inventor'?36:id==='old_king'||id==='forest_guard_veteran'?27:id==='ruby_sorceress'||id==='feminine_bold'?30:id==='forest_princess'||id==='moon_guardian'?34:31);
  p.faceIdentity=id==='bread_vigilante'?'bread_baker':id;
 }
 // O molde anatômico do cacto agora vive no preset, deixando cada rosto realmente independente.
 for(const [id,face]of Object.entries({
  frontier_cowboy:{eyeX:.326,Re:.273,openU:deg(12),openL:deg(-28),tilt:deg(-7),browTh:.075,browSlope:.044,mouthY:-.43,mouthW:.355,smile:.13,smirk:.80,cheekH:.022},
  cactus_soldier:{eyeX:.338,Re:.260,openU:deg(18),openL:deg(-24),tilt:deg(3),browTh:.090,browSlope:-.018,mouthY:-.45,mouthW:.290,smile:-.20,smirk:0,cheekH:.042},
  cactus_soldier_large:{eyeX:.358,Re:.251,openU:deg(13),openL:deg(-21),tilt:deg(7),browTh:.105,browSlope:.040,mouthY:-.48,mouthW:.325,smile:-.32,smirk:0,cheekH:.061}
 })){
  const p=presets[id];Object.assign(p,{lathe:{cz:-.04,zs:.88,y:[-1.45,-.85,-.2,.5,1.02],r:[.76,.80,.82,.81,.72],top:1.02,rc:.48},neck:[.78,-.65,-.04,-.85,-.04,.24],cran:[.3,-.04,.82,1.05,.72,.72,2],pattern:{...p.pattern,n:10,depth:.047,top:1.3,bot:-1.1,faceFade:.6},spines:{...p.spines,len:.105,r:.013,y0:-.72,y1:1.03,dy:.26},eyeY:.20,peakU:.08,browGap:.14,browLen:1.12,skin:'#668f2b',patternColor:['#365b16','#a5bf51'],lidShadow:'#47651f',...face,faceIdentity:id});
  if(id==='frontier_cowboy')p.lathe.r=[.76,.79,.80,.79,.69];
  if(id==='cactus_soldier_large')p.lathe.r=[.76,.83,.88,.86,.75];
 }
 Object.assign(presets.cactus_cowboy,{Re:.228,openU:deg(16),openL:deg(-25),browTh:.064,mouthW:.285,smirk:.62,faceIdentity:'cactus_cowboy'});
 Object.assign(presets.pepper_king,{Re:.244,eyeX:.31,openU:deg(21),openL:deg(-20),browTh:.068,browArch:.043,mouthW:.285,cheekH:.055,faceIdentity:'pepper_king'});
 Object.assign(presets.chili_bandit,{Re:.229,eyeX:.255,openU:deg(37),openL:deg(-33),browArch:.076,mouthW:.405,faceIdentity:'chili_bandit'});
 for(const id of ['paysandu_wolf','ruby_raven','desert_fennec','cowboy_on_fennec','robot_ball'])presets[id].faceIdentity=id==='cowboy_on_fennec'?'desert_fennec':id;
}
