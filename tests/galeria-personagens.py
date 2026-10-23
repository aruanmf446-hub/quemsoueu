"""Comparação dos quatro modelos reais, incluindo o figurino e a silhueta inteira."""
import json
import argparse
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--renders', default='renders/ajustes-prioritarios')
parser.add_argument('--base', default='f9b83df')
args = parser.parse_args()
source = root / args.renders
out = root / 'revisao/personagens'
out.mkdir(parents=True, exist_ok=True)
names = {'nico_inventor': 'Nico inventor', 'nana_explorer': 'Nana exploradora',
         'bread_vigilante': 'Vigilante', 'bread_baker': 'Padeiro · controle preservado'}
views = {'body-front': 'Frente', 'body-three': 'Corpo em 3/4', 'body-back': 'Costas', 'three': 'Rosto e acessórios'}
before = json.loads((source / 'before/cameras.json').read_text())
after = json.loads((source / 'after/cameras.json').read_text())
assets = []
for character in names:
    for view in views:
        # OrbitControls pode arredondar a posição em 1e-15 ao reaplicar a câmera.
        for field in ['position', 'target']:
            assert all(abs(a-b) < 1e-10 for a, b in zip(before[character][view][field], after[character][view][field])), (character, view, 'câmeras diferentes')
        for version in ['before', 'after']:
            name = f'{version}-{character}-{view}.webp'
            with Image.open(source / version / f'{character}-{view}.png') as im:
                assert im.size == (900, 806)
                im.save(out / name, quality=90, method=6)
            assets.append(name)
cards = ''
for key, name in names.items():
    cards += f'<section id="{key}"><h2>{name}</h2><div class="pair">'
    for version, label in [('before', f'Antes · {args.base} reprovado'), ('after', 'Revisão atual')]:
        cards += f'<figure><img width="900" height="806" loading="lazy" data-id="{key}" data-version="{version}" src="{version}-{key}-body-three.webp" alt="{name}: {label}"><figcaption>{label}</figcaption></figure>'
    cards += '</div>'
    if key == 'nana_explorer':
        cards += '<details><summary>Ver os tênis de perto</summary><div class="pair">'
        for version, label in [('before', 'Tênis anterior'), ('after', 'Cabedal e sola revisados')]:
            filename = f'{version}-{key}-feet.webp'
            for field in ['position', 'target']:
                assert all(abs(a-b)<1e-10 for a,b in zip(before[key]['feet'][field],after[key]['feet'][field]))
            with Image.open(source / version / f'{key}-feet.png') as im:
                assert im.size == (900,806)
                im.save(out / filename, quality=92, method=6)
            assets.append(filename)
            cards += f'<figure><img class="feet-detail" width="900" height="806" loading="lazy" src="{filename}" alt="{label}"><figcaption>{label}</figcaption></figure>'
        cards += '</div></details>'
    cards += '</section>'
buttons = ''.join(f'<button type="button" data-view="{key}" aria-pressed="{str(key == "body-three").lower()}">{name}</button>' for key, name in views.items())
html = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisão dos personagens completos</title><style>
*{box-sizing:border-box}body{margin:0;background:#112330;color:#eaf1f6;font:17px/1.5 system-ui,sans-serif}main{max-width:1250px;margin:auto;padding:24px}h1{font-size:clamp(25px,4vw,40px);line-height:1.2}p{max-width:850px;color:#c0cfd9}a{color:#42d8d0}nav{display:flex;flex-wrap:wrap;gap:9px;margin:22px 0}button{font:inherit;border:1px solid #4e6c80;border-radius:9px;padding:10px 16px;background:#203b4d;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#39d2ca;color:#102330}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;border-radius:15px;overflow:hidden;background:#203b4d}img{display:block;width:100%;height:auto}figcaption{padding:13px 18px;font-weight:600}section{margin:36px 0 50px}details{margin-top:18px}summary{cursor:pointer;padding:12px;color:#42d8d0}h2{font-size:26px}@media(max-width:600px){main{padding:15px}.pair{gap:8px}figcaption{font-size:12px;padding:8px}h2{font-size:23px}}
</style><main><a href="../../">Abrir o ateliê</a><h1>Nico, Nana e Vigilante — ajustes prioritários</h1>
<p>Comparação com a versão reprovada BASE_REPROVADA. Nico foi reduzido e afinado na malha. Nana recebeu visor panorâmico e tênis com cabedal próprio. O capuz do Vigilante cobre a cabeça e desce aos ombros; a máscara envolve nariz e boca. As comparações usam a mesma câmera e iluminação. O Padeiro serve como controle preservado.</p><nav aria-label="Ângulo da comparação">BUTTONS</nav>CARDS</main>
<script>document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('img[data-id]').forEach(img=>{img.src=img.dataset.version+'-'+img.dataset.id+'-'+button.dataset.view+'.webp'})}));</script></html>'''.replace('BUTTONS', buttons).replace('CARDS', cards).replace('BASE_REPROVADA', args.base)
(out / 'index.html').write_text(html)
(out / 'manifest.json').write_text(json.dumps({'base': args.base, 'status': 'revisão visual', 'characters': names, 'views': views, 'assets': assets}, ensure_ascii=False, indent=2))
print(f'{len(names)} personagens, {len(views)} vistas, {len(assets)} imagens reais; câmeras iguais.')
