// Navegação do ateliê: uma categoria e uma decisão por vez.
import {PRESETS} from './presets.js';
import {PreviewCatalog} from './previews.js';

export function mountEditor(api) {
  const el=id=>document.getElementById(id),make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
  document.body.classList.add('editor');
  const shell=document.querySelector('.shell'),sidebar=document.querySelector('.sidebar'),stage=el('stage');
  const header=make('header','app-header'),brand=make('div','app-logo','ATELIÊ');
  brand.append(make('small','','Quem Sou Eu?'));header.append(brand);
  const tabs=make('nav','category-tabs');tabs.setAttribute('aria-label','Categorias');header.append(tabs);shell.prepend(header);
  const nav=make('nav','editor-nav');nav.setAttribute('aria-label','Subcategorias');shell.append(nav);
  const heading=make('div','catalog-heading'),title=make('h2','','Personagem'),trail=make('p','catalog-trail'),hint=make('p','catalog-hint','Compare as prévias. Clique para aplicar.'),unavailable=make('p','catalog-unavailable');heading.append(trail,title,hint,unavailable);sidebar.prepend(heading);
  const gPerson=el('presets').closest('.group'),gExpression=el('exprs').closest('.group'),gCamera=el('download').closest('.group');
  gPerson.id='gPerson';gExpression.id='gExpressions';gCamera.className='stage-controls';gCamera.querySelector('h3').remove();stage.append(gCamera);
  const back=make('button','','Costas');back.id='back';back.onclick=()=>window.__atelie.aim(0,-.05,-7.4);el('threequarters').after(back);
  el('download').textContent='Exportar GLB';el('reset').textContent='Restaurar visual';el('reset').title='Restaurar o visual padrão deste personagem';
  document.querySelector('.brand').replaceChildren(make('div','eyebrow','PERSONAGEM ATUAL'),make('h1','','Seu personagem'));
  document.querySelector('.help').textContent='Arraste para girar · Role para aproximar';
  const groups=[gPerson,el('gBody'),el('gSkin'),el('gHair'),el('gBeard'),el('gClothes'),el('gAcc'),gExpression,el('gMotions')];
  for(const child of [...sidebar.children])if(!groups.includes(child)&&child!==heading)child.hidden=true;
  const configs={
    character:{label:'Personagem',group:'gPerson',subs:api.families.map(f=>({id:f,label:f}))},
    body:{label:'Corpo',group:'gBody',subs:[{id:'type',label:'Tipo físico'},{id:'fine',label:'Ajuste de peso e músculo'}]},
    appearance:{label:'Aparência',subs:[{id:'skin',label:'Pele',group:'gSkin'},{id:'hair',label:'Cabelo',group:'gHair'},{id:'beard',label:'Barba',group:'gBeard'}]},
    clothes:{label:'Roupas',group:'gClothes',subs:[{id:'sets',label:'Conjuntos completos'},...Object.entries(api.slots).map(([id,label])=>({id,label}))]},
    accessories:{label:'Acessórios',group:'gAcc',subs:api.accessories.map(s=>({id:s.id,label:s.label}))},
    motions:{label:'Animações',group:'gMotions',subs:[{id:'shared',label:'Reações e danças'}]},
    expressions:{label:'Expressões',group:'gExpressions',subs:[{id:'ready',label:'Expressões prontas'},{id:'eyes',label:'Olhos e olhar'},{id:'mouth',label:'Boca e sorriso'},{id:'brows',label:'Sobrancelhas'},{id:'auto',label:'Piscar e falar'}]}
  };
  let category='character',sub=api.families[0];const remembered={};
  const previews=new PreviewCatalog(api.getContext);
  // O personagem tem prioridade sobre a fila de miniaturas durante rotação e zoom.
  // Apenas adia novos trabalhos do Worker: resolução, geometria e render ficam iguais.
  let zoomRelease;
  stage.addEventListener('pointerdown',event=>{
    if(event.target===stage.querySelector('canvas'))previews.hold('giro',true);
  });
  const liberarGiro=()=>previews.hold('giro',false);
  window.addEventListener('pointerup',liberarGiro);
  window.addEventListener('pointercancel',liberarGiro);
  window.addEventListener('blur',liberarGiro);
  stage.addEventListener('wheel',()=>{
    previews.hold('zoom',true);
    clearTimeout(zoomRelease);
    zoomRelease=setTimeout(()=>previews.hold('zoom',false),220);
  },{passive:true});
  document.addEventListener('visibilitychange',()=>previews.hold('segundo-plano',document.hidden));
  const colorDetails=make('details','piece-colors'),summary=make('summary','','Cores da peça selecionada');colorDetails.append(summary);el('clothColors').before(colorDetails);colorDetails.append(el('clothColors'));
  function select(cat,section){
    if(!configs[cat])return false;
    const conf=configs[cat],next=section||remembered[cat]||conf.subs[0].id;if(!conf.subs.some(s=>s.id===next))return false;
    const enteringBody=cat==='body'&&category!=='body';
    category=cat;sub=next;remembered[cat]=sub;
    if(enteringBody)api.previewBody();
    if(cat==='clothes'&&sub!=='sets')api.selectSlot(sub);
    sidebar.scrollTop=0;previews.cancelView();api.refresh();api.onLayout();return true;
  }
  for(const [id,c] of Object.entries(configs)){const b=make('button','category-tab',c.label);b.dataset.category=id;b.onclick=()=>select(id);tabs.append(b)}
  function refresh(){
    const conf=configs[category],section=conf.subs.find(s=>s.id===sub);
    title.textContent=section.label;trail.textContent=conf.label+' / '+section.label;
    hint.textContent=category==='motions'?'Escolha o movimento e troque de personagem para comparar.':sub==='fine'?'Arraste para ajustar. As mudanças aparecem no personagem.':sub==='skin'?'Escolha uma cor. Veja o resultado no personagem ao lado.':'Compare as prévias. Clique para aplicar.';
    nav.replaceChildren(make('div','nav-caption',conf.label));
    for(const s of conf.subs){const b=make('button',s.id===sub?'selected':'',s.label);b.dataset.section=s.id;b.setAttribute('aria-current',s.id===sub?'page':'false');b.onclick=()=>select(category,s.id);nav.append(b)}
    tabs.querySelectorAll('button').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active)});
    const visible=section.group||conf.group;groups.forEach(g=>g.hidden=g.id!==visible);
    for(const b of el('presets').children){b.hidden=b.classList.contains('fam')||b.dataset.family!==sub;if(b.dataset.preset)b.setAttribute('aria-pressed',b.classList.contains('active'))}
    el('bodyBuilds').hidden=category!=='body'||sub!=='type';
    el('gBody').querySelectorAll('.ctrl').forEach(n=>n.hidden=sub!=='fine');
    el('bodyHint').hidden=sub!=='fine';
    el('outfits').hidden=sub!=='sets';el('clothSlots').hidden=true;
    el('clothSlots').previousElementSibling.hidden=true;
    el('clothPieces').hidden=sub==='sets';colorDetails.hidden=sub==='sets'||!el('clothColors').childElementCount;
    el('clothesHint').hidden=!el('gClothes').classList.contains('off');
    el('accs').querySelectorAll('[data-acc-slot]').forEach(n=>n.hidden=n.dataset.accSlot!==sub);
    el('exprs').hidden=sub!=='ready';
    gExpression.querySelector('.toggles').hidden=sub!=='auto';
    for(const n of el('poseCtrls').children){const id=n.querySelector('input').id.slice(2),section=id.startsWith('brow')?'brows':['lookX','lookY','blinkL','blinkR','wide','squint'].includes(id)?'eyes':'mouth';n.hidden=section!==sub}
    const context=api.getContext(),robot=context.id==='robot_ball',vegetal=PRESETS[context.id].family==='Vegetais';
    const companion=PRESETS[context.id].kind==='companion';
    const unsupported=companion&&(['body','clothes'].includes(category)||category==='appearance'&&['hair','beard'].includes(sub))||robot&&!['character','expressions','motions'].includes(category)||vegetal&&category==='appearance'&&sub==='beard';
    unavailable.hidden=!unsupported;unavailable.textContent=companion?'Este companheiro tem uma malha própria. Troque a pelagem em Aparência → Pele, o equipamento em Acessórios → Cabeça e as expressões em Expressões.':robot?'O robô usa o próprio casco. Personalize suas expressões ou escolha outro personagem.':'Este personagem mantém o bigode e os detalhes do seu modelo original.';
    if(unsupported)el(visible).hidden=true;
    document.querySelector('.brand h1').textContent=document.querySelector(`[data-preset="${context.id}"] b`)?.textContent||'Seu personagem';
    previews.refresh(sidebar);
  }
  refresh();
  return {select,refresh,sections:()=>Object.fromEntries(Object.entries(configs).map(([id,c])=>[id,c.subs.map(s=>s.id)])),accessorySlot:()=>category==='accessories'?sub:null,state:()=>({category,sub}),previews};
}
