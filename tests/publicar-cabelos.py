"""Galeria da reconstrução dos cabelos, com câmeras fixas."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json
from PIL import Image

root=Path(__file__).resolve().parents[1]
r=root/'renders/cabelos-reconstruidos'
out=root/'revisao/cabelos'
out.mkdir(parents=True,exist_ok=True)
catalog=json.loads((root/'renders/pelos-catalogo/catalogo.json').read_text())
by_id={row['id']:row for row in catalog}
order=['nana_explorer','nico_inventor','bread_vigilante']+[row['id'] for row in catalog if row['id'] not in ['nana_explorer','nico_inventor','bread_vigilante']]
before=json.loads((r/'antes/cameras.json').read_text());after=json.loads((r/'depois/cameras.json').read_text())
assert len(before)==len(after)==34
jobs=[];assets=[];back_ids=[]
def pair(id,view,label):
    for field in ['position','target']:
        assert all(abs(a-b)<1e-10 for a,b in zip(before[id][view][field],after[id][view][field])),(id,view,'câmera diferente')
    result=f'<h3>{label}</h3><div class="pair">'
    for stage,caption in [('antes','Antes · 341259b'),('depois','Revisão atual')]:
        name=f'{stage}-{id}-{view}.webp';assets.append(name);jobs.append((r/stage/f'{id}-{view}.png',out/name))
        result+=f'<figure><a href="{name}"><img width="900" height="806" loading="lazy" src="{name}" alt="{by_id[id]["label"]}: {caption}"></a><figcaption>{caption}</figcaption></figure>'
    return result+'</div>'
sections=[]
for id in order:
    row=by_id[id];s=f'<section data-name="{row["label"].lower()}"><h2>{row["label"]}</h2>'+pair(id,'three','Cabelo em 3/4')
    if 'back' in after[id] and (r/'antes'/f'{id}-back.png').exists():
        back_ids.append(id);s+='<details><summary>Ver a cobertura do cabelo nas costas</summary>'+pair(id,'back','Costas e nuca')+'</details>'
    sections.append(s+'</section>')
assert len(back_ids)==14 and len(assets)==96
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reconstrução dos cabelos — catálogo</title><style>
*{box-sizing:border-box}body{margin:0;background:#142331;color:#edf5fb;font:16px/1.5 system-ui}main{max-width:1250px;margin:auto;padding:24px}h1{font-size:clamp(25px,4vw,38px);line-height:1.2}h2{font-size:25px}h3{font-size:16px;color:#bed0db}p{max-width:850px;color:#bed0db}a,summary{color:#57dcd0}input{font:inherit;padding:12px;background:#203b50;color:white;border:1px solid #647f94;border-radius:8px;width:min(100%,450px)}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;border-radius:12px;overflow:hidden;background:#203b50}img{display:block;width:100%;height:auto}figcaption{padding:12px;font-weight:600}section{margin:40px 0}section[hidden]{display:none}details{margin-top:16px}summary{cursor:pointer;padding:10px 0}@media(max-width:600px){main{padding:14px}.pair{gap:7px}figcaption{font-size:12px;padding:8px}}
</style><main><a href="../../">Abrir o ateliê</a> · <a href="../pelos/">Cabelos e barbas</a><h1>Reconstrução dos cabelos — 34 personagens</h1><p>As mechas agora acompanham a superfície externa entre os pontos de controle e cobrem também a nuca. Raízes e camadas foram refeitas; a Nana recebeu um rabo com queda em cachos e o Nico recebeu novas guias de cabelo curto. Rostos, barbas, proporções, roupas e iluminação preservados. Comparações na mesma câmera, com 14 exemplos adicionais de costas. Personagens sem cabelo aparecem como controle preservado.</p><label for="search">Encontrar personagem</label><br><input id="search" type="search" placeholder="Nome do personagem">SECTIONS</main><script>const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();document.getElementById('search').oninput=e=>document.querySelectorAll('section').forEach(s=>s.hidden=!normalize(s.dataset.name).includes(normalize(e.target.value)));</script></html>'''.replace('SECTIONS',''.join(sections))
def convert(job):
    image,target=job
    with Image.open(image) as im:
        assert im.size==(900,806)
        im.save(target,quality=90,method=6)
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(convert,jobs))
(out/'index.html').write_text(page)
(out/'manifest.json').write_text(json.dumps({'base':'341259b','characters':order,'backCharacters':back_ids,'assets':assets},ensure_ascii=False,indent=2))
print('34 personagens, 14 vistas de costas, 96 imagens; câmeras idênticas.')
