// Catálogo real, equipamento separado/montado, Worker e exportação das novas skins.
const path=require('node:path');
process.env.ATELIE_PERSONAGENS||='frontier_cowboy,bread_baker,bread_vigilante,cactus_soldier,cactus_soldier_large,desert_fennec,cowboy_on_fennec';
process.env.ATELIE_RENDERS||=path.resolve(__dirname,'../renders/deserto');
process.env.ATELIE_TITULO='Deserto e duas identidades';
require('./reino-lua.cjs');
