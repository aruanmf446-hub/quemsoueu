// Prévias locais: imagens procedurais em segundo plano, sem mudar a cena principal.
import {FRONTIER_CHARACTERS,FRONTIER_COMPANIONS} from './frontier.js';
import {FOREST_CHARACTERS} from './forest.js';
import {previewChoice,previewSize} from './preview-spec.js';
const VERSION='menu-v30-arqueira-individual';
const FRONTIER=new Set([...FRONTIER_CHARACTERS.map(c=>c.id),...FRONTIER_COMPANIONS]);
const FOREST=new Set(FOREST_CHARACTERS.map(c=>c.id));
const LUNAR=new Set(['nana_explorer','moon_guardian','nico_inventor','ruby_sorceress','paysandu_wolf','ruby_raven']);
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);

export class PreviewCatalog {
  constructor(getContext){
    this.getContext=getContext;this.paused=false;this.holds=new Set();this.cache=new Map();this.queue=new Map();this.targets=new Map();this.running=null;this.worker=null;this.ready=false;this.failed=false;this.serial=0;
    this.observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){this.observer.unobserve(e.target);this.request(e.target)}},{rootMargin:'160px'});
    this.db=typeof indexedDB==='undefined'?Promise.resolve(null):new Promise(resolve=>{const r=indexedDB.open('atelie-previas',1);r.onupgradeneeded=()=>r.result.createObjectStore('imagens');r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)});
  }
  refresh(root){
    if(this.paused)return;
    this.cancelView();
    // A skin desta atualização é a mesma para todos os cartões, salvo os personagens com visual próprio.
    const context=this.getContext();
    for(const button of root.querySelectorAll('[data-preview]')){
      if(button.closest('[hidden]')||button.closest('.off'))continue;
      let frame=button.querySelector('.preview-frame');
      if(!frame){
        frame=document.createElement('figure');frame.className='preview-frame loading';const wait=document.createElement('div');wait.className='preview-wait';wait.textContent='Gerando prévia…';frame.append(wait);
        // Chips tinham apenas texto; preservamos o rótulo fora da imagem.
        for(const n of [...button.childNodes])if(n.nodeType===Node.TEXT_NODE){const label=document.createElement('b');label.className='preview-label';label.textContent=n.textContent;n.replaceWith(label)}
        button.prepend(frame);
      }
      const spec=JSON.parse(button.dataset.preview);
      // Os personagens mostram o visual salvo de cada um; as outras opções usam a skin atual.
      const size=frame.getBoundingClientRect(),request={...context,spec,imageSize:previewSize(size.width,size.height,globalThis.devicePixelRatio)};if(spec.kind==='character')request.look=window.__atelie.savedLook(spec.value);
      // O enquadramento novo dos brincos invalida somente as quatro miniaturas desse slot.
      const alvo=spec.kind==='character'?spec.value:context.id;
      const versao=alvo==='chili_bandit'?'boca-aberta-2':FRONTIER.has(alvo)?'deserto-heroi-4':FOREST.has(spec.kind==='character'?spec.value:context.id)?'floresta-heroi-4':LUNAR.has(spec.kind==='character'?spec.value:context.id)?'reino-lua-heroi-3':spec.kind==='accessory'&&spec.slot==='ears'?'menu-v2-orelhas':VERSION;
      const key=VERSION+':'+versao+':'+stable({...previewChoice(request),imageSize:request.imageSize});button._preview={key,request};
      if(frame.dataset.key!==key){frame.dataset.key=key;frame.replaceChildren(Object.assign(document.createElement('div'),{className:'preview-wait',textContent:'Gerando prévia…'}));frame.classList.add('loading');delete frame.dataset.ready}
      if(this.cache.has(key))this.display(button,key,this.cache.get(key));else this.observer.observe(button);
    }
    this.prune();
  }
  display(button,key,url){
    if(!button.isConnected||button._preview?.key!==key)return;
    const frame=button.querySelector('.preview-frame'),img=document.createElement('img');img.src=url;img.alt='Prévia: '+JSON.parse(button.dataset.preview).label;img.decoding='async';
    frame.classList.remove('loading');frame.replaceChildren(img);frame.dataset.ready='true';
  }
  async request(button){
    const {key,request}=button._preview||{};if(!key||this.paused)return;
    if(!this.targets.has(key))this.targets.set(key,new Set());this.targets.get(key).add(button);
    if(this.cache.has(key)){this.display(button,key,this.cache.get(key));return}
    const db=await this.db;
    const cached=db?await new Promise(resolve=>{try{const r=db.transaction('imagens').objectStore('imagens').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch{resolve(null)}}):null;
    if(cached){this.complete(key,cached);return}
    if(this.paused||!button.isConnected||button._preview?.key!==key||button.closest('[hidden]'))return;
    if(this.failed){this.unavailable(button);return}
    if(this.running?.key!==key)this.queue.set(key,request);
    this.start();this.pump();
  }
  start(){
    if(this.worker||this.failed)return;
    if(!globalThis.Worker||!globalThis.OffscreenCanvas){this.fail('Prévias indisponíveis neste navegador.');return}
    // Workers ainda não leem o import map. Resolvemos o mesmo grafo de módulos em memória.
    // Não há compilação, arquivos gerados nem dependências além do Three.js já usado pelo site.
    const bootstrap=`onmessage=async({data})=>{
      const imports=data.imports,loaded=new Map(),urls=[];
      function resolve(s,base){if(imports[s])return imports[s];for(const k of Object.keys(imports))if(k.endsWith('/')&&s.startsWith(k))return imports[k]+s.slice(k.length);const url=new URL(s,base);if(url.origin===new URL(data.entry).origin)url.searchParams.set('v',data.version);return url.href}
      async function load(url){
        if(url.includes('/build/three.'))return url;
        if(loaded.has(url))return loaded.get(url);
        const promise=(async()=>{const response=await fetch(url);if(!response.ok)throw Error('Não foi possível carregar '+url);let source=await response.text();
          const matches=[...source.matchAll(/^([ \t]*(?:import|export)\\s+(?:[^;'\"]*?\\s+from\\s*)?)(['\"])([^'\"\\n]+)\\2/gm)];
          const deps=await Promise.all(matches.map(m=>load(resolve(m[3],url))));
          for(let i=matches.length-1;i>=0;i--){const m=matches[i],replacement=m[1]+m[2]+deps[i]+m[2];source=source.slice(0,m.index)+replacement+source.slice(m.index+m[0].length)}
          const blob=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));urls.push(blob);return blob})();loaded.set(url,promise);return promise;
      }
      try{await import(await load(data.entry));urls.forEach(URL.revokeObjectURL);postMessage({type:'ready'})}catch(error){postMessage({type:'fatal',message:error.message})}
    };`;
    const url=URL.createObjectURL(new Blob([bootstrap],{type:'text/javascript'})),worker=new Worker(url,{type:'module',name:'Prévias do ateliê'});this.worker=worker;this.bootstrapURL=url;
    worker.onerror=e=>{e.preventDefault();if(this.worker===worker)this.fail(e.message)};
    worker.onmessage=({data})=>{
      if(this.worker!==worker)return;
      if(data.type==='ready'){URL.revokeObjectURL(this.bootstrapURL);this.ready=true;this.pump();return}
      if(data.type==='fatal'){this.fail(data.message);return}
      const job=this.running;this.running=null;
      if(job){if(data.blob)this.complete(job.key,data.blob);else{for(const b of this.targets.get(job.key)||[])this.unavailable(b);this.targets.delete(job.key);console.warn('Prévia não gerada:',data.message)}}
      this.pump();
    };
    const imports=JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports;
    const entry=new URL('./preview-worker.js',import.meta.url);entry.searchParams.set('v',VERSION);this.worker.postMessage({entry:entry.href,imports,version:VERSION});
  }
  // Enquanto o jogador gira/aproxima o personagem, a fila espera; nenhum detalhe 3D é simplificado.
  hold(reason,enabled){
    if(this.paused)return;
    if(enabled)this.holds.add(reason);else this.holds.delete(reason);
    if(!this.holds.size)this.pump();
  }
  pump(){if(!this.ready||this.running||!this.queue.size||this.holds.size)return;const [key,request]=this.queue.entries().next().value;this.queue.delete(key);this.running={key};this.worker.postMessage(request)}
  complete(key,blob){
    if(!this.cache.has(key))this.cache.set(key,URL.createObjectURL(blob));
    for(const b of this.targets.get(key)||[])this.display(b,key,this.cache.get(key));this.targets.delete(key);this.queue.delete(key);
    this.db.then(db=>{if(!db)return;try{const tx=db.transaction('imagens','readwrite'),store=tx.objectStore('imagens');store.put(blob,key);const count=store.count();count.onsuccess=()=>{let excess=count.result-240;if(excess<=0)return;const cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c&&excess-->0){c.delete();c.continue()}}}}catch{/* Cache indisponível não impede a edição. */}});
    this.prune();
  }
  prune(){
    const visible=new Set([...document.querySelectorAll('.preview-frame[data-ready="true"]')].map(n=>n.dataset.key));
    for(const [key,url]of this.cache){if(this.cache.size<=100)break;if(!visible.has(key)){URL.revokeObjectURL(url);this.cache.delete(key)}}
  }
  cancelView(){this.queue.clear();this.targets.clear();this.observer.disconnect()}
  pause(){this.paused=true;this.holds.clear();this.cancelView();this.worker?.terminate();this.worker=null;this.ready=false;this.running=null;if(this.bootstrapURL)URL.revokeObjectURL(this.bootstrapURL)}
  unavailable(button){if(!button.isConnected)return;const f=button.querySelector('.preview-frame');f.classList.remove('loading');f.replaceChildren(Object.assign(document.createElement('div'),{className:'preview-wait',textContent:'Prévia indisponível. Clique para aplicar no personagem.'}))}
  fail(message){this.failed=true;this.ready=false;this.worker?.terminate();this.worker=null;console.warn('Prévias:',message);for(const set of this.targets.values())for(const b of set)this.unavailable(b);this.queue.clear();this.targets.clear()}
  stats(){return {cached:this.cache.size,queued:this.queue.size,running:!!this.running,ready:this.ready,failed:this.failed,waitingForInteraction:this.holds.size>0}}
}
