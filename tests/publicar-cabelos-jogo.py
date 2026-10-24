"""Publica exemplos reais da adaptação dos cabelos para jogo; sem alterar a galeria histórica."""
from pathlib import Path
from PIL import Image
import json
import html

root=Path(__file__).resolve().parents[1]
ids=['nana_explorer','nico_inventor','bread_vigilante','forest_archer_f','masculine_soft','moon_guardian','feminine_soft','feminine_bold','old_king']
labels={r['id']:r['label'] for r in json.loads((root/'renders/pelos-catalogo/catalogo.json').read_text())}
out=root/'revisao/cabelos-jogo'
out.mkdir(parents=True,exist_ok=True)
styles=(root/'revisao/cabelos/index.html').read_text().split('<style>')[1].split('</style>')[0]
sections=[]
assets=[]
for id in ids:
    content=f'<section data-name="{html.escape(labels[id])}"><h2>{html.escape(labels[id])}</h2>'
    for view,label in [('three','Vista em 3/4'),('back','Costas e nuca')]:
        content+=f'<h3>{label}</h3><div class="pair">'
        for stage,folder,caption in [('antes','cabelos-reconstruidos/depois','Antes · e24a297'),('depois','cabelos-jogo/piloto','Adaptação para jogo')]:
            name=f'{stage}-{id}-{view}.webp'
            with Image.open(root/'renders'/folder/f'{id}-{view}.png') as image:
                assert image.size==(900,806)
                image.save(out/name,quality=90,method=6)
            assets.append(name)
            content+=f'<figure><a href="{name}"><img src="{name}" width="900" height="806" loading="lazy" alt="{html.escape(labels[id])}: {caption}"></a><figcaption>{caption}</figcaption></figure>'
        content+='</div>'
    sections.append(content+'</section>')
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cabelos para jogo — comparação</title><style>STYLES</style><main><a href="../../">Abrir o ateliê</a> · <a href="../cabelos/">Rodada anterior</a><h1>Cabelos estilizados para jogo</h1><p>Adaptação das bases existentes: mechas mais limpas, sulcos suaves e menos detalhes sobrepostos. Nove exemplos de cabelos curtos, longos, presos e ondulados, em 3/4 e de costas. As mudanças compartilhadas atendem aos 17 penteados do editor. Rostos, proporções, barbas, cores, acessórios e iluminação preservados.</p><label for="search">Encontrar personagem</label><br><input id="search" type="search" placeholder="Nome do personagem">SECTIONS</main><script>const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();document.getElementById('search').oninput=e=>document.querySelectorAll('section').forEach(s=>s.hidden=!normalize(s.dataset.name).includes(normalize(e.target.value)));</script></html>'''
(out/'index.html').write_text(page.replace('STYLES',styles).replace('SECTIONS',''.join(sections)))
(out/'manifest.json').write_text(json.dumps({'base':'e24a297','characters':ids,'assets':assets},ensure_ascii=False,indent=2))
print(f'{len(ids)} personagens, {len(assets)} imagens.')
