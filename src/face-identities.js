// Escultura de volumes, em unidades da cabeça. Cada linha define uma anatomia completa.
// contorno: base do queixo, meia-largura do queixo, mandíbula, maçã, têmpora, perfil frontal.
// olhos: altura, raio, distância ao centro, abertura superior/inferior, inclinação.
// nariz: altura da ponta, largura, ponte, projeção da ponta, raio da ponta.
// boca: altura, meia-largura, sorriso, assimetria, espessura superior/inferior, projeção.
const deg=x=>x*Math.PI/180;
const profiles={
 feminine_soft:{contour:[-1.00,.18,.49,.76,.73,.75],eyes:[.02,.292,.354,32,-27,5],nose:[-.32,.95,.060,.102,.080],mouth:[-.64,.258,.48,.12,.039,.060,.032],cheek:[.075,.43,-.27,.27,.25],chin:[.025,.20],brow:[.034,.053,.17],round:.62},
 masculine_soft:{contour:[-1.19,.37,.71,.77,.77,.79],eyes:[.045,.248,.365,24,-22,-2],nose:[-.40,1.35,.123,.112,.095],mouth:[-.77,.305,.08,.08,.024,.043,.029],cheek:[.026,.48,-.26,.27,.25],chin:[.070,.31],brow:[.060,.022,.17],round:.73,square:2.8},
 cute_round:{contour:[-.80,.31,.61,.83,.78,.76],eyes:[-.025,.331,.373,39,-34,-3],nose:[-.255,1.02,.036,.085,.088],mouth:[-.51,.206,.85,.0,.030,.049,.028],cheek:[.112,.46,-.27,.32,.28],chin:[.010,.27],brow:[.027,.041,.22],round:.50},
 feminine_bold:{contour:[-1.13,.13,.43,.80,.73,.73],eyes:[.045,.294,.356,27,-23,10],nose:[-.36,.88,.077,.100,.071],mouth:[-.73,.291,.12,.42,.045,.070,.035],cheek:[.043,.50,-.19,.28,.25],chin:[.040,.16],brow:[.032,.085,.19],round:.84},
 old_king:{contour:[-1.25,.40,.75,.88,.78,.82],eyes:[.055,.240,.375,19,-22,1],nose:[-.47,1.46,.151,.137,.112],mouth:[-.84,.281,-.12,.08,.019,.038,.024],cheek:[.055,.51,-.37,.29,.29],chin:[.085,.34],brow:[.078,.030,.16],round:.85,square:2.9,mature:true},
 alchemist_villain:{contour:[-1.48,.078,.31,.64,.68,.70],eyes:[.09,.240,.312,17,-22,9],nose:[-.52,1.01,.194,.106,.072],mouth:[-.99,.316,.32,.94,.016,.025,.020],cheek:[.009,.48,-.20,.24,.22],chin:[.095,.12],brow:[.031,.087,.21],round:1.10,hook:.035,mature:true},
 dwarf_bard:{contour:[-.99,.43,.79,.90,.79,.80],eyes:[.025,.259,.354,29,-25,-5],nose:[-.31,1.45,.071,.173,.128],mouth:[-.62,.274,.92,.10,.024,.043,.027],cheek:[.115,.47,-.29,.33,.27],chin:[.050,.34],brow:[.074,.034,.18],round:.58,square:2.6},
 sad_clown:{contour:[-1.03,.32,.64,.86,.76,.77],eyes:[.01,.291,.346,34,-30,-11],nose:[-.34,1.08,.045,.100,.085],mouth:[-.69,.240,-.70,.0,.023,.036,.024],cheek:[.104,.47,-.34,.32,.30],chin:[.035,.28],brow:[.030,.025,.22],round:.60},
 orc_warrior:{contour:[-1.27,.48,.85,.88,.81,.89],eyes:[.06,.242,.376,22,-22,12],nose:[-.35,1.84,.060,.125,.122],mouth:[-.81,.381,-.25,.18,.025,.088,.059],cheek:[.045,.52,-.24,.29,.26],chin:[.115,.38],brow:[.092,.015,.16],round:.92,square:3.0},
 nana_explorer:{contour:[-.98,.33,.69,.84,.77,.78],eyes:[.035,.296,.374,33,-29,1],nose:[-.30,1.18,.057,.122,.101],mouth:[-.65,.310,.60,.20,.036,.059,.032],cheek:[.106,.47,-.27,.31,.28],chin:[.038,.28],brow:[.046,.036,.18],round:.56,square:2.6},
 moon_guardian:{contour:[-1.08,.14,.43,.73,.72,.74],eyes:[.04,.308,.343,34,-28,3],nose:[-.33,.84,.055,.092,.073],mouth:[-.70,.235,.14,.05,.036,.057,.028],cheek:[.066,.44,-.24,.28,.25],chin:[.022,.16],brow:[.030,.061,.21],round:.61},
 nico_inventor:{contour:[-.85,.22,.48,.78,.78,.75],eyes:[-.005,.338,.383,38,-34,1],nose:[-.26,.98,.033,.088,.084],mouth:[-.54,.236,.52,.48,.025,.039,.025],cheek:[.101,.46,-.26,.30,.27],chin:[.013,.21],brow:[.037,.040,.22],round:.52},
 ruby_sorceress:{contour:[-1.20,.12,.40,.77,.72,.72],eyes:[.07,.286,.344,26,-24,12],nose:[-.39,.87,.100,.094,.067],mouth:[-.80,.277,.05,.60,.040,.063,.032],cheek:[.030,.50,-.20,.27,.25],chin:[.057,.15],brow:[.032,.089,.21],round:.91,hook:.012},
 flame_guardian:{contour:[-1.19,.41,.79,.82,.79,.83],eyes:[.055,.263,.375,23,-24,3],nose:[-.40,1.22,.128,.130,.098],mouth:[-.78,.326,.0,.24,.024,.044,.030],cheek:[.032,.51,-.22,.28,.25],chin:[.093,.34],brow:[.073,.026,.16],round:.78,square:3.0},
 forest_archer_f:{contour:[-.97,.19,.49,.79,.73,.77],eyes:[.025,.302,.360,28,-24,8],nose:[-.285,.94,.049,.105,.080],mouth:[-.605,.279,.70,.48,.034,.052,.029],cheek:[.090,.47,-.24,.30,.27],chin:[.025,.20],brow:[.037,.057,.18],round:.63},
 forest_archer_m:{contour:[-1.18,.26,.58,.80,.76,.78],eyes:[.045,.278,.374,25,-24,4],nose:[-.39,1.26,.109,.125,.094],mouth:[-.79,.309,.24,.56,.025,.045,.029],cheek:[.035,.49,-.21,.28,.25],chin:[.068,.24],brow:[.061,.032,.17],round:.78,square:2.5},
 forest_guard_f:{contour:[-1.09,.35,.70,.77,.75,.76],eyes:[.035,.274,.363,29,-25,3],nose:[-.35,1.10,.079,.112,.089],mouth:[-.71,.279,.10,.09,.029,.047,.029],cheek:[.052,.46,-.27,.29,.26],chin:[.054,.29],brow:[.047,.030,.17],round:.67,square:2.7},
 forest_guard_m:{contour:[-1.05,.35,.68,.78,.76,.77],eyes:[.03,.283,.379,30,-27,-1],nose:[-.33,1.18,.074,.117,.096],mouth:[-.69,.304,.70,.10,.026,.047,.029],cheek:[.065,.47,-.28,.30,.27],chin:[.058,.29],brow:[.055,.028,.18],round:.59,square:2.7},
 forest_guard_veteran:{contour:[-1.26,.42,.79,.80,.80,.83],eyes:[.065,.244,.373,19,-23,0],nose:[-.46,1.34,.152,.134,.105],mouth:[-.84,.292,-.18,.14,.020,.036,.025],cheek:[.018,.51,-.30,.27,.27],chin:[.105,.35],brow:[.082,.019,.16],round:.88,square:3.0,hook:.018,mature:true},
 forest_artificer:{contour:[-1.22,.17,.45,.72,.72,.73],eyes:[.075,.259,.344,22,-25,7],nose:[-.42,1.02,.140,.110,.080],mouth:[-.82,.301,.16,.83,.022,.036,.025],cheek:[.025,.48,-.21,.27,.24],chin:[.079,.17],brow:[.058,.057,.19],round:.87,hook:.027},
 forest_princess:{contour:[-.92,.20,.53,.83,.76,.76],eyes:[.005,.320,.365,37,-32,2],nose:[-.275,.86,.037,.090,.079],mouth:[-.57,.229,.52,.08,.033,.052,.028],cheek:[.107,.46,-.24,.31,.28],chin:[.017,.20],brow:[.031,.055,.21],round:.53},
 bread_baker:{contour:[-1.07,.38,.74,.89,.79,.80],eyes:[.025,.284,.377,31,-28,-2],nose:[-.34,1.35,.071,.145,.115],mouth:[-.72,.342,.72,.16,.030,.051,.030],cheek:[.105,.49,-.32,.33,.30],chin:[.051,.32],brow:[.064,.035,.18],round:.56,square:2.6}
};
profiles.bread_vigilante=profiles.bread_baker;
const skulls={feminine_soft:[.79,.77,.83],masculine_soft:[.84,.79,.86],cute_round:[.87,.80,.87],feminine_bold:[.78,.83,.82],old_king:[.86,.83,.87],alchemist_villain:[.73,.91,.80],dwarf_bard:[.88,.74,.87],sad_clown:[.85,.79,.85],orc_warrior:[.91,.76,.93],nana_explorer:[.86,.74,.87],moon_guardian:[.77,.85,.83],nico_inventor:[.84,.83,.85],ruby_sorceress:[.76,.86,.82],flame_guardian:[.87,.77,.89],forest_archer_f:[.81,.76,.85],forest_archer_m:[.82,.81,.86],forest_guard_f:[.82,.76,.84],forest_guard_m:[.84,.77,.85],forest_guard_veteran:[.86,.79,.89],forest_artificer:[.76,.84,.82],forest_princess:[.84,.82,.86],bread_baker:[.88,.76,.88]};
skulls.bread_vigilante=skulls.bread_baker;
export const FACE_IDENTITIES=profiles;

export function refineFaceIdentities(presets){
 for(const [id,f]of Object.entries(profiles)){
  const p=presets[id],[bottom,chin,jaw,cheek,temple,front]=f.contour;
  const [rx,ry,rz]=skulls[id],top=p.cran[0]+p.cran[3];p.cran=p.cran.slice();p.cran[0]=top-ry;p.cran[2]=rx;p.cran[3]=ry;p.cran[4]=rz;
  // Silhueta desenhada diretamente: não são multiplicadores do mesmo rosto herdado.
  p.loft={y:[bottom,bottom+.075,bottom+.20,bottom*.64,-.34,-.12,.08,.32],a:[chin*.58,chin,chin*.55+jaw*.45,jaw,cheek,temple,temple*.94,.43],zf:[front-.12,front-.065,front-.035,front-.01,front+.01,front-.015,.68,.43],zb:[.34,.24,.08,-.13,-.26,-.29,-.30,-.30],n:f.square||2.2,cb:.10,ct:.17,k:.20,blur:.075};
  const [eyeY,Re,eyeX,up,low,tilt]=f.eyes;Object.assign(p,{eyeY,Re,eyeX,openU:deg(up),openL:deg(low),tilt:deg(tilt),openW:deg(62),peakU:-.12,peakL:.10,upperLidPower:f.round,lowerLidPower:f.round*.88,sink:Re*.77,domeK:.10});
  [p.noseTipY,p.noseW,p.noseH,p.tipH,p.tipR]=f.nose;p.sculptedNose=true;p.bridgeBump=f.hook||0;p.alaeX=.070;p.alaeH=p.tipH*.30;
  [p.mouthY,p.mouthW,p.smile,p.smirk,p.lipU,p.lipL,p.lipH]=f.mouth;
  [p.cheekH,p.cheekX,p.cheekY,p.cheekW,p.cheekTall]=f.cheek;[p.chinH,p.chinW]=f.chin;[p.browTh,p.browArch,p.browGap]=f.brow;
  // Pálpebra, órbita e maçã formam volumes largos e contínuos. Evita a crista diagonal sob o olho.
  Object.assign(p,{sculptedFace:true,socket:f.mature?.024:.012,crease:f.mature?.010:.005,creaseGap:.046,orbit:f.mature?.019:.009,lidFold:.006,lowerRoll:.003,zyg:f.mature?.015:.005,hollow:f.mature?.017:.003,temple:.005,browRidge:f.mature?.040:.016,fold:f.mature?.65:.18,muzzle:.022,irisAng:deg(f.mature?29:33),lash:Math.min(p.lash,.015),flick:Math.min(p.flick,.025),lashLen:Math.min(p.lashLen,.060)});
  p.faceIdentity=id==='bread_vigilante'?'bread_baker':id;
 }
 // Vegetais: massas e relações faciais também próprias, preservando as espécies.
 for(const [id,f]of Object.entries({
  frontier_cowboy:{r:[.66,.76,.80,.75,.63],eyeX:.327,Re:.300,openU:deg(23),openL:deg(-31),tilt:deg(-8),browTh:.076,browSlope:.044,mouthY:-.43,mouthW:.372,smile:.24,smirk:.86,cheekH:.055},
  cactus_soldier:{r:[.74,.82,.82,.77,.67],eyeX:.338,Re:.288,openU:deg(26),openL:deg(-28),tilt:deg(5),browTh:.095,browSlope:-.018,mouthY:-.48,mouthW:.285,smile:-.35,smirk:0,cheekH:.072},
  cactus_soldier_large:{r:[.82,.91,.91,.83,.70],eyeX:.373,Re:.275,openU:deg(20),openL:deg(-25),tilt:deg(9),browTh:.118,browSlope:.040,mouthY:-.53,mouthW:.352,smile:-.48,smirk:0,cheekH:.095}
 })){
  const {r,...face}=f,p=presets[id];Object.assign(p,{lathe:{cz:-.04,zs:.88,y:[-1.45,-.85,-.2,.5,1.02],r,top:1.02,rc:.48},neck:[.78,-.65,-.04,-.85,-.04,.24],cran:[.3,-.04,.82,1.05,.72,.72,2],pattern:{...p.pattern,n:10,depth:.047,top:1.3,bot:-1.1,faceFade:.6},spines:{...p.spines,len:.105,r:.013,y0:-.72,y1:1.03,dy:.26},eyeY:.20,peakU:-.12,peakL:.1,upperLidPower:.6,lowerLidPower:.55,browGap:.14,browLen:1.12,skin:'#668f2b',patternColor:['#365b16','#a5bf51'],lidShadow:'#47651f',cheekW:.29,cheekTall:.27,...face,faceIdentity:id});
 }
 Object.assign(presets.cactus_cowboy,{Re:.270,openU:deg(27),openL:deg(-30),upperLidPower:.6,lowerLidPower:.55,browTh:.068,mouthW:.323,smirk:.78,cheekH:.055,cheekW:.29,cheekTall:.25,faceIdentity:'cactus_cowboy'});
 Object.assign(presets.pepper_king,{Re:.281,eyeX:.315,openU:deg(32),openL:deg(-29),upperLidPower:.55,lowerLidPower:.5,browTh:.074,browArch:.044,mouthW:.319,cheekH:.085,cheekW:.30,cheekTall:.28,faceIdentity:'pepper_king'});
 Object.assign(presets.chili_bandit,{Re:.265,eyeX:.271,openU:deg(39),openL:deg(-35),upperLidPower:.6,lowerLidPower:.55,browArch:.080,mouthW:.432,smirk:.7,faceIdentity:'chili_bandit'});
 for(const id of ['paysandu_wolf','ruby_raven','desert_fennec','cowboy_on_fennec','robot_ball'])presets[id].faceIdentity=id==='cowboy_on_fennec'?'desert_fennec':id;
}
