"""Comparação dos quatro modelos reais, incluindo o figurino e a silhueta inteira."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'renders/ref-personagem'
out = root / 'revisao/personagens'
out.mkdir(parents=True, exist_ok=True)
names = {'nana_explorer': 'Nana exploradora', 'nico_inventor': 'Nico inventor',
         'bread_vigilante': 'Vigilante', 'bread_baker': 'Padeiro · mesma identidade'}
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
cards = ''.join(f'<section id="{key}"><h2>{name}</h2><div class="pair">' + ''.join(
    f'<figure><img width="900" height="806" loading="lazy" data-id="{key}" data-version="{version}" '
    f'src="{version}-{key}-body-three.webp" alt="{name}: {label}"><figcaption>{label}</figcaption></figure>'
    for version, label in [('before', 'Antes · c2baedb reprovado'), ('after', 'Revisão atual')]) + '</div></section>'
    for key, name in names.items())
buttons = ''.join(f'<button type="button" data-view="{key}" aria-pressed="{str(key == "body-three").lower()}">{name}</button>' for key, name in views.items())
html = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisão dos personagens completos</title><style>
*{box-sizing:border-box}body{margin:0;background:#112330;color:#eaf1f6;font:17px/1.5 system-ui,sans-serif}main{max-width:1250px;margin:auto;padding:24px}h1{font-size:clamp(25px,4vw,40px);line-height:1.2}p{max-width:850px;color:#c0cfd9}a{color:#42d8d0}nav{display:flex;flex-wrap:wrap;gap:9px;margin:22px 0}button{font:inherit;border:1px solid #4e6c80;border-radius:9px;padding:10px 16px;background:#203b4d;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#39d2ca;color:#102330}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;border-radius:15px;overflow:hidden;background:#203b4d}img{display:block;width:100%;height:auto}figcaption{padding:13px 18px;font-weight:600}section{margin:36px 0 50px}h2{font-size:26px}@media(max-width:600px){main{padding:15px}.pair{gap:8px}figcaption{font-size:12px;padding:8px}h2{font-size:23px}}
</style><main><a href="../../">Abrir o ateliê</a><h1>Nana, Nico e Vigilante — personagem completo</h1>
<p>Comparação com a versão reprovada c2baedb. Rosto, cabelo, proporções e figurino são malhas reais do ateliê. As duas versões usam a mesma câmera e iluminação. Esta revisão ainda depende de avaliação visual; os testes técnicos não comprovam semelhança com as referências.</p><nav aria-label="Ângulo da comparação">BUTTONS</nav>CARDS</main>
<script>document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('img[data-id]').forEach(img=>{img.src=img.dataset.version+'-'+img.dataset.id+'-'+button.dataset.view+'.webp'})}));</script></html>'''.replace('BUTTONS', buttons).replace('CARDS', cards)
(out / 'index.html').write_text(html)
(out / 'manifest.json').write_text(json.dumps({'base': 'c2baedb', 'status': 'revisão visual', 'characters': names, 'views': views, 'assets': assets}, ensure_ascii=False, indent=2))
print(f'{len(names)} personagens, {len(views)} vistas, {len(assets)} imagens reais; câmeras iguais.')
