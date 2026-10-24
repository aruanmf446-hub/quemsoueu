"""Compara acabamento dos cabelos sem redesenhar os penteados."""
from pathlib import Path
from PIL import Image
import json,html
root=Path(__file__).resolve().parents[1]
out=root/'revisao/acabamento-cabelo'
out.mkdir(parents=True,exist_ok=True)
ids=['nana_explorer','nico_inventor','forest_archer_f','moon_guardian','feminine_bold','old_king']
labels={r['id']:r['label'] for r in json.loads((root/'renders/pelos-catalogo/catalogo.json').read_text())}
css=(root/'revisao/cabelos-jogo/index.html').read_text().split('<style>')[1].split('</style>')[0]
sections=[];assets=[]
for id in ids:
    capture='piloto' if id in ids[:4] else 'exemplos'
    previous=root/('renders/cabelo-acabamento/antes-complemento' if id in ['moon_guardian','feminine_bold'] else 'renders/cabelos-jogo/piloto')
    current=root/'renders/cabelo-acabamento'/capture
    a=json.loads((previous/'cameras.json').read_text())[id]['three']
    b=json.loads((current/'cameras.json').read_text())[id]['three']
    assert a==b,(id,'Câmera diferente')
    content=f'<section data-name="{html.escape(labels[id])}"><h2>{html.escape(labels[id])}</h2><div class="pair">'
    for prefix,source,caption in [('antes',previous/f'{id}-three.png','Antes · 4920be1'),('depois',current/f'{id}-three.png','Acabamento atual')]:
        name=f'{prefix}-{id}.webp'
        with Image.open(source) as image:
            assert image.size==(900,806)
            image.save(out/name,quality=90,method=6)
        assets.append(name)
        content+=f'<figure><a href="{name}"><img src="{name}" width="900" height="806" loading="lazy" alt="{html.escape(labels[id])}: {caption}"></a><figcaption>{caption}</figcaption></figure>'
    content+='</div><h3>Corpo inteiro — acabamento atual</h3>'
    name=f'jogo-{id}.webp'
    with Image.open(root/'renders/cabelo-acabamento/jogo'/f'{id}-body-three.png') as image:image.save(out/name,quality=90,method=6)
    assets.append(name)
    content+=f'<figure style="max-width:550px"><a href="{name}"><img src="{name}" width="900" height="806" loading="lazy" alt="{html.escape(labels[id])}: corpo inteiro"></a><figcaption>Vista atual no editor com corpo inteiro</figcaption></figure></section>'
    sections.append(content)
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acabamento dos cabelos</title><style>CSS</style><main><a href="../../">Abrir o ateliê</a> · <a href="../cabelos-jogo/">Rodada anterior</a><h1>Acabamento dos cabelos</h1><p>Correção compartilhada dos penteados existentes: menor relevo das mechas, textura direcional discreta e reflexos suavizados. Seis exemplos em close e com corpo inteiro no editor. Rostos, proporções, roupas, acessórios e iluminação preservados. As imagens são capturas reais; a comparação em close usa câmeras idênticas.</p><label for="search">Encontrar personagem</label><br><input id="search" type="search" placeholder="Nome do personagem">SECTIONS</main><script>const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();document.getElementById('search').oninput=e=>document.querySelectorAll('section').forEach(s=>s.hidden=!normalize(s.dataset.name).includes(normalize(e.target.value)));</script></html>'''
(out/'index.html').write_text(page.replace('CSS',css).replace('SECTIONS',''.join(sections)))
(out/'manifest.json').write_text(json.dumps({'base':'4920be1','characters':ids,'assets':assets},ensure_ascii=False,indent=2))
print('Seis exemplos, 18 imagens, câmeras de close idênticas.')
