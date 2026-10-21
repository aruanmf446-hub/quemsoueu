// Executa o navegador em lotes pequenos para limitar a memória do SwiftShader.
const {spawnSync}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const script=process.argv[2]||'reino-lua.cjs';
assert(['reino-lua.cjs','refino-renders.cjs','visuais.cjs'].includes(script),'Script de navegador desconhecido');
const ids=process.env.ATELIE_PERSONAGENS?.split(',');assert(ids?.length,'Informe ATELIE_PERSONAGENS');
const size=Math.max(1,Math.min(5,Number(process.env.ATELIE_LOTE)||4));
for(let i=0;i<ids.length;i+=size){
  const chosen=ids.slice(i,i+size);console.log('Lote',Math.floor(i/size)+1,chosen.join(', '));
  const run=spawnSync(process.execPath,[path.join(__dirname,script)],{env:{...process.env,ATELIE_PERSONAGENS:chosen.join(',')},stdio:'inherit'});
  if(run.error)throw run.error;if(run.status!==0)process.exit(run.status||1);
}
console.log('Lotes concluídos:',ids.length,'personagens');
