"""Galeria de escultura facial com câmeras iguais e imagens reais, sem retoque.

Uso: python3 tests/galeria-identidades.py renders/identidades
"""
import json
import math
import struct
import sys
from html import escape
from pathlib import Path

root = Path(sys.argv[1])
before = json.loads((root / 'antes/cameras.json').read_text())
after = json.loads((root / 'depois/cameras.json').read_text())
assert set(before) == set(after), 'Faltam personagens na comparação'
assert len(after) == 34, 'A galeria deve incluir os 34 personagens'
for phase in ['antes', 'depois']:
    report = json.loads((root / phase / 'relatorio.json').read_text())
    assert not report['errors'], f'Erros de renderização em {phase}'
views = [('front', 'Frente'), ('three', 'Três quartos'), ('side', 'Perfil'), ('malha', 'Malha sem cores')]
sections = []
for identity in after:
    for view in ['front', 'three', 'side']:
        # OrbitControls recompõe coordenadas em ponto flutuante; aceita só o arredondamento numérico.
        for key in ['position', 'target']:
            a, b = before[identity][view][key], after[identity][view][key]
            assert len(a) == len(b) == 3
            assert all(math.isfinite(x) and math.isfinite(y) and abs(x-y) <= 1e-10 for x, y in zip(a, b)), f'Câmera divergente: {identity}/{view}/{key}'
    content = []
    for view, title in views:
        images = []
        sizes = []
        for phase, label in [('antes', 'Antes'), ('depois', 'Depois')]:
            path = root / phase / f'{identity}-{view}.png'
            data = path.read_bytes()
            assert data[:8] == b'\x89PNG\r\n\x1a\n', f'PNG inválido: {path}'
            sizes.append(struct.unpack('>II', data[16:24]))
            src = escape(f'{phase}/{identity}-{view}.png')
            images.append(f'<figure><figcaption>{label}</figcaption><a href="{src}"><img loading="lazy" src="{src}" alt="{escape(identity)} — {label}"></a></figure>')
        assert sizes[0] == sizes[1], f'Tamanho divergente: {identity}/{view}'
        content.append(f'<div class="pair" data-view="{view}" {"hidden" if view != "three" else ""}><h3>{title}</h3><div class="images">{"".join(images)}</div></div>')
    sections.append(f'<section id="{escape(identity)}"><h2>{escape(identity.replace("_", " "))}</h2>{"".join(content)}</section>')
document = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escultura facial — 34 identidades</title><style>
body{font:16px system-ui;background:#16202a;color:#eef2f5;margin:24px auto;max-width:1300px;padding:0 16px}p{max-width:850px;color:#bbc8d1;line-height:1.6}nav{position:sticky;top:0;background:#16202a;padding:12px 0;display:flex;gap:8px;flex-wrap:wrap}button{font:inherit;background:#26394a;color:white;border:1px solid #6e899a;border-radius:6px;padding:10px;cursor:pointer}button[aria-pressed=true]{background:#196b70}section{margin:40px 0}h2{text-transform:capitalize}h3{font-size:16px;color:#bbc8d1}.images{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}figcaption{margin-bottom:8px}img{width:100%;height:auto;border-radius:8px}a{color:#8fe7e0}@media(max-width:650px){.images{grid-template-columns:1fr}}
</style><h1>Escultura facial — 34 identidades</h1><p>Comparação dos rostos com a mesma câmera. Cabelo, acessórios e figurino ficam ocultos para expor a forma do rosto. A vista de malha remove as cores da superfície. São capturas reais do Ateliê; esta comparação não representa aprovação estética.</p><nav>'''
document += ''.join(f'<button data-select="{view}" aria-pressed="{"true" if view == "three" else "false"}">{title}</button>' for view, title in views)
document += '</nav>' + ''.join(sections)
document += '''<script>document.querySelectorAll('[data-select]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-view]').forEach(p=>p.hidden=p.dataset.view!==button.dataset.select)});</script></html>'''
(root / 'index.html').write_text(document, encoding='utf-8')
print(f'Galeria validada: {len(after)} identidades, {len(after)*len(views)} pares e câmeras idênticas.')
