"""Monta uma galeria auditável a partir dos renders reais, sem retocar os personagens.

Uso:
  python3 tests/galeria-herois.py /workspace/outputs/hero/comparacao \
    --referencia 77e1b9e --versao COMMIT \
    --entrega /workspace/outputs/entrega-herois \
    --relatorio /caminho/relatorio.json

São obrigatórios os três ângulos dos 20 personagens em antes/ e depois/.
O Guardião da chama e os closes de rosto entram apenas se suas capturas existirem.
enquadramento-atual/ pode acrescentar três vistas atuais com câmera independente;
essas imagens nunca entram na certificação dos 60 pares de comparação.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from html import escape
from pathlib import Path
import shutil
import zipfile

from PIL import Image, ImageDraw, ImageFont


LABELS = {
    'paysandu_wolf': 'Paysandu',
    'nana_explorer': 'Nana exploradora',
    'moon_guardian': 'Guardiã da Lua',
    'nico_inventor': 'Nico inventor',
    'ruby_sorceress': 'Feiticeira rubi',
    'ruby_raven': 'Corvo rubi',
    'forest_archer_f': 'Arqueira da floresta',
    'forest_archer_m': 'Arqueiro da floresta',
    'forest_guard_f': 'Guarda feminina',
    'forest_guard_m': 'Guarda jovem',
    'forest_guard_veteran': 'Guarda veterano',
    'forest_artificer': 'Artífice da floresta',
    'forest_princess': 'Princesa da floresta',
    'frontier_cowboy': 'Cowboy do deserto',
    'desert_fennec': 'Feneco do deserto',
    'cowboy_on_fennec': 'Cowboy no feneco',
    'bread_baker': 'Padeiro',
    'bread_vigilante': 'Vigilante',
    'cactus_soldier': 'Soldado cacto',
    'cactus_soldier_large': 'Soldado cacto grande',
}
EXTRAS = {'flame_guardian': 'Guardião da chama'}
VIEWS = {'front': 'Frente', 'three': '3/4', 'back': 'Costas'}
GROUPS = {
    'reino-lua': list(LABELS)[:6],
    'floresta': list(LABELS)[6:13],
    'deserto': list(LABELS)[13:],
}
BACKGROUND, TURQUOISE = '#0c1a28', '#35d6d4'
FONT_FILE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_image(path: Path) -> Image.Image:
    with Image.open(path) as image:
        return image.convert('RGB')


def validate_cameras(root: Path, ids: list[str]) -> dict:
    paths = [root / folder / 'cameras.json' for folder in ('antes', 'depois')]
    if not any(path.exists() for path in paths):
        return {'verificadas': False, 'motivo': 'Metadados de câmera não fornecidos.'}
    if not all(path.exists() for path in paths):
        raise ValueError('Há câmeras de somente uma versão; forneça ambas para compará-las.')
    before, after = [json.loads(path.read_text(encoding='utf-8')) for path in paths]
    maximum = 0.0
    for id in ids:
        for view in VIEWS:
            for key in ('position', 'target'):
                left, right = before[id][view][key], after[id][view][key]
                if len(left) != 3 or len(right) != 3:
                    raise ValueError(f'Câmera incompleta: {id}/{view}/{key}')
                delta = max(abs(a - b) for a, b in zip(left, right))
                maximum = max(maximum, delta)
                if delta > 1e-6:
                    raise ValueError(f'Câmeras diferentes em {id}/{view}: desvio {delta:.6g}')
    return {'verificadas': True, 'pares': len(ids) * len(VIEWS), 'desvioMaximo': maximum}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', type=Path, default=Path('renders/herois/comparacao'))
    parser.add_argument('--referencia', default='77e1b9e')
    parser.add_argument('--versao', default='em-refinamento')
    parser.add_argument('--titulo', default='Reconstrução dos heróis')
    parser.add_argument('--entrega', type=Path)
    parser.add_argument('--relatorio', type=Path, action='append', default=[])
    args = parser.parse_args()
    root = args.root.resolve()
    delivery = (args.entrega or root.parent / 'entrega-herois').resolve()
    if not root.is_dir():
        raise FileNotFoundError(root)

    labels = dict(LABELS)
    for id, label in EXTRAS.items():
        present = [(root / 'depois' / f'{id}-{view}.png').exists() for view in VIEWS]
        if any(present):
            if not all(present):
                raise FileNotFoundError(f'Nova referência incompleta: {id}')
            labels[id] = label
    groups = dict(GROUPS)
    if len(labels) > len(LABELS):
        groups['nova-referencia'] = [id for id in labels if id in EXTRAS]

    # Valida tudo antes de gerar a primeira prancha, evitando uma entrega parcialmente renovada.
    sources, independent = {}, {}
    for id in labels:
        folders = ('antes', 'depois') if id in LABELS else ('depois',)
        for view in VIEWS:
            sizes = []
            for folder in folders:
                path = root / folder / f'{id}-{view}.png'
                if not path.is_file():
                    raise FileNotFoundError(f'Captura ausente: {path}')
                image = read_image(path)
                sizes.append(image.size)
                sources[str(path.relative_to(root))] = sha256(path)
            if len(set(sizes)) > 1:
                raise ValueError(f'Resoluções diferentes: {id}/{view}')
        for folder in folders:
            path = root / folder / f'{id}-face.png'
            if path.is_file():
                sources[str(path.relative_to(root))] = sha256(path)
        fit_paths = [root / 'enquadramento-atual' / f'{id}-{view}.png' for view in VIEWS]
        if any(path.is_file() for path in fit_paths):
            if not all(path.is_file() for path in fit_paths):
                raise FileNotFoundError(f'Enquadramento atual independente incompleto: {id}')
            independent[id] = fit_paths
            for path in fit_paths:
                read_image(path)
                sources[str(path.relative_to(root))] = sha256(path)
    cameras = validate_cameras(root, list(LABELS))
    font, small = [ImageFont.truetype(FONT_FILE, size) for size in (18, 14)]
    generated, rows, articles = [], [], []

    def save_image(image: Image.Image, name: str) -> str:
        image.save(root / name, quality=94, subsampling=0)
        generated.append(name)
        return name

    def comparison(id: str, view: str, title: str) -> tuple[str, str]:
        label = labels[id]
        after_path = root / 'depois' / f'{id}-{view}.png'
        before_path = root / 'antes' / f'{id}-{view}.png'
        paired = id in LABELS and before_path.is_file()
        images = [read_image(path) for path in ([before_path, after_path] if paired else [after_path])]
        if len({image.size for image in images}) > 1:
            raise ValueError(f'Resoluções diferentes: {id}/{view}')
        width, height = images[0].size
        sheet = Image.new('RGB', (len(images) * width, height + 78), BACKGROUND)
        draw = ImageDraw.Draw(sheet)
        draw.text((16, 10), f'{label} · {title}', fill='white', font=font)
        captions = [f'ANTERIOR · {args.referencia}', 'EM REFINAMENTO · pendente de aprovação'] if paired else ['NOVA CAPTURA · sem versão anterior']
        for index, (image, caption) in enumerate(zip(images, captions)):
            sheet.paste(image, (index * width, 78))
            draw.text((index * width + 16, 44), caption, fill=TURQUOISE, font=small)
        name = save_image(sheet, f'{"comparacao" if paired else "atual"}-{id}-{view}.jpg')
        kind = 'comparacao' if paired else 'captura-atual'
        rows.append({'personagem': id, 'nome': label, 'vista': view, 'tipo': kind,
                     'referencia': args.referencia if paired else '', 'versao': args.versao,
                     'arquivo': name, 'sha256': sha256(root / name), 'aprovacao': 'pendente'})
        caption = f'{title} · anterior e em refinamento' if paired else f'{title} · sem captura anterior para comparar'
        figure = (f'<figure data-view="{view}"><a href="{name}"><img loading="lazy" '
                  f'src="{name}" alt="{escape(label)}: {escape(caption)}"></a>'
                  f'<figcaption>{escape(caption)}</figcaption></figure>')
        return name, figure

    for id, label in labels.items():
        cards = [comparison(id, view, title)[1] for view, title in VIEWS.items()]
        if (root / 'depois' / f'{id}-face.png').is_file():
            cards.append(comparison(id, 'face', 'Rosto')[1])
        if id in independent:
            for view, title in VIEWS.items():
                path = root / 'enquadramento-atual' / f'{id}-{view}.png'
                image = read_image(path)
                sheet = Image.new('RGB', (image.width, image.height + 98), BACKGROUND)
                draw = ImageDraw.Draw(sheet)
                draw.text((16, 10), f'{label} · {title}', fill='white', font=font)
                draw.text((16, 43), 'ENQUADRAMENTO PRÓPRIO ATUAL', fill=TURQUOISE, font=small)
                draw.text((16, 67), 'Câmera independente · sem comparação com versão anterior', fill='#b9cbd8', font=small)
                sheet.paste(image, (0, 98))
                name = save_image(sheet, f'enquadramento-{id}-{view}.jpg')
                # Conserva também o PNG verdadeiro deste enquadramento adicional no pacote.
                generated.append(str(path.relative_to(root)))
                rows.append({'personagem': id, 'nome': label, 'vista': view, 'tipo': 'enquadramento-independente',
                             'referencia': '', 'versao': args.versao, 'arquivo': name,
                             'sha256': sha256(root / name), 'aprovacao': 'pendente'})
                cards.append(f'<figure data-view="{view}"><a href="{name}"><img loading="lazy" '
                             f'src="{name}" alt="{escape(label)}: {title}, enquadramento atual independente"></a>'
                             f'<figcaption>{title} · enquadramento próprio atual, com câmera independente; '
                             'não é um par antes/depois. '
                             f'<a href="{escape(str(path.relative_to(root)))}">Abrir PNG original</a></figcaption></figure>')
        articles.append(f'<article data-label="{escape(label.lower())}"><h2>{escape(label)}</h2>{"".join(cards)}</article>')

        # Três ângulos na mesma imagem. Novas referências têm só as três imagens atuais.
        folders = ('antes', 'depois') if id in LABELS else ('depois',)
        sample = read_image(root / 'depois' / f'{id}-front.png')
        thumb_width = 280
        thumb_height = round(sample.height * thumb_width / sample.width)
        sheet = Image.new('RGB', (thumb_width * len(folders) * len(VIEWS), thumb_height + 92), BACKGROUND)
        draw = ImageDraw.Draw(sheet)
        draw.text((16, 12), f'{label} · pendente de aprovação', fill='white', font=font)
        for j, (view, title) in enumerate(VIEWS.items()):
            for i, folder in enumerate(folders):
                image = read_image(root / folder / f'{id}-{view}.png')
                image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
                x = (j * len(folders) + i) * thumb_width
                sheet.paste(image, (x + (thumb_width - image.width) // 2, 92))
                draw.text((x + 8, 58), f'{title} · {"anterior" if folder == "antes" else "em refinamento"}', fill=TURQUOISE, font=small)
        save_image(sheet, f'prancha-{id}.jpg')

    for group, ids in groups.items():
        width = 220
        sample = read_image(root / 'depois' / f'{ids[0]}-three.png')
        height = round(sample.height * width / sample.width)
        columns = min(2, len(ids))
        cell_height = height + 72
        sheet = Image.new('RGB', (width * 2 * columns, cell_height * ((len(ids) + columns - 1) // columns) + 56), BACKGROUND)
        draw = ImageDraw.Draw(sheet)
        draw.text((14, 14), f'Ateliê · {group.replace("-", " ").title()} · em refinamento', fill='white', font=font)
        for j, id in enumerate(ids):
            x, y = j % columns * width * 2, j // columns * cell_height + 56
            draw.text((x + 8, y + 3), labels[id], fill='white', font=small)
            folders = ('antes', 'depois') if id in LABELS else ('depois',)
            for k, folder in enumerate(folders):
                draw.text((x + k * width + 8, y + 29), 'ANTERIOR' if folder == 'antes' else 'EM REFINAMENTO', fill=TURQUOISE, font=small)
                image = read_image(root / folder / f'{id}-three.png')
                image.thumbnail((width, height), Image.Resampling.LANCZOS)
                sheet.paste(image, (x + k * width, y + 56))
        save_image(sheet, f'resumo-{group}.jpg')

    camera_note = ('As câmeras dos 60 pares obrigatórios foram conferidas nos metadados.'
                   if cameras['verificadas'] else 'Metadados de câmera não fornecidos; o enquadramento não foi certificado.')
    page = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title><style>
:root{color-scheme:dark}body{background:#0c1a28;color:#edf3fa;font:16px system-ui;margin:24px}
header{position:sticky;top:0;background:#0c1a28ed;backdrop-filter:blur(8px);padding:12px 0;z-index:2}
img{display:block;width:100%;border-radius:12px}article{margin:40px 0;max-width:1320px}figure{margin:18px 0}
a{color:#35d6d4}button,input{font:inherit;background:#1b3145;border:1px solid #4c687f;color:white;border-radius:8px;padding:9px;margin:4px}
button[aria-pressed=true]{background:#207a7a}h1{font-size:28px}h2{font-size:21px}p{max-width:1050px;line-height:1.5}figcaption{color:#afc3d5}
figure[hidden],article[hidden]{display:none}.links{font-size:14px}.note{color:#b9cbd8}@media(max-width:600px){body{margin:12px}h1{font-size:23px}header{position:static}}
</style><header><h1>__TITLE__</h1><p>__COUNT__ personagens. A versão anterior (__BASE__) fica à esquerda; a versão em refinamento fica à direita. Novas referências sem versão anterior são identificadas separadamente.</p>
<p class="note">__CAMERAS__ As imagens identificadas como enquadramento próprio atual têm câmera independente e não integram essa comparação. Todos os personagens continuam pendentes de aprovação explícita do usuário. Os testes técnicos não representam aprovação estética.</p>
<p class="links"><a href="inventario.csv">Inventário CSV</a> · <a href="manifesto.json">Manifesto e hashes SHA-256</a></p>
<div><input id="search" placeholder="Buscar personagem" aria-label="Buscar personagem"><button data-view="front" aria-pressed="true">Frente</button><button data-view="three" aria-pressed="false">3/4</button><button data-view="back" aria-pressed="false">Costas</button><button data-view="face" aria-pressed="false">Rosto</button><button data-view="all" aria-pressed="false">Todas</button></div></header>
__ARTICLES__<script>
let view='front';function filter(){const q=document.getElementById('search').value.toLocaleLowerCase('pt-BR');document.querySelectorAll('article').forEach(a=>{const match=a.dataset.label.includes(q);a.hidden=!match;let count=0;a.querySelectorAll('figure').forEach(f=>{f.hidden=view!=='all'&&f.dataset.view!==view;if(!f.hidden)count++});a.hidden=!match||!count})}
document.querySelectorAll('button').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()});document.getElementById('search').oninput=filter;filter();
</script></html>'''
    for key, value in {'TITLE': escape(args.titulo), 'COUNT': str(len(labels)), 'BASE': escape(args.referencia),
                       'CAMERAS': escape(camera_note), 'ARTICLES': ''.join(articles)}.items():
        page = page.replace(f'__{key}__', value)
    (root / 'index.html').write_text(page, encoding='utf-8')
    generated.append('index.html')
    with (root / 'inventario.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    generated.append('inventario.csv')

    (root / 'LEIA-ME.txt').write_text(
        f'ATELIÊ — {args.titulo}\n\nExtraia o ZIP e abra index.html no navegador.\n'
        f'Referência: {args.referencia}. Versão em avaliação: {args.versao}.\n'
        'Os 20 personagens originais têm frente, 3/4 e costas em pares.\n'
        'Closes de rosto e a nova referência entram somente quando há capturas reais.\n'
        'Uma imagem sem captura anterior é identificada; não foi inventada uma versão anterior.\n'
        'Enquadramentos próprios atuais, quando presentes, usam câmeras independentes e não são pares antes/depois.\n'
        'Todos os personagens permanecem pendentes de aprovação explícita.\n'
        f'{camera_note}\n'
        'O gerador apenas compõe e redimensiona os PNGs do navegador, sem retocar os personagens.\n', encoding='utf-8')
    generated.append('LEIA-ME.txt')
    for folder in ('antes', 'depois'):
        for name in ('cameras.json', 'relatorio.json'):
            path = root / folder / name
            if path.exists():
                generated.append(str(path.relative_to(root)))
    reports = []
    for i, report in enumerate(args.relatorio, 1):
        data = json.loads(report.read_text(encoding='utf-8'))
        target = root / 'verificacao' / f'{i:02d}-{report.name}'
        target.parent.mkdir(exist_ok=True)
        shutil.copy2(report, target)
        generated.append(str(target.relative_to(root)))
        reports.append({'arquivo': str(target.relative_to(root)), 'erros': data.get('errors'),
                        'quantidadeRegistros': len(data.get('reports', data.get('ids', [])))})
    summary = {'personagens': len(labels), 'paresObrigatorios': 60,
               'paresDeRosto': sum(row['vista'] == 'face' and row['tipo'] == 'comparacao' for row in rows),
               'capturasSemAnterior': sum(row['tipo'] == 'captura-atual' for row in rows),
               'enquadramentosIndependentes': sum(row['tipo'] == 'enquadramento-independente' for row in rows),
               'pranchas': len(labels), 'resumos': len(groups)}
    manifest = {'referencia': args.referencia, 'versao': args.versao, 'titulo': args.titulo,
                'aprovacao': 'Todos os personagens aguardam concordância explícita do usuário.',
                'contagens': summary, 'cameras': cameras, 'relatoriosIncluidos': reports,
                'capturasFonteSha256': sources,
                'arquivosSha256': {name: sha256(root / name) for name in sorted(generated)}}
    (root / 'manifesto.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    generated.append('manifesto.json')
    delivery.mkdir(parents=True, exist_ok=True)
    archive = delivery / 'herois-em-refinamento.zip'
    # Lista fechada: não inclui capturas intermediárias, logs antigos ou outros ZIPs da pasta.
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for name in sorted(generated):
            zip_file.write(root / name, name)
    with zipfile.ZipFile(archive) as zip_file:
        if zip_file.testzip() is not None:
            raise ValueError('Falha de integridade no ZIP')
    for group in groups:
        shutil.copy2(root / f'resumo-{group}.jpg', delivery / f'resumo-{group}.jpg')
    shutil.copy2(root / 'manifesto.json', delivery / 'manifesto.json')
    print(json.dumps({'galeria': str(root / 'index.html'), 'zip': str(archive),
                      'zipSha256': sha256(archive), **summary}, ensure_ascii=False))


if __name__ == '__main__':
    main()
