"""Publica somente capturas reais, depois de conferir catálogo, quadros e fontes."""
import hashlib
import html
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'revisao/altura-animacoes'
CAPTURES = ROOT / 'renders/altura-animacao'


def checked_report(name):
    data = json.loads((CAPTURES / name).read_text())
    assert not data['errors'], data['errors']
    for file, expected in data['sourceHashes'].items():
        assert hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == expected, file
    return data


catalogue = checked_report('catalogo-final/poses.json')
videos = checked_report('videos-finais/videos.json')
assert catalogue['sourceHashes'] == videos['sourceHashes']
metadata = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {PRESET_ORDER,PRESETS} from './src/presets.js';"
    "import {MOTIONS} from './src/motions.js';"
    "console.log(JSON.stringify({characters:PRESET_ORDER.map(id=>({id,label:PRESETS[id].label})),motions:MOTIONS}));"
], cwd=ROOT, text=True))
characters, motions = metadata['characters'], metadata['motions']
assert len(characters) == 34 and len(motions) == 5
expected_pairs = {(c['id'], motion) for c in characters for motion in motions}
assert {(r['id'], r['motion']) for r in catalogue['reports']} == expected_pairs
assert len(catalogue['reports']) == 170
assert all(r['frames'] == 3 for r in catalogue['reports'])
assert len(videos['reports']) == 3
assert sum(r['frames'] for r in videos['reports']) == 408
labels = {c['id']: c['label'] for c in characters}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'catalogo').mkdir(exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)


def sheet(images, captions, destination):
    canvas = Image.new('RGB', (400 * len(images), 498), '#203b50')
    draw = ImageDraw.Draw(canvas)
    for i, (source, caption) in enumerate(zip(images, captions)):
        frame = Image.open(source).convert('RGBA')
        assert frame.size == (400, 460)
        canvas.paste(frame, (i * 400, 0), frame)
        draw.text((i * 400 + 12, 468), caption, font=font, fill='#edf5fb')
    canvas.save(destination, quality=88, method=6)


items = []
for report in catalogue['reports']:
    folder = ROOT / report['folder']
    files = sorted(folder.glob('[0-9][0-9][0-9][0-9].png'))
    assert len(files) == 3, folder
    filename = f"catalogo/{report['id']}-{report['motion']}.webp"
    sheet(files, [f'{time:g} s' for time in report['times']], OUT / filename)
    items.append({key: report[key] for key in ['id', 'motion', 'times', 'camera']}
                 | {'image': filename})

comparisons = []
before_path = CAPTURES / 'comparacao-antes/poses.json'
if before_path.exists():
    before = json.loads(before_path.read_text())
    assert not before['errors']
    for report in videos['reports']:
        previous = next(r for r in before['reports'] if (r['id'], r['motion']) == (report['id'], report['motion']))
        assert previous['camera'] == report['camera']
        index = previous['times'].index(2)
        filename = f"comparacao-{report['id']}.webp"
        sheet([ROOT / previous['folder'] / f'{index:04d}.png',
               ROOT / report['folder'] / f'{2 * report["fps"]:04d}.png'],
              ['Antes · 791ed88', 'Agora · mesma pose e câmera'], OUT / filename)
        comparisons.append({'id': report['id'], 'image': filename, 'time': 2})

escape = html.escape
options = ''.join(f'<option value="{c["id"]}">{escape(c["label"])}</option>' for c in characters)
motion_options = ''.join(f'<option value="{key}">{escape(value["label"])}</option>' for key, value in motions.items())
cards = []
for r in videos['reports']:
    title = f'{labels[r["id"]]} · {motions[r["motion"]]["label"]}'
    cards.append(f'''<article><h3>{escape(title)}</h3>
<video controls muted playsinline {'loop' if motions[r['motion']]['loop'] else ''} preload="metadata" poster="{r['id']}-{r['motion']}.webp" width="400" height="460"><source src="{r['video']}" type="video/mp4"></video>
<p><a href="../../?v=altura-roupas-1&amp;personagem={r['id']}&amp;animacao={r['motion']}">Testar este movimento</a></p></article>''')
comparison_html = ''.join(f'''<article><h3>{escape(labels[r['id']])}</h3><img loading="lazy" src="{r['image']}" width="800" height="498" alt="{escape(labels[r['id']])}: antes e agora na mesma pose, em dois segundos."></article>''' for r in comparisons)
data = json.dumps({'characters': characters, 'motions': motions, 'items': items}, ensure_ascii=False).replace('</', '<\\/')
page = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Altura e roupas em movimento · Ateliê</title><style>
*{box-sizing:border-box}body{margin:0;background:#142331;color:#edf5fb;font:16px/1.5 system-ui}main{max-width:1080px;margin:auto;padding:24px}p,figcaption{color:#bed0db}a{color:#57dcd0}h1{line-height:1.15}h2{margin-top:40px}h3{font-size:18px}video,img{display:block;width:100%;height:auto;background:#203b50;border-radius:12px}video{max-width:480px}figure{margin:20px 0}label{display:grid;gap:6px;min-width:0}select{width:100%;min-width:0;padding:12px;background:#203b50;color:#edf5fb;border:1px solid #718895;border-radius:8px;font:inherit}.controls{display:grid;grid-template-columns:1fr 1fr;gap:16px}.videos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.comparisons{display:grid;gap:20px}article{min-width:0}figcaption{margin-top:10px}code{color:#cce8ee}@media(max-width:700px){main{padding:16px}.videos,.controls{grid-template-columns:1fr}video{max-width:100%}}
</style><main><a href="../../?v=altura-roupas-1">Abrir o ateliê</a>
<h1>Altura e roupas em movimento</h1>
<p>Em <strong>Corpo → Altura</strong>, escolha de 60% a 140%. O personagem inteiro muda de tamanho mantendo as proporções e o apoio dos pés. Os soldados cactos também receberam proporções menos achatadas.</p>
<p>Esta rodada corrige a separação de mangas e saias, o acompanhamento dos tecidos e a vinculação de escudos. A pele coberta por roupas opacas deixa de atravessar o figurino durante os movimentos; retirar a peça recupera o corpo completo.</p>
<h2>Vídeos completos</h2><p>Três casos de diagnóstico, a 24 quadros por segundo. Estas capturas usam materiais e luz neutros de revisão, sem sombras, em 400 px. Abra o editor para avaliar o acabamento de produção.</p>
<div class="videos">VIDEO_CARDS</div>
<h2>Catálogo · 34 personagens e cinco movimentos</h2><p>São 510 capturas reais, em três instantes de cada combinação. A câmera fica fixa durante o movimento de cada personagem. Para avaliar a continuidade, use a reprodução no editor.</p>
<div class="controls"><label>Personagem<select id="character">CHARACTER_OPTIONS</select></label><label>Movimento<select id="motion">MOTION_OPTIONS</select></label></div>
<figure><img id="poses" width="1200" height="498" alt=""><figcaption id="caption" aria-live="polite"></figcaption></figure><a id="try" href="../../?v=altura-roupas-1">Abrir esta combinação no editor</a>
COMPARISONS
<p>Movimentos: CMU Motion Capture, conversão BVH de Bruce Hahne. <a href="../../assets/motions/PROVENANCE.md">Fonte e créditos</a>. <a href="manifest.json">Registro das fontes e capturas</a>.</p>
<script id="capture-data" type="application/json">CAPTURE_DATA</script><script>
const data=JSON.parse(document.getElementById('capture-data').textContent),character=document.getElementById('character'),motion=document.getElementById('motion');
function show(){const item=data.items.find(r=>r.id===character.value&&r.motion===motion.value),name=data.characters.find(c=>c.id===item.id).label,label=data.motions[item.motion].label;document.getElementById('poses').src=item.image;document.getElementById('poses').alt=name+' · '+label+' · três instantes do movimento';document.getElementById('caption').textContent=name+' · '+label+' · '+item.times.map(t=>t.toLocaleString('pt-BR')+' s').join(' / ');document.getElementById('try').href='../../?v=altura-roupas-1&personagem='+item.id+'&animacao='+item.motion}
character.value='masculine_soft';motion.value='dance_shuffle';character.addEventListener('change',show);motion.addEventListener('change',show);show();
</script></main></html>'''
for token, value in [('VIDEO_CARDS', ''.join(cards)), ('CHARACTER_OPTIONS', options), ('MOTION_OPTIONS', motion_options), ('CAPTURE_DATA', data), ('COMPARISONS', '<h2>Mesma pose e câmera · antes e agora</h2><div class="comparisons">' + comparison_html + '</div>' if comparisons else '')]:
    page = page.replace(token, value)
(OUT / 'index.html').write_text(page)
(OUT / 'manifest.json').write_text(json.dumps({
    'characters': 34, 'motions': 5, 'poseFrames': 510, 'videoFrames': 408,
    'fps': videos['reports'][0]['fps'], 'width': 400, 'height': 460, 'neutral': True, 'shadows': False,
    'sourceHashes': catalogue['sourceHashes'], 'videos': videos['reports'],
    'comparisons': comparisons, 'catalogue': items,
}, ensure_ascii=False, indent=2))
print('OK: 34 personagens, cinco movimentos, 510 poses e três vídeos completos; fontes conferidas.')
