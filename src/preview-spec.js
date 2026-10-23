// A mesma escolha produz a mesma chave, mesmo depois de o usuário aplicá-la.
import {outfitColors} from './clothes.js';
// O cartão pode ser maior que os antigos 240 px ou quadrado no celular.
// O tamanho entra na chave: uma imagem pequena não substitui uma prévia de tela densa.
export function previewSize(width=240,height=288,dpr=1){
  width=Number.isFinite(width)&&width>0?width:240;height=Number.isFinite(height)&&height>0?height:288;
  dpr=Number.isFinite(dpr)?Math.min(2,Math.max(1,dpr)):1;
  const w=Math.min(640,Math.max(320,Math.ceil(width*dpr/64)*64));
  return {width:w,height:Math.round(w*Math.min(1.5,Math.max(.75,height/width)))};
}
export function previewChoice({id,look,spec}) {
  look=structuredClone(look);
  switch(spec.kind){
    case 'character':id=spec.value;break;
    case 'build':look.build=spec.value;break;
    case 'hair':look.hair=spec.value;break;
    case 'beard':look.beard=spec.value;break;
    case 'outfit':look.outfit=spec.value;look.clothColors=outfitColors(spec.value);look.pieces={};look.pieceColors={};break;
    case 'piece':look.pieces={...look.pieces,[spec.slot]:spec.value};look.pieceColors={...look.pieceColors,[spec.slot]:outfitColors(spec.value.split(':')[0])};break;
    case 'accessory':look.acc={...look.acc};if(spec.value)look.acc[spec.slot]=spec.value;else delete look.acc[spec.slot];break;
  }
  const close=['hair','beard','accessory','expression'].includes(spec.kind);
  return {id,look,frame:close?'head':'body',expression:spec.kind==='expression'?spec.value:null};
}
