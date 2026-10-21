// Mesma regressão de catálogo e GLB aplicada às sete referências da floresta.
const path=require('node:path');
process.env.ATELIE_PERSONAGENS||='forest_archer_f,forest_archer_m,forest_guard_f,forest_guard_m,forest_guard_veteran,forest_artificer,forest_princess';
process.env.ATELIE_RENDERS||=path.resolve(__dirname,'../renders/floresta');
process.env.ATELIE_TITULO='Floresta';
require('./reino-lua.cjs');
