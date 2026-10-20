// A mesma escolha produz a mesma chave, mesmo depois de o usuário aplicá-la.
import {outfitColors} from './clothes.js';
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
