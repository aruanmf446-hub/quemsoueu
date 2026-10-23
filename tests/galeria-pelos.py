"""Galeria de qualidade: exige 34 personagens, câmeras iguais e as três vistas."""
import json,sys,html,math,subprocess
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else 'renders/pelos')
if not (root/'catalogo.json').exists():
 code="""import {PRESET_ORDER,PRESETS} from './src/presets.js';import {defaultLook,HAIR_STYLES,ACCESSORIES} from './src/look.js';process.stdout.write(JSON.stringify(PRESET_ORDER.map(id=>{const look=defaultLook(id);return{id,label:PRESETS[id].label,hair:look.hair,hairLabel:HAIR_STYLES[look.hair].label,beard:look.beard||'default',accessories:Object.values(look.acc||{}).filter(Boolean).map(key=>ACCESSORIES[key]?.label||key)}}),null,2));"""
 (root/'catalogo.json').write_text(subprocess.check_output(['node','--input-type=module','-e',code],cwd=Path(__file__).resolve().parent.parent,text=True))
catalog=json.loads((root/'catalogo.json').read_text())
a=json.loads((root/'antes/cameras.json').read_text());b=json.loads((root/'depois/cameras.json').read_text())
assert len(catalog)==len(a)==len(b)==34
for stage in ['antes','depois']: assert not json.loads((root/stage/'relatorio.json').read_text())['errors']
sections=[]
for r in catalog:
 id=r['id'];pairs=[]
 for view,label in [('front','Frente'),('three','Três quartos'),('back','Costas')]:
  assert all(math.isclose(x,y,rel_tol=0,abs_tol=1e-10) for key in ['position','target'] for x,y in zip(a[id][view][key],b[id][view][key])),f'Câmera mudou: {id}/{view}'
  images=[]
  for stage,title in [('antes','Antes'),('depois','Depois')]:
   src=f'{stage}/{id}-{view}.png';data=(root/src).read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';assert int.from_bytes(data[16:20],'big')==900
   images.append(f'<figure><a href="{src}"><img loading="lazy" src="{src}" width="900" height="900" alt="{html.escape(title+": "+r["label"])}"></a><figcaption>{title}</figcaption></figure>')
  pairs.append(f'<div class="pair" data-view="{view}"'+(' hidden' if view!='three' else '')+'>'+''.join(images)+'</div>')
 extra=[]
 if (root/'antes'/f'{id}-full.png').exists() and (root/'depois'/f'{id}-full.png').exists():
  assert all(math.isclose(x,y,rel_tol=0,abs_tol=1e-10) for key in ['position','target'] for x,y in zip(a[id]['full'][key],b[id]['full'][key]))
  extra.append('<details><summary>Comprimento e pontas — costas</summary><div class="pair">'+''.join(f'<figure><a href="{stage}/{id}-full.png"><img loading="lazy" src="{stage}/{id}-full.png" alt="{title}: comprimento"><figcaption>{title}</figcaption></a></figure>' for stage,title in [('antes','Antes'),('depois','Depois')])+'</div></details>')
 poses=[(key,label) for key,label in [('feliz','Sorriso'),('surpreso','Surpresa'),('beijo','Beijo')] if (root/'depois'/f'{id}-pose-{key}.png').exists()]
 if poses: extra.append('<details><summary>Barba durante as expressões — depois</summary><div class="pair">'+''.join(f'<figure><a href="depois/{id}-pose-{key}.png"><img loading="lazy" src="depois/{id}-pose-{key}.png" alt="{label}"><figcaption>{label}</figcaption></a></figure>' for key,label in poses)+'</div></details>')
 sections.append(f'<section data-search="{html.escape((r["label"]+" "+r["hairLabel"]).lower())}"><h2>{html.escape(r["label"])}</h2><p>{html.escape(r["hairLabel"])} · {html.escape(", ".join(r["accessories"]) or "Sem acessórios")}</p>'+''.join(pairs)+''.join(extra)+'</section>')
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cabelos, barbas e acessórios — comparação</title><style>body{background:#142331;color:#eff6fa;font:16px system-ui;margin:24px}header{position:sticky;top:0;background:#142331ed;padding:10px 0;z-index:2}button,input{padding:12px;border-radius:8px;border:1px solid #537184;background:#233c4e;color:white;margin:4px}button[aria-pressed=true]{background:#287b80}.pair{display:flex;gap:12px}.pair[hidden],section[hidden]{display:none}section{margin:36px 0}figure{margin:0;flex:1;min-width:0}img{width:100%;height:auto;border-radius:12px}figcaption{padding:8px}p{color:#bfced7}a{color:#60e1d5}h1{font-size:26px}@media(max-width:650px){body{margin:12px}.pair{display:block}figure{margin:12px 0}}</style><header><h1>Cabelos, barbas e acessórios — 34 personagens</h1><p>Mesma câmera e iluminação. Os modelos e penteados existentes foram mantidos. Clique nas imagens para ampliar.</p><input type="search" id="search" placeholder="Buscar personagem ou penteado" aria-label="Buscar personagem"><button data-choice="front" aria-pressed="false">Frente</button><button data-choice="three" aria-pressed="true">Três quartos</button><button data-choice="back" aria-pressed="false">Costas</button></header>'''+''.join(sections)+'''<script>document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',x===b));document.querySelectorAll('[data-view]').forEach(x=>x.hidden=x.dataset.view!==b.dataset.choice)});document.getElementById('search').oninput=e=>{const s=e.target.value.toLowerCase();document.querySelectorAll('section').forEach(x=>x.hidden=!x.dataset.search.includes(s))};</script></html>'''
(root/'index.html').write_text(page)
print('Galeria: 34 personagens, 102 pares, câmeras idênticas.')
