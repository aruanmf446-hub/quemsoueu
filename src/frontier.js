// Novas referências do deserto: identidades separadas, figurinos e combinação de montaria.
export const FRONTIER_CHARACTERS=[
  {id:'frontier_cowboy',label:'Cowboy do deserto',base:'cactus_cowboy',body:'cactus_cowboy',outfit:'frontier_cowboy',hair:'none',acc:{head:'frontier_hat'}},
  {id:'bread_baker',label:'Padeiro',base:'masculine_soft',body:'masculine_soft',outfit:'bread_baker',hair:'short_curls',acc:{head:'chef_hat'}},
  {id:'bread_vigilante',label:'Vigilante',base:'masculine_soft',body:'masculine_soft',outfit:'bread_vigilante',hair:'short_curls',acc:{head:'vigilante_hood'}},
  {id:'cactus_soldier',label:'Soldado cacto',base:'cactus_cowboy',body:'cactus_cowboy',outfit:'cactus_guard',hair:'none',acc:{head:'guard_helmet'}},
  {id:'cactus_soldier_large',label:'Soldado cacto grande',base:'cactus_cowboy',body:'cactus_cowboy',large:true,outfit:'cactus_guard',hair:'none',acc:{head:'guard_helmet'}}
];
export const FRONTIER_OUTFITS={
  frontier_cowboy:{label:'Cowboy do deserto',sub:'Colete, lenço vermelho, poncho e equipamento de viagem'},
  bread_baker:{label:'Padeiro',sub:'Camisa branca, avental, faixa laranja e pão'},
  bread_vigilante:{label:'Vigilante',sub:'Túnica escura, manto e detalhes de âmbar'},
  cactus_guard:{label:'Guarda do deserto',sub:'Armadura vermelha e dourada, capa, escudo e lança'}
};
export const FRONTIER_COLORS={
  frontier_cowboy:{fabric:'#6e4930',secondary:'#e4d6b5',accent:'#963b2c',pants:'#342f2b',leather:'#573a26',trim:'#c29b50'},
  bread_baker:{fabric:'#eee5d3',secondary:'#f3ecde',accent:'#c7662f',pants:'#e1d6bf',leather:'#49342b',trim:'#b78e47'},
  bread_vigilante:{fabric:'#25232a',secondary:'#353038',accent:'#ad4c24',pants:'#25252b',leather:'#3d302b',trim:'#b68b43'},
  cactus_guard:{fabric:'#a32c2a',secondary:'#b43a30',accent:'#8d2427',pants:'#4d3027',leather:'#65452c',trim:'#d2a341'}
};
export const FRONTIER_COMPANIONS=['desert_fennec','cowboy_on_fennec'];
