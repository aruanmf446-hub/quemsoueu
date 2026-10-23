"""Publica capturas reais do catálogo ou de uma seleção, com câmeras iguais."""
import html,json,math,sys,subprocess
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1] if len(sys.argv)>1 else 'renders/reconstrucao')
out=Path(sys.argv[2] if len(sys.argv)>2 else 'revisao');(out/'imagens').mkdir(parents=True,exist_ok=True)
before_label=sys.argv[3] if len(sys.argv)>3 else 'Antes'
after_label=sys.argv[4] if len(sys.argv)>4 else 'Revisão atual'
scope=sys.argv[5] if len(sys.argv)>5 else 'Esta correção ajusta os 23 rostos humanos; o catálogo completo está disponível para conferência.'
code="import {PRESET_ORDER,PRESETS} from './src/presets.js';process.stdout.write(JSON.stringify(PRESET_ORDER.map(id=>({id,label:PRESETS[id].label,family:PRESETS[id].family}))));"
catalog=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],text=True,cwd=Path(__file__).resolve().parent.parent))
assert len(catalog)==34
if len(sys.argv)>6:
 selected=sys.argv[6].split(',');assert len(set(selected))==len(selected)
 catalog=[item for item in catalog if item['id'] in selected]
 assert len(catalog)==len(selected),'Seleção contém personagem desconhecido'
profiles=len(sys.argv)>7 and sys.argv[7]=='profile'
cameras={}
for stage in ['antes','depois']:
 p=root/(stage+'-visual');report=json.loads((p/'relatorio.json').read_text());assert len(report['ids'])==34 and not report['errors']
 cameras[stage]=json.loads((p/'cameras.json').read_text())
face_cameras={stage:json.loads((root/(stage+'-rosto')/'cameras.json').read_text()) for stage in ['antes','depois']}
for stage in ['antes','depois']:
 report=json.loads((root/(stage+'-rosto')/'relatorio.json').read_text());assert len(report['ids'])==34 and not report['errors']
sections=[]
for item in catalog:
 id=item['id'];label=item['label'];view='three'
 dimensions=Image.open(root/'antes-visual'/(id+'-'+view+'.png')).size;assert dimensions[0]==900 and 700<=dimensions[1]<=900
 assert all(math.isclose(a,b,rel_tol=0,abs_tol=1e-10) for key in ['position','target'] for a,b in zip(cameras['antes'][id][view][key],cameras['depois'][id][view][key])),id+': câmera diferente'
 figures=[]
 for stage,title in [('antes',before_label),('depois',after_label)]:
  file=root/(stage+'-visual')/(id+'-'+view+'.png');image=Image.open(file);assert image.size==dimensions
  src='imagens/'+id+'-'+stage+'.webp';image.convert('RGB').save(out/src,format='WEBP',quality=88,method=6)
  assert all(math.isclose(a,b,rel_tol=0,abs_tol=1e-10) for key in ['position','target'] for a,b in zip(face_cameras['antes'][id]['three'][key],face_cameras['depois'][id]['three'][key])),id+': câmera do rosto diferente'
  clay='imagens/'+id+'-'+stage+'-escultura.webp';im=Image.open(root/(stage+'-rosto')/(id+'-malha.png'));assert im.size==dimensions;im.convert('RGB').save(out/clay,format='WEBP',quality=88,method=6)
  profile_attr=''
  if profiles:
   assert all(math.isclose(a,b,rel_tol=0,abs_tol=1e-10) for key in ['position','target'] for a,b in zip(face_cameras['antes'][id]['side'][key],face_cameras['depois'][id]['side'][key])),id+': câmera de perfil diferente'
   profile='imagens/'+id+'-'+stage+'-perfil.webp';im=Image.open(root/(stage+'-rosto')/(id+'-side.png'));assert im.size==dimensions;im.convert('RGB').save(out/profile,format='WEBP',quality=88,method=6)
   profile_attr=f' data-profile="{profile}"'
  figures.append(f'<figure><a href="{src}"><img src="{src}" data-full="{src}" data-clay="{clay}"{profile_attr} width="{dimensions[0]}" height="{dimensions[1]}" loading="lazy" alt="{html.escape(label)} — {html.escape(title)}"></a><figcaption>{html.escape(title)}</figcaption></figure>')
 sections.append(f'<section data-name="{html.escape(label)}"><h2>{html.escape(label)}</h2><div class="pair">'+''.join(figures)+'</div></section>')
page='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão de __COUNT__ personagens — Quem Sou Eu</title><style>*{box-sizing:border-box}body{margin:0;background:#142331;color:#edf5fb;font:16px/1.5 system-ui,sans-serif}header,main{max-width:1400px;margin:auto;padding:24px}header{padding-bottom:8px}h1{font-size:clamp(26px,4vw,40px);line-height:1.15}h2{font-size:23px;margin:0 0 12px}p{color:#c7d6e1;max-width:780px}a{color:#86e3dc}label{display:block;margin:20px 0 5px}input{font:inherit;background:#203b50;color:white;border:1px solid #647f94;border-radius:8px;padding:12px;width:min(100%,500px)}section{margin:12px 0 48px;scroll-margin:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;min-width:0;background:#1b3448;border-radius:12px;overflow:hidden}img{width:100%;height:auto;display:block}figcaption{padding:10px 15px;font-weight:600}section[hidden]{display:none}button{font:inherit;background:#203b50;color:white;border:1px solid #647f94;border-radius:8px;padding:10px 14px;margin:6px 6px 0 0;cursor:pointer}button[aria-pressed=true]{background:#286c70}footer{padding:24px;text-align:center;color:#c7d6e1}@media(max-width:600px){header,main{padding:16px}.pair{gap:6px}figcaption{font-size:14px;padding:8px}section{margin-bottom:30px}}</style></head><body><header><a href="../">Abrir o ateliê</a><h1>Revisão de __COUNT__ personagens</h1><p>Compare as proporções faciais nas duas versões identificadas abaixo. __SCOPE__ As capturas usam a mesma câmera e iluminação. Toque em uma imagem para ampliar.</p><button data-mode="full" aria-pressed="true">Com cabelo</button><button data-mode="clay" aria-pressed="false">Escultura facial</button>__PROFILE__<label for="search">Encontrar personagem</label><input id="search" type="search" placeholder="Nome do personagem" autocomplete="off"><p id="count" aria-live="polite">__COUNT__ personagens</p></header><main>'''+''.join(sections)+'''</main><footer><a href="../">Voltar ao ateliê</a></footer><script>for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',b===button);for(const img of document.querySelectorAll('img')){img.src=img.dataset[button.dataset.mode];img.parentElement.href=img.src}};const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();document.getElementById('search').oninput=e=>{let n=0;const q=normalize(e.target.value);for(const section of document.querySelectorAll('section')){section.hidden=!normalize(section.dataset.name).includes(q);if(!section.hidden)n++}document.getElementById('count').textContent=n+' personagem'+(n===1?'':'s')};</script></body></html>'''
page=page.replace('__SCOPE__',html.escape(scope)).replace('__COUNT__',str(len(catalog)))
page=page.replace('__PROFILE__','<button data-mode="profile" aria-pressed="false">Perfil do queixo</button>' if profiles else '')
(out/'index.html').write_text(page)
(out/'manifesto.json').write_text(json.dumps({'ids':[item['id'] for item in catalog],'images':len(catalog)*(6 if profiles else 4),'profiles':profiles,'before':before_label,'after':after_label},ensure_ascii=False,indent=2))
(root/'catalogo.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
print(f'{out}/index.html: {len(catalog)} personagens, {len(catalog)*(6 if profiles else 4)} capturas WebP com câmera igual.')
