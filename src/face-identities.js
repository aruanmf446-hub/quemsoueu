// Escultura de volumes, em unidades da cabeça. Cada linha define uma anatomia completa.
// contorno: base do queixo, meia-largura do queixo, mandíbula, maçã, têmpora.
// planos: projeção do queixo, boca, maçã e arcada em vista de perfil.
// olhos: altura, raio, distância ao centro, abertura superior/inferior, inclinação.
// nariz: altura da ponta, largura, ponte, projeção da ponta, raio da ponta.
// boca: altura, meia-largura, sorriso, assimetria, espessura superior/inferior, projeção.
const deg=x=>x*Math.PI/180;
const profiles={
 feminine_soft:{contour:[-1.0,0.28,0.57,0.77,0.73],planes:[0.72,0.8,0.84,0.68],eyes:[0.025,0.258,0.343,28,-21,5],nose:[-0.315,0.98,0.085,0.155,0.087],mouth:[-0.63,0.26,0.45,0.12,0.041,0.061,0.039],cheek:[.075,.43,-.27,.27,.25],chin:[.025,.20],brow:[.034,.053,.17],round:.62},
 masculine_soft:{contour:[-1.18,0.44,0.77,0.79,0.77],planes:[0.86,0.85,0.83,0.69],eyes:[0.05,0.233,0.348,22,-19,-2],nose:[-0.405,1.32,0.165,0.195,0.105],mouth:[-0.765,0.32,0.08,0.1,0.022,0.04,0.032],cheek:[.026,.48,-.26,.27,.25],chin:[.070,.31],brow:[.060,.022,.17],round:.73,square:2.8},
 cute_round:{contour:[-0.8,0.37,0.68,0.85,0.79],planes:[0.67,0.77,0.86,0.66],eyes:[-0.015,0.296,0.365,35,-30,-2],nose:[-0.25,1.02,0.05,0.12,0.09],mouth:[-0.5,0.21,0.9,0.03,0.028,0.043,0.028],cheek:[.112,.46,-.27,.32,.28],chin:[.010,.27],brow:[.027,.041,.22],round:.50},
 feminine_bold:{contour:[-1.09,0.25,0.55,0.82,0.74],planes:[0.76,0.8,0.84,0.66],eyes:[0.055,0.26,0.35,23,-19,10],nose:[-0.35,0.94,0.11,0.162,0.08],mouth:[-0.71,0.31,0.1,0.45,0.05,0.073,0.044],cheek:[.043,.50,-.19,.28,.25],chin:[.040,.16],brow:[.032,.085,.19],round:.84},
 old_king:{contour:[-1.22,0.48,0.82,0.9,0.79],planes:[0.89,0.9,0.87,0.7],eyes:[0.065,0.22,0.36,15,-19,1],nose:[-0.46,1.45,0.185,0.225,0.123],mouth:[-0.82,0.295,-0.12,0.1,0.019,0.037,0.029],cheek:[.055,.51,-.37,.29,.29],chin:[.085,.34],brow:[.078,.030,.16],round:.85,square:2.9,mature:true},
 alchemist_villain:{contour:[-1.47,0.15,0.38,0.65,0.67],planes:[0.82,0.77,0.79,0.63],eyes:[0.09,0.223,0.31,13,-15,10],nose:[-0.535,1.02,0.245,0.175,0.082],mouth:[-0.98,0.32,0.35,1.0,0.015,0.024,0.02],cheek:[.009,.48,-.20,.24,.22],chin:[.095,.12],brow:[.031,.087,.21],round:1.10,hook:.035,mature:true},
 dwarf_bard:{contour:[-0.98,0.52,0.87,0.93,0.79],planes:[0.81,0.86,0.91,0.71],eyes:[0.03,0.24,0.345,26,-22,-5],nose:[-0.3,1.48,0.11,0.245,0.145],mouth:[-0.61,0.29,1.0,0.16,0.022,0.041,0.029],cheek:[.115,.47,-.29,.33,.27],chin:[.050,.34],brow:[.074,.034,.18],round:.58,square:2.6},
 sad_clown:{contour:[-1.0,0.39,0.7,0.87,0.77],planes:[0.74,0.81,0.87,0.67],eyes:[0.02,0.268,0.342,29,-25,-12],nose:[-0.33,1.08,0.065,0.135,0.095],mouth:[-0.67,0.25,-0.85,0,0.022,0.035,0.027],cheek:[.104,.47,-.34,.32,.30],chin:[.035,.28],brow:[.030,.025,.22],round:.60},
 orc_warrior:{contour:[-1.23,0.57,0.94,0.92,0.82],planes:[0.98,0.96,0.91,0.72],eyes:[0.07,0.223,0.365,18,-18,12],nose:[-0.34,1.95,0.105,0.205,0.145],mouth:[-0.78,0.4,-0.3,0.2,0.022,0.08,0.06],cheek:[.045,.52,-.24,.29,.26],chin:[.115,.38],brow:[.092,.015,.16],round:.92,square:3.0},
 nana_explorer:{contour:[-0.96,0.42,0.78,0.89,0.78],planes:[0.8,0.84,0.9,0.69],eyes:[0.045,0.27,0.365,29,-24,1],nose:[-0.29,1.19,0.085,0.18,0.11],mouth:[-0.635,0.325,0.7,0.25,0.038,0.06,0.038],cheek:[.106,.47,-.27,.31,.28],chin:[.038,.28],brow:[.046,.036,.18],round:.56,square:2.6},
 moon_guardian:{contour:[-1.04,0.26,0.52,0.75,0.71],planes:[0.71,0.79,0.83,0.65],eyes:[0.05,0.274,0.337,30,-23,3],nose:[-0.315,0.88,0.085,0.145,0.08],mouth:[-0.675,0.238,0.2,0.1,0.035,0.053,0.034],cheek:[.066,.44,-.24,.28,.25],chin:[.022,.16],brow:[.030,.061,.21],round:.61},
 nico_inventor:{contour:[-0.84,0.31,0.59,0.8,0.78],planes:[0.69,0.78,0.86,0.66],eyes:[0.005,0.298,0.37,34,-29,1],nose:[-0.25,1.01,0.055,0.125,0.09],mouth:[-0.515,0.235,0.7,0.5,0.024,0.037,0.03],cheek:[.101,.46,-.26,.30,.27],chin:[.013,.21],brow:[.037,.040,.22],round:.52},
 ruby_sorceress:{contour:[-1.16,0.24,0.51,0.8,0.73],planes:[0.78,0.8,0.84,0.65],eyes:[0.075,0.253,0.338,21,-17,12],nose:[-0.38,0.91,0.14,0.17,0.076],mouth:[-0.76,0.29,0.05,0.65,0.042,0.061,0.036],cheek:[.030,.50,-.20,.27,.25],chin:[.057,.15],brow:[.032,.089,.21],round:.91,hook:.012},
 flame_guardian:{contour:[-1.16,0.5,0.86,0.84,0.79],planes:[0.93,0.88,0.86,0.71],eyes:[0.06,0.244,0.36,21,-19,3],nose:[-0.405,1.24,0.18,0.205,0.108],mouth:[-0.76,0.34,0.05,0.3,0.024,0.042,0.035],cheek:[.032,.51,-.22,.28,.25],chin:[.093,.34],brow:[.073,.026,.16],round:.78,square:3.0},
 forest_archer_f:{contour:[-0.94,0.28,0.58,0.8,0.73],planes:[0.74,0.8,0.87,0.66],eyes:[0.04,0.265,0.345,26,-20,8],nose:[-0.27,0.98,0.078,0.16,0.088],mouth:[-0.575,0.29,0.85,0.6,0.032,0.05,0.036],cheek:[.090,.47,-.24,.30,.27],chin:[.025,.20],brow:[.037,.057,.18],round:.63},
 forest_archer_m:{contour:[-1.15,0.35,0.66,0.82,0.76],planes:[0.86,0.85,0.88,0.69],eyes:[0.05,0.254,0.36,23,-20,4],nose:[-0.385,1.28,0.145,0.19,0.102],mouth:[-0.77,0.31,0.3,0.6,0.024,0.041,0.033],cheek:[.035,.49,-.21,.28,.25],chin:[.068,.24],brow:[.061,.032,.17],round:.78,square:2.5},
 forest_guard_f:{contour:[-1.06,0.42,0.76,0.79,0.75],planes:[0.8,0.83,0.85,0.68],eyes:[0.045,0.25,0.35,26,-21,3],nose:[-0.34,1.12,0.11,0.17,0.097],mouth:[-0.69,0.29,0.15,0.1,0.03,0.047,0.035],cheek:[.052,.46,-.27,.29,.26],chin:[.054,.29],brow:[.047,.030,.17],round:.67,square:2.7},
 forest_guard_m:{contour:[-1.03,0.43,0.75,0.82,0.76],planes:[0.83,0.84,0.87,0.69],eyes:[0.04,0.26,0.363,26,-22,-1],nose:[-0.325,1.19,0.11,0.18,0.106],mouth:[-0.69,0.32,0.8,0.15,0.025,0.043,0.032],cheek:[.065,.47,-.28,.30,.27],chin:[.058,.29],brow:[.055,.028,.18],round:.59,square:2.7},
 forest_guard_veteran:{contour:[-1.23,0.5,0.85,0.83,0.8],planes:[0.92,0.89,0.85,0.71],eyes:[0.07,0.225,0.358,16,-19,0],nose:[-0.455,1.36,0.19,0.22,0.116],mouth:[-0.825,0.3,-0.2,0.18,0.018,0.035,0.027],cheek:[.018,.51,-.30,.27,.27],chin:[.105,.35],brow:[.082,.019,.16],round:.88,square:3.0,hook:.018,mature:true},
 forest_artificer:{contour:[-1.2,0.26,0.54,0.74,0.72],planes:[0.82,0.81,0.82,0.65],eyes:[0.08,0.237,0.335,19,-20,7],nose:[-0.425,1.05,0.19,0.175,0.09],mouth:[-0.815,0.315,0.15,0.9,0.019,0.034,0.026],cheek:[.025,.48,-.21,.27,.24],chin:[.079,.17],brow:[.058,.057,.19],round:.87,hook:.027},
 forest_princess:{contour:[-0.9,0.31,0.61,0.84,0.76],planes:[0.71,0.79,0.88,0.66],eyes:[0.02,0.288,0.352,32,-26,2],nose:[-0.26,0.9,0.06,0.133,0.085],mouth:[-0.555,0.245,0.65,0.1,0.032,0.052,0.033],cheek:[.107,.46,-.24,.31,.28],chin:[.017,.20],brow:[.031,.055,.21],round:.53},
 bread_baker:{contour:[-1.04,0.47,0.82,0.94,0.79],planes:[0.85,0.88,0.92,0.71],eyes:[0.035,0.26,0.362,27,-23,-2],nose:[-0.325,1.38,0.105,0.215,0.128],mouth:[-0.695,0.35,0.85,0.2,0.029,0.049,0.034],cheek:[.105,.49,-.32,.33,.30],chin:[.051,.32],brow:[.064,.035,.18],round:.56,square:2.6}
};
profiles.bread_vigilante=profiles.bread_baker;
const skulls={feminine_soft:[0.79,0.75,0.8],masculine_soft:[0.84,0.78,0.83],cute_round:[0.87,0.79,0.83],feminine_bold:[0.78,0.8,0.78],old_king:[0.86,0.81,0.84],alchemist_villain:[0.72,0.9,0.76],dwarf_bard:[0.88,0.73,0.84],sad_clown:[0.85,0.77,0.81],orc_warrior:[0.92,0.75,0.89],nana_explorer:[0.86,0.72,0.83],moon_guardian:[0.77,0.82,0.78],nico_inventor:[0.84,0.8,0.81],ruby_sorceress:[0.76,0.83,0.77],flame_guardian:[0.87,0.75,0.85],forest_archer_f:[0.8,0.73,0.8],forest_archer_m:[0.82,0.79,0.82],forest_guard_f:[0.82,0.74,0.8],forest_guard_m:[0.84,0.75,0.81],forest_guard_veteran:[0.86,0.77,0.85],forest_artificer:[0.76,0.82,0.77],forest_princess:[0.84,0.79,0.81],bread_baker:[0.88,0.74,0.84]};
skulls.bread_vigilante=skulls.bread_baker;
export const FACE_IDENTITIES=profiles;

export function refineFaceIdentities(presets){
 for(const [id,f]of Object.entries(profiles)){
  const p=presets[id],[bottom,chin,jaw,cheek,temple]=f.contour,[chinZ,mouthZ,cheekZ,browZ]=f.planes;
  const [rx,ry,rz]=skulls[id],top=p.cran[0]+p.cran[3];p.cran=p.cran.slice();p.cran[0]=top-ry;p.cran[2]=rx;p.cran[3]=ry;p.cran[4]=rz;
  // Silhueta desenhada diretamente: não são multiplicadores do mesmo rosto herdado.
  p.loft={y:[bottom,bottom+.075,bottom+.20,bottom*.64,-.34,-.12,.08,.32],a:[chin*.58,chin,chin*.55+jaw*.45,jaw,cheek,temple,temple*.94,.43],zf:[chinZ-.10,chinZ-.04,chinZ,mouthZ,cheekZ,(cheekZ+browZ)*.5,browZ,.43],zb:[.34,.24,.08,-.13,-.26,-.29,-.30,-.30],n:f.square||2.2,cb:.13,ct:.17,k:.20,blur:.075};
  const [eyeY,Re,eyeX,up,low,tilt]=f.eyes;Object.assign(p,{eyeY,Re,eyeX,openU:deg(up),openL:deg(low),tilt:deg(tilt),openW:deg(62),peakU:-.12,peakL:.10,upperLidPower:f.round,lowerLidPower:f.round*.88,sink:Re*.77,domeK:.10});
  [p.noseTipY,p.noseW,p.noseH,p.tipH,p.tipR]=f.nose;p.sculptedNose=true;p.bridgeBump=f.hook||0;p.alaeX=.070;p.alaeH=p.tipH*.30;
  [p.mouthY,p.mouthW,p.smile,p.smirk,p.lipU,p.lipL,p.lipH]=f.mouth;
  [p.cheekH,p.cheekX,p.cheekY,p.cheekW,p.cheekTall]=f.cheek;[p.chinH,p.chinW]=f.chin;[p.browTh,p.browArch,p.browGap]=f.brow;
  p.cheekH*=.55; // A massa principal agora está no perfil; relevo local apenas amacia a maçã.
  // Pálpebra, órbita e maçã formam volumes largos e contínuos. Evita a crista diagonal sob o olho.
  Object.assign(p,{sculptedFace:true,socket:f.mature?.024:.012,crease:f.mature?.010:.005,creaseGap:.046,orbit:f.mature?.019:.009,lidFold:.006,lowerRoll:.003,zyg:f.mature?.015:.005,hollow:f.mature?.017:.003,temple:.005,browRidge:f.mature?.040:.016,fold:f.mature?.65:.18,muzzle:.022,irisAng:deg(f.mature?29:33),lash:Math.min(p.lash,.015),flick:Math.min(p.flick,.025),lashLen:Math.min(p.lashLen,.060)});
  p.faceIdentity=id==='bread_vigilante'?'bread_baker':id;
 }
 // Vegetais: massas e relações faciais também próprias, preservando as espécies.
 for(const [id,f]of Object.entries({
  frontier_cowboy:{r:[.60,.74,.83,.78,.66],eyeX:.327,Re:.255,openU:deg(19),openL:deg(-25),tilt:deg(-8),browTh:.076,browSlope:.044,mouthY:-.40,mouthW:.385,smile:.60,smirk:.86,cheekH:.055},
  cactus_soldier:{r:[.72,.86,.84,.78,.66],eyeX:.338,Re:.244,openU:deg(22),openL:deg(-22),tilt:deg(5),browTh:.095,browSlope:-.018,mouthY:-.46,mouthW:.310,smile:-.35,smirk:0,cheekH:.072},
  cactus_soldier_large:{r:[.86,.99,.96,.85,.70],eyeX:.373,Re:.229,openU:deg(16),openL:deg(-20),tilt:deg(9),browTh:.118,browSlope:.040,mouthY:-.50,mouthW:.390,smile:-.48,smirk:0,cheekH:.095}
 })){
  const {r,...face}=f,p=presets[id];Object.assign(p,{lathe:{cz:-.04,zs:.88,y:[-1.45,-.85,-.2,.5,1.02],r,top:1.02,rc:.48},neck:[.78,-.65,-.04,-.85,-.04,.24],cran:[.3,-.04,.82,1.05,.72,.72,2],pattern:{...p.pattern,n:10,depth:.047,top:1.3,bot:-1.1,faceFade:.6},spines:{...p.spines,len:.105,r:.013,y0:-.72,y1:1.03,dy:.26},eyeY:.20,peakU:-.12,peakL:.1,upperLidPower:.6,lowerLidPower:.55,browGap:.14,browLen:1.12,skin:'#668f2b',patternColor:['#365b16','#a5bf51'],lidShadow:'#47651f',cheekW:.29,cheekTall:.27,...face,faceIdentity:id});
 }
 Object.assign(presets.cactus_cowboy,{Re:.245,openU:deg(23),openL:deg(-23),upperLidPower:.6,lowerLidPower:.55,browTh:.075,mouthW:.370,smirk:.78,cheekH:.055,cheekW:.29,cheekTall:.25,faceIdentity:'cactus_cowboy'});
 Object.assign(presets.pepper_king,{Re:.250,eyeX:.325,openU:deg(27),openL:deg(-23),upperLidPower:.55,lowerLidPower:.5,browTh:.082,browArch:.044,mouthW:.350,cheekH:.085,cheekW:.30,cheekTall:.28,faceIdentity:'pepper_king'});
 Object.assign(presets.chili_bandit,{Re:.225,eyeX:.265,openU:deg(32),openL:deg(-28),upperLidPower:.6,lowerLidPower:.55,browArch:.080,mouthW:.420,smirk:.85,faceIdentity:'chili_bandit'});
 presets.cactus_cowboy.lathe={...presets.cactus_cowboy.lathe,r:[.61,.66,.69,.65,.57]};
 presets.pepper_king.lathe={...presets.pepper_king.lathe,r:[.42,.43,.55,.78,.95,1.03,1.00,.94,.83]};
 presets.chili_bandit.lathe={...presets.chili_bandit.lathe,r:[.34,.35,.40,.51,.61,.65,.64,.56,.46]};
 for(const id of ['paysandu_wolf','ruby_raven','desert_fennec','cowboy_on_fennec','robot_ball'])presets[id].faceIdentity=id==='cowboy_on_fennec'?'desert_fennec':id;
}
