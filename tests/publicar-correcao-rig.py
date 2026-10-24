"""Compara o mesmo instante e câmera da comemoração, antes/depois da correção do rig."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
r=root/'renders/rig-correcao';out=root/'revisao/correcao-rig'
out.mkdir(parents=True,exist_ok=True)
rows=[('nico_inventor','Nico inventor'),('nana_explorer','Nana exploradora'),('sad_clown','Palhaço')]
before=json.loads((r/'antes/cameras.json').read_text());after=json.loads((r/'depois-final/cameras.json').read_text())
sections=[];assets=[]
for id,label in rows:
    key=id+'-victory-2.22';assert before[key]==after[key],id+': câmera diferente'
    content=f'<section><h2>{label}</h2><div class="pair">'
    for folder,prefix,caption in [('antes','antes','Antes · 857cbdb'),('depois-final','depois','Pesos corrigidos')]:
        name=f'{prefix}-{id}.webp'
        with Image.open(r/folder/f'{key}.png') as image:
            assert image.size==(900,806)
            image.save(out/name,quality=90,method=6)
        assets.append(name)
        content+=f'<figure><a href="{name}"><img src="{name}" width="900" height="806" loading="lazy" alt="{label}: {caption}"></a><figcaption>{caption}</figcaption></figure>'
    sections.append(content+f'</div><p><a href="../../?v=pesos-continuos-1&amp;personagem={id}&amp;animacao=victory">Testar a comemoração no personagem</a></p></section>')
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Correção da deformação do rig</title><style>*{box-sizing:border-box}body{margin:0;background:#142331;color:#edf5fb;font:16px/1.5 system-ui}main{max-width:1200px;margin:auto;padding:24px}h1{font-size:clamp(26px,4vw,38px);line-height:1.2}p{max-width:850px;color:#bed0db}a{color:#57dcd0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;border-radius:12px;overflow:hidden;background:#203b50}img{display:block;width:100%;height:auto}figcaption{padding:12px;font-weight:600}section{margin:40px 0}@media(max-width:600px){main{padding:14px}.pair{gap:7px}figcaption{font-size:12px;padding:8px}}</style><main><a href="../../">Abrir o ateliê</a><h1>Correção da deformação do rig</h1><p>Comparação da comemoração aos 2,22 segundos, na mesma câmera e iluminação. Corrigida a distribuição brusca de pesos entre tronco e braços, que criava pontas nas axilas e puxava roupas. A correção compartilhada foi aplicada ao catálogo; estes três exemplos mostram o problema reproduzido. Rostos e geometrias das skins em pose A preservados.</p>SECTIONS</main></html>'''.replace('SECTIONS',''.join(sections))
(out/'index.html').write_text(page)
(out/'manifest.json').write_text(json.dumps({'base':'857cbdb','time':2.22,'motion':'victory','characters':[x[0] for x in rows],'assets':assets},indent=2))
print('OK: três comparações, seis imagens, mesma câmera e instante.')
