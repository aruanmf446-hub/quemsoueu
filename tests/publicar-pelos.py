"""Publica a comparação completa, após conferir as câmeras na galeria de origem."""
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'renders/pelos-catalogo'
out = root / 'revisao/pelos'
subprocess.run(['python', str(root / 'tests/galeria-pelos.py'), str(source)], check=True, cwd=root)
out.mkdir(parents=True, exist_ok=True)
assets = []
jobs = []
for stage in ['antes', 'depois']:
    (out / stage).mkdir(exist_ok=True)
    for entry in json.loads((source / 'catalogo.json').read_text()):
        for view in ['front', 'three', 'back']:
            name = f'{stage}/{entry["id"]}-{view}.webp'
            jobs.append((source / stage / f'{entry["id"]}-{view}.png', out / name))
            assets.append(name)
# Expressões da barba também precisam de arquivos publicados, não só links.
for image in sorted((source / 'depois').glob('*-pose-*.png')):
    name = 'depois/' + image.with_suffix('.webp').name
    jobs.append((image, out / name))
    assets.append(name)
def convert(job):
    image, target = job
    with Image.open(image) as im:
        im.save(target, quality=90, method=6)
with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(convert, jobs))
page = (source / 'index.html').read_text().replace('.png', '.webp')
page = page.replace('<header><h1>', '<a href="../../">Abrir o ateliê</a><header><h1>')
page = page.replace('Cabelos, barbas e acessórios —', 'Cabelos e barbas —')
page = page.replace('Os modelos e penteados existentes foram mantidos.', 'Base aprovada a2a9445. Rostos, corpos, roupas e acessórios preservados. As mechas e barbas receberam revisão de geometria; personagens sem esses pelos aparecem como controle preservado.')
(out / 'index.html').write_text(page)
(out / 'manifest.json').write_text(json.dumps({'base': 'a2a9445', 'characters': json.loads((source / 'catalogo.json').read_text()), 'assets': assets}, ensure_ascii=False, indent=2))
print(f'Comparação pública: {len(assets)} imagens, 34 personagens.')
